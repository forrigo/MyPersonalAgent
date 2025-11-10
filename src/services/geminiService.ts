import { GoogleGenAI } from "@google/genai";
import type { Permissions, Message, AgendaItem, TodoItem } from '../../types';

// FIX: API key must be obtained from process.env.API_KEY per coding guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageName = (langCode: string): string => {
    const map: { [key: string]: string } = {
        'en-US': 'English',
        'pt-BR': 'Brazilian Portuguese',
    };
    return map[langCode] || 'English';
}

export const getOnboardingMessage = async (language: string): Promise<string> => {
    const languageName = getLanguageName(language);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a friendly and welcoming message for a user who is opening a personal AI assistant app for the first time. The message should be brief, introduce yourself as their personal AI agent, and encourage them to configure permissions to get started. IMPORTANT: The response must be written in ${languageName}.`,
    });
    return response.text ?? "Welcome! Let's get started.";
};

const buildContext = (permissions: Permissions, agendaItems: AgendaItem[], todoItems: TodoItem[], googleConnected: boolean): string => {
    if (!googleConnected) {
        return "No data is available. The user has not connected their account yet. Inform the user that they need to connect their account in settings to get started.";
    }

    let context = "This is the user's current data based on the permissions they granted. Use this to inform your responses.\n";
    let hasData = false;
    
    // FIX: Simplified check for permission.
    if (permissions.agenda) {
        hasData = true;
        context += "\n## Today's Agenda\n";
        if (agendaItems.length > 0) {
            agendaItems.forEach(item => {
                context += `- ${item.time} ${item.title}\n`;
            });
        } else {
            context += "No agenda items for today.\n";
        }
    }

    // FIX: Simplified check for permission.
    if (permissions.todos) {
        hasData = true;
        context += "\n## To-Do List (Pending)\n";
        if (todoItems.length > 0) {
            todoItems.forEach(item => {
                context += `- ${item.title}\n`;
            });
        } else {
             context += "No pending to-do items.\n";
        }
    }
    
    // FIX: Added email permission context for consistency.
    if (permissions.email) {
        context += "\n## Emails\n";
        context += "Email access is enabled, but email data is not yet available in this context. You can inform the user you can see they have granted permission, but cannot yet read emails.\n";
    }

    if (!hasData) {
        return "The user has connected their account, but has not granted any permissions for you to view the data. Ask them to enable permissions in settings.";
    }

    return context;
};

export const getInitialAgentMessage = async (permissions: Permissions, agenda: AgendaItem[], todos: TodoItem[], googleConnected: boolean, language: string): Promise<string> => {
    const context = buildContext(permissions, agenda, todos, googleConnected);
    const languageName = getLanguageName(language);
    const prompt = `You are a personal AI assistant. The user has just connected their account. Based on their data below, provide a helpful and proactive summary of their day and ask how you can help. Be friendly and concise. IMPORTANT: The entire response must be in ${languageName}.\n\n${context}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text ?? "How can I help you today?";
};

export const interactWithAgent = async (
  permissions: Permissions, 
  agenda: AgendaItem[], 
  todos: TodoItem[],
  messages: Message[],
  googleConnected: boolean,
  language: string
): Promise<string> => {
    const context = buildContext(permissions, agenda, todos, googleConnected);
    const languageName = getLanguageName(language);
    
    const history = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [...history],
      config: {
        systemInstruction: `You are a helpful personal AI assistant. Here is the user's current data context, which you should use to answer questions:\n${context}\nIMPORTANT: You must respond in ${languageName}.`,
      }
    });
    return response.text ?? "I'm sorry, I could not process that. Could you try again?";
};

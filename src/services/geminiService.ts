import { GoogleGenAI } from "@google/genai";
import type { Permissions, Message, AgendaItem, TodoItem } from '../types';

// Use import.meta.env for Vite environment variables
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const getLanguageName = (langCode: string): string => {
    const map: { [key: string]: string } = {
        'en-US': 'English',
        'pt-BR': 'Brazilian Portuguese',
    };
    return map[langCode] || 'English';
}

const buildContext = (permissions: Permissions, agendaItems: AgendaItem[], todoItems: TodoItem[], googleConnected: boolean): string => {
    if (!googleConnected) {
        return "No data is available. The user has not connected their account yet. Inform the user that they need to connect their account in settings to get started.";
    }

    let context = "This is the user's current data based on the permissions they granted. Use this to inform your responses.\n";
    let hasData = false;
    
    if (permissions.agenda && agendaItems) {
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

    if (permissions.todos && todoItems) {
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
    const prompt = `You are a personal AI assistant. The user has just opened the app. Based on their data below, provide a helpful and proactive summary of their day and ask how you can help. Be friendly and concise. IMPORTANT: The entire response must be in ${languageName}.\n\n${context}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text ?? "How can I help you today?";
};

export const interactWithAgent = async (
  text: string,
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

export const generateNotificationMessage = async (eventTitle: string, eventTime: string, language: string): Promise<string> => {
    const languageName = getLanguageName(language);
    const prompt = `You are a personal AI assistant. Generate a short, friendly, and helpful notification message for the user. The message should remind them of their upcoming event titled "${eventTitle}" scheduled for ${eventTime}. Assume the event is about 15-30 minutes away. Keep it under 150 characters. IMPORTANT: The entire response must be in ${languageName}.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text ?? `Reminder: You have an event at ${eventTime}: ${eventTitle}`;
};

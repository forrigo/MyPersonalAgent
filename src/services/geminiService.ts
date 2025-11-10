import { GoogleGenAI } from "@google/genai";
import type { Permissions, MockData, Message } from '../types';

// NOTE: This uses the VITE_ environment variable prefix
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const getLanguageName = (langCode: string): string => {
    const map: { [key: string]: string } = {
        'en-US': 'English',
        'pt-BR': 'Brazilian Portuguese',
    };
    return map[langCode] || 'English';
}

/**
 * Generates the initial welcome message for the onboarding process.
 */
export const getOnboardingMessage = async (language: string): Promise<string> => {
    const languageName = getLanguageName(language);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a friendly and welcoming message for a user who is opening a personal AI assistant app for the first time. The message should be brief, introduce yourself as their personal AI agent, and encourage them to configure permissions to get started. IMPORTANT: The response must be written in ${languageName}.`,
    });
    return response.text;
};

const buildContext = (permissions: Permissions, mockData: MockData, googleConnected: boolean): string => {
    if (!googleConnected) {
        return "No data is available. The user has not connected their account yet. Inform the user that they need to connect their account in settings to get started.";
    }

    const contextParts: string[] = ["This is the user's current data based on the permissions they granted. Use this to inform your responses.\n"];
    let hasData = false;
    
    if (permissions.agenda) {
        hasData = true;
        contextParts.push("\n## Today's Agenda\n");
        if (mockData.agenda.length > 0) {
            mockData.agenda.forEach(item => {
                contextParts.push(`- ${item.time} ${item.title} (${item.completed ? 'completed' : 'pending'})\n`);
            });
        } else {
            contextParts.push("No agenda items for today.\n");
        }
    }

    if (permissions.todos) {
        hasData = true;
        contextParts.push("\n## To-Do List\n");
        if (mockData.todos.length > 0) {
            mockData.todos.forEach(item => {
                contextParts.push(`- ${item.title} (${item.completed ? 'completed' : 'pending'})\n`);
            });
        } else {
             contextParts.push("No to-do items.\n");
        }
    }

    if (permissions.email) {
        hasData = true;
        const unreadEmails = mockData.emails.filter(e => !e.read);
        contextParts.push(`\n## Emails (${unreadEmails.length} unread)\n`);
        if (unreadEmails.length > 0) {
             unreadEmails.forEach(email => {
                contextParts.push(`- From: ${email.sender}, Subject: ${email.subject}\n`);
            });
        } else {
             contextParts.push("No unread emails.\n");
        }
    }

    if (!hasData) {
        return "The user has connected their account, but has not granted any permissions for you to view the data. Ask them to enable permissions in settings.";
    }

    return contextParts.join('');
};

/**
 * Generates the first message after the user connects their account.
 */
export const getInitialAgentMessage = async (permissions: Permissions, mockData: MockData, googleConnected: boolean, language: string): Promise<string> => {
    const context = buildContext(permissions, mockData, googleConnected);
    const languageName = getLanguageName(language);
    const prompt = `You are a personal AI assistant. The user has just connected their account. Based on their data below, provide a helpful and proactive summary of their day and ask how you can help. Be friendly and concise. IMPORTANT: The entire response must be in ${languageName}.\n\n${context}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
};

/**
 * Handles a user's message in the chat, considering context and history.
 */
export const interactWithAgent = async (
  text: string,
  permissions: Permissions, 
  mockData: MockData, 
  messages: Message[],
  googleConnected: boolean,
  language: string
): Promise<string> => {
    const context = buildContext(permissions, mockData, googleConnected);
    const languageName = getLanguageName(language);
    
    // We only want to send the last few messages to keep the context relevant and the payload small
    const recentMessages = messages.slice(-10);

    const history = recentMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // The current user message is the last part of the contents
    const contents = [...history, { role: 'user', parts: [{ text }] }];
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: `You are a helpful personal AI assistant. Here is the user's current data context, which you should use to answer questions:\n${context}\nIMPORTANT: You must respond in ${languageName}.`,
      }
    });
    return response.text;
};

/**
 * Generates a proactive notification message for an upcoming event.
 */
export const generateNotificationMessage = async (eventTitle: string, eventTime: string, language: string): Promise<string> => {
    const languageName = getLanguageName(language);
    const prompt = `You are a personal AI assistant. Generate a short, friendly, and helpful notification message for the user. The message should remind them of their upcoming event titled "${eventTitle}" scheduled for ${eventTime}. Assume the event is about 15-30 minutes away. Keep it under 150 characters. IMPORTANT: The entire response must be in ${languageName}.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

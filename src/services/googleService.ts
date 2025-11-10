import { gapi } from 'gapi-script';
import { AgendaItem, TodoItem, ItemType, GoogleUser } from '../types';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let onAuthUpdate: (user: GoogleUser | null) => void = () => {};

const getEnvVar = (key: string): string => {
    const value = import.meta.env[key];
    if (!value) {
        console.error(`${key} is not set in the environment variables. Please check your .env.local file and Vercel project settings.`);
        // Return a placeholder to avoid crashing, but functionality will be broken.
        return 'MISSING_ENV_VAR';
    }
    return value;
}

export const initClient = (updateAuthStatus: (user: GoogleUser | null) => void) => {
    onAuthUpdate = updateAuthStatus;
    const GOOGLE_CLIENT_ID = getEnvVar('VITE_GOOGLE_CLIENT_ID');
    const GOOGLE_API_KEY = getEnvVar('VITE_GEMINI_API_KEY');

    gapi.load('client', async () => {
        try {
            await gapi.client.init({
                apiKey: GOOGLE_API_KEY,
                discoveryDocs: [
                    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
                    "https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest",
                ],
            });

            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
                callback: async (tokenResponse) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        gapi.client.setToken({ access_token: tokenResponse.access_token });
                        const userProfile = await getUserProfile();
                        onAuthUpdate(userProfile);
                    }
                },
            });
        } catch (error) {
            console.error("Error initializing GAPI client:", error);
        }
    });
};

const getUserProfile = async (): Promise<GoogleUser | null> => {
    try {
        const response = await gapi.client.request({
            path: 'https://www.googleapis.com/oauth2/v2/userinfo',
        });
        const user = response.result as any;
        return {
            name: user.name,
            email: user.email,
            picture: user.picture,
        };
    } catch (error) {
        console.error("Error fetching user profile", error);
        return null;
    }
}

export const signIn = () => {
    if (tokenClient) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        console.error("Token client not initialized.");
    }
};

export const signOut = () => {
    const token = gapi.client.getToken();
    if (token && token.access_token) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(null);
            onAuthUpdate(null);
        });
    } else {
         gapi.client.setToken(null);
         onAuthUpdate(null);
    }
};

export const getAgendaItems = async (): Promise<AgendaItem[]> => {
    try {
        const response = await (gapi.client as any).calendar.events.list({
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 10,
            'orderBy': 'startTime'
        });

        return (response.result.items || []).map((event: any): AgendaItem => ({
            id: event.id,
            title: event.summary,
            time: event.start.dateTime ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day',
            type: ItemType.AGENDA,
        }));
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        return [];
    }
};

export const getTodoItems = async (): Promise<TodoItem[]> => {
    try {
        const taskListsResponse = await (gapi.client as any).tasks.tasklists.list();
        const taskLists = taskListsResponse.result.items;
        if (!taskLists || taskLists.length === 0) return [];
        
        const primaryTaskListId = taskLists[0].id;
        if (!primaryTaskListId) return [];
        
        const tasksResponse = await (gapi.client as any).tasks.tasks.list({
            tasklist: primaryTaskListId,
            showCompleted: false,
        });

        return (tasksResponse.result.items || []).map((task: any): TodoItem => ({
            id: task.id,
            title: task.title,
            type: ItemType.TODO,
        }));
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }
};

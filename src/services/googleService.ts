import { gapi } from 'gapi-script';
import { AgendaItem, TodoItem, ItemType, GoogleUser } from '../types';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // Using Gemini key for GAPI as well, can be separated if needed

const DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
    "https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest",
];
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly";

export const initClient = async (updateAuthStatus: (user: GoogleUser | null) => void) => {
    await new Promise((resolve, reject) => {
        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: GOOGLE_API_KEY,
                    discoveryDocs: DISCOVERY_DOCS,
                });
                resolve(undefined);
            } catch (error) {
                console.error("Error initializing gapi client:", error);
                reject(error);
            }
        });
    });

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
                 gapi.client.setToken({ access_token: tokenResponse.access_token });
                 getUserProfile().then(user => updateAuthStatus(user));
            }
        },
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
        tokenClient.requestAccessToken();
    } else {
        console.error("Token client not initialized.");
    }
};

export const signOut = () => {
    const token = gapi.client.getToken();
    if (token) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(null);
        });
    }
};

export const getAgendaItems = async (): Promise<AgendaItem[]> => {
    try {
        const response = await gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 10,
            'orderBy': 'startTime'
        });

        return (response.result.items || []).map((event: any) => ({
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
        const taskListsResponse = await gapi.client.tasks.tasklists.list();
        const taskLists = taskListsResponse.result.items;
        if (!taskLists || taskLists.length === 0) return [];
        
        const primaryTaskListId = taskLists[0].id;
        if (!primaryTaskListId) return [];
        
        const tasksResponse = await gapi.client.tasks.tasks.list({
            tasklist: primaryTaskListId,
            showCompleted: false,
        });

        return (tasksResponse.result.items || []).map((task: any) => ({
            id: task.id,
            title: task.title,
            type: ItemType.TODO,
        }));
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }
};

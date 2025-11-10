import { gapi } from 'gapi-script';
import { AgendaItem, TodoItem, ItemType, GoogleUser } from '../types';

// This will hold the token client after initialization.
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
// This will hold the callback function to update the auth status in the App component.
let onAuthUpdate: (user: GoogleUser | null) => void = () => {};

/**
 * Helper function to safely get environment variables.
 * Vite exposes them on `import.meta.env`.
 */
const getEnvVar = (key: string): string => {
    const value = import.meta.env[key];
    if (!value) {
        console.error(`${key} is not set. Please check your Vercel project settings.`);
        // Return a placeholder to prevent crashing, but functionality will be broken.
        return 'MISSING_ENV_VAR';
    }
    return value;
}

/**
 * Initializes the GAPI client and the OAuth token client.
 * This function should be called once when the application loads.
 * @param updateAuthStatus A callback function to notify the App component of auth changes.
 */
export const initClient = (updateAuthStatus: (user: GoogleUser | null) => void) => {
    onAuthUpdate = updateAuthStatus;
    
    // Load the GAPI client library.
    gapi.load('client', async () => {
        try {
            const GOOGLE_API_KEY = getEnvVar('VITE_GEMINI_API_KEY');
            
            // Initialize the GAPI client with API key and discovery documents.
            await gapi.client.init({
                apiKey: GOOGLE_API_KEY,
                discoveryDocs: [
                    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
                    "https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest",
                ],
            });

            const GOOGLE_CLIENT_ID = getEnvVar('VITE_GOOGLE_CLIENT_ID');

            // Initialize the token client for OAuth flow.
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
                callback: async (tokenResponse) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        // Set the token for all subsequent GAPI requests.
                        gapi.client.setToken({ access_token: tokenResponse.access_token });
                        // Fetch user profile and notify the App component.
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

/**
 * Fetches the user's profile information using the OAuth2 API.
 * @returns A promise that resolves to a GoogleUser object or null.
 */
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

/**
 * Starts the Google Sign-In process.
 */
export const signIn = () => {
    if (tokenClient) {
        // Request an access token. This will trigger the Google sign-in popup.
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        console.error("Token client not initialized. Cannot sign in.");
    }
};

/**
 * Signs the user out.
 */
export const signOut = () => {
    const token = gapi.client.getToken();
    if (token && token.access_token) {
        // Revoke the token to properly sign out.
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(null);
            onAuthUpdate(null); // Notify the App component that the user is signed out.
        });
    } else {
         gapi.client.setToken(null);
         onAuthUpdate(null);
    }
};

/**
 * Fetches upcoming events from the user's primary Google Calendar.
 * @returns A promise that resolves to an array of AgendaItems.
 */
export const getAgendaItems = async (): Promise<AgendaItem[]> => {
    try {
        // Use `(gapi.client as any)` to bypass TypeScript errors for dynamically loaded APIs.
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
            title: event.summary || 'No Title',
            time: event.start.dateTime ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day',
            type: ItemType.AGENDA,
        }));
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        return [];
    }
};

/**
 * Fetches pending tasks from the user's primary Google Tasks list.
 * @returns A promise that resolves to an array of TodoItems.
 */
export const getTodoItems = async (): Promise<TodoItem[]> => {
    try {
        // Use `(gapi.client as any)` to bypass TypeScript errors.
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
            title: task.title || 'No Title',
            type: ItemType.TODO,
        }));
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }
};

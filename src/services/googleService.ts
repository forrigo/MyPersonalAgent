import { gapi } from 'gapi-script';
import { AgendaItem, GoogleUser, ItemType, TodoItem } from '../types';

// As variáveis são lidas de dentro das funções para garantir que o ambiente Vite as tenha carregado.
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let gapiInited = false;
let gisInited = false;

/**
 * Initializes the Google API client and Google Identity Services.
 */
export const initClient = (
    updateSigninStatus: (user: GoogleUser | null) => void,
    onAuthSuccess: () => void,
) => {
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!CLIENT_ID || !API_KEY) {
      console.error("API Keys are not configured in .env file");
      return;
    }

    // Init GAPI client
    gapi.load('client', async () => {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest", "https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest"],
        });
        gapiInited = true;

         if (gapi.client.getToken() !== null) {
            const userInfoResp = await gapi.client.oauth2.userinfo.get();
            const profile = userInfoResp.result;
             if(profile.name && profile.email && profile.picture) {
                updateSigninStatus({
                    name: profile.name,
                    email: profile.email,
                    picture: profile.picture
                });
            }
            onAuthSuccess();
         }
    });

    // Init GIS client
    tokenClient = google.accounts.oauth2.initTokenCodeClient({
        client_id: CLIENT_ID,
        scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        callback: async (resp) => {
            if (resp.code && gapiInited) {
                
                gapi.client.oauth2.token.fromCode({
                    code: resp.code,
                    client_id: CLIENT_ID,
                    scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
                }).then(async (token) => {
                    gapi.client.setToken(token);
                    
                    const userInfoResp = await gapi.client.oauth2.userinfo.get();
                    const profile = userInfoResp.result;
                    if(profile.name && profile.email && profile.picture) {
                        updateSigninStatus({
                            name: profile.name,
                            email: profile.email,
                            picture: profile.picture
                        });
                    }
                    onAuthSuccess();
                });
            }
        },
    });
    gisInited = true;
};

/**
 *  Sign in the user upon button click.
 */
export const handleAuthClick = () => {
    if (gapiInited && gisInited && tokenClient) {
        tokenClient.requestCode();
    } else {
        console.error("GAPI or GIS not initialized yet.")
    }
}

/**
 *  Sign out the user upon button click.
 */
export const handleSignoutClick = () => {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {});
        gapi.client.setToken(null);
        window.location.reload(); 
    }
}

/**
 * Fetches the next 10 events from the user's primary calendar.
 */
export async function getCalendarEvents(): Promise<AgendaItem[]> {
  try {
    const response = await gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 10,
      'orderBy': 'startTime'
    });
    
    const events = response.result.items;
    if (!events || events.length === 0) {
      return [];
    }

    return events.map((event: any) => ({
        id: event.id,
        title: event.summary || "No Title",
        time: event.start?.dateTime ? new Date(event.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'All-day',
        completed: false, 
        type: ItemType.AGENDA
    }));
  } catch (err) {
    console.error("Error fetching calendar events:", err);
    return [];
  }
}


/**
 * Fetches tasks from the user's default task list.
 */
export async function getTodoTasks(): Promise<TodoItem[]> {
  try {
    const taskListsResponse = await gapi.client.tasks.tasklists.list();
    const taskLists = taskListsResponse.result.items;
    if (!taskLists || taskLists.length === 0) {
      return [];
    }
    const firstTaskListId = taskLists[0].id;
    if (!firstTaskListId) return [];

    const response = await gapi.client.tasks.tasks.list({
      tasklist: firstTaskListId,
      showCompleted: false,
    });

    const tasks = response.result.items;
     if (!tasks || tasks.length === 0) {
      return [];
    }

    return tasks.map((task: any) => ({
      id: task.id,
      title: task.title || "No Title",
      completed: task.status === 'completed',
      type: ItemType.TODO
    }));
  } catch (err) {
    console.error("Error fetching tasks:", err);
    return [];
  }
}

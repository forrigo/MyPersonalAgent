import { AgendaItem, TodoItem, ItemType, GoogleUser } from '../types';

/**
 * Mocks fetching agenda items from Google Calendar.
 * In a real application, this would use the Google Calendar API.
 */
export const getAgendaItems = async (): Promise<AgendaItem[]> => {
  console.log("Fetching mock agenda items...");
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500)); 
  
  return [
    { id: 'gcal-1', title: 'Team Standup', time: '10:00 AM', completed: false, type: ItemType.AGENDA },
    { id: 'gcal-2', title: 'Design Review with Product Team', time: '2:00 PM', completed: false, type: ItemType.AGENDA },
    { id: 'gcal-3', title: 'One-on-one with Manager', time: '4:30 PM', completed: false, type: ItemType.AGENDA },
  ];
};

/**
 * Mocks fetching to-do items from Google Tasks.
 * In a real application, this would use the Google Tasks API.
 */
export const getTodoItems = async (): Promise<TodoItem[]> => {
  console.log("Fetching mock todo items...");
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    { id: 'gtasks-1', title: 'Finish Q3 report presentation', completed: false, type: ItemType.TODO },
    { id: 'gtasks-2', title: 'Book dentist appointment', completed: false, type: ItemType.TODO },
    { id: 'gtasks-3', title: 'Follow up on client emails', completed: false, type: ItemType.TODO },
  ];
};

/**
 * Mocks connecting a Google account.
 */
export const connectGoogleAccount = async (): Promise<GoogleUser> => {
    console.log("Simulating Google Account connection...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        name: 'Alex Doe',
        email: 'alex.doe@example.com',
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=alexdoe`,
    };
};

/**
 * Mocks disconnecting a Google account.
 */
export const disconnectGoogleAccount = async (): Promise<void> => {
    console.log("Simulating Google Account disconnection...");
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
};

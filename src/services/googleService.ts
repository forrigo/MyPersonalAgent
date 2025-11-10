import { AgendaItem, TodoItem, ItemType, GoogleUser } from '../types';

const MOCK_AGENDA: AgendaItem[] = [
  { id: '1', title: 'Team Standup', time: '09:00 AM', type: ItemType.AGENDA },
  { id: '2', title: 'Design Review', time: '11:30 AM', type: ItemType.AGENDA },
  { id: '3', title: 'Lunch with Sarah', time: '01:00 PM', type: ItemType.AGENDA },
];

const MOCK_TODOS: TodoItem[] = [
  { id: '4', title: 'Finalize Q3 report', type: ItemType.TODO },
  { id: '5', title: 'Book flight for conference', type: ItemType.TODO },
];

const MOCK_USER: GoogleUser = {
    name: 'Alex Doe',
    email: 'alex.doe@example.com',
    picture: 'https://i.pravatar.cc/150?u=alexdoe',
}

export const connectGoogleAccount = async (): Promise<GoogleUser> => {
  console.log("Mocking Google Account connection...");
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_USER;
};

export const disconnectGoogleAccount = async (): Promise<void> => {
  console.log("Mocking Google Account disconnection...");
  await new Promise(resolve => setTimeout(resolve, 200));
};

export const getAgendaItems = async (): Promise<AgendaItem[]> => {
  console.log("Fetching mock agenda items...");
  await new Promise(resolve => setTimeout(resolve, 800));
  return MOCK_AGENDA;
};

export const getTodoItems = async (): Promise<TodoItem[]> => {
  console.log("Fetching mock to-do items...");
  await new Promise(resolve => setTimeout(resolve, 600));
  return MOCK_TODOS;
};


export interface Permissions {
  agenda: boolean;
  todos: boolean;
  email: boolean;
  notifications: boolean;
}

export enum ItemType {
  AGENDA = 'Agenda',
  TODO = 'To-Do',
}

export interface AgendaItem {
  id: number;
  type: ItemType;
  title: string;
  time?: string;
  completed: boolean;
}

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'agent';
  timestamp: string;
}

export interface MockData {
    agenda: AgendaItem[];
    todos: AgendaItem[];
    emails: { id: number; subject: string; sender: string; snippet: string; read: boolean }[];
}

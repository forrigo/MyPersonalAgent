export enum ItemType {
    AGENDA = 'AGENDA',
    TODO = 'TODO',
}

export interface Message {
    id: number;
    text: string;
    sender: 'user' | 'agent';
}

export interface Permissions {
    agenda: boolean;
    todos: boolean;
    email: boolean;
    notifications: boolean;
}

export interface AgendaItem {
    id: string;
    title: string;
    time?: string;
    type: ItemType.AGENDA;
}

export interface TodoItem {
    id: string;
    title: string;
    type: ItemType.TODO;
}

export interface GoogleUser {
    name: string;
    email: string;
    picture: string;
}

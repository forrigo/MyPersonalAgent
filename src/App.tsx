import React, { useState, useEffect, useCallback } from 'react';
import { Agenda } from './components/Agenda';
import { Chat } from './components/Chat';
import { Header } from './components/Header';
import { Onboarding } from './components/Onboarding';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { Permissions, Message, AgendaItem, TodoItem, GoogleUser } from './types';
import * as geminiService from './services/geminiService';
import * as googleService from './services/googleService';

const App: React.FC = () => {
    const [onboardingComplete, setOnboardingComplete] = useState<boolean>(() => localStorage.getItem('onboardingComplete') === 'true');
    const [permissions, setPermissions] = useState<Permissions>(() => {
        const saved = localStorage.getItem('permissions');
        return saved ? JSON.parse(saved) : { agenda: true, todos: true, email: false, notifications: true };
    });
    
    const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(() => localStorage.getItem('isGoogleConnected') === 'true');
    const [googleUser, setGoogleUser] = useState<GoogleUser | null>(() => {
        const saved = localStorage.getItem('googleUser');
        return saved ? JSON.parse(saved) : null;
    });

    const [language, setLanguage] = useState<string>(() => localStorage.getItem('language') || 'en-US');

    const [messages, setMessages] = useState<Message[]>([]);
    const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
    const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
    const [combinedItems, setCombinedItems] = useState<(AgendaItem | TodoItem)[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);

    const onOnboardingComplete = (newPermissions: Permissions) => {
        setPermissions(newPermissions);
        setOnboardingComplete(true);
        localStorage.setItem('onboardingComplete', 'true');
        localStorage.setItem('permissions', JSON.stringify(newPermissions));
    };

    const fetchData = useCallback(async () => {
        if (!isGoogleConnected || !onboardingComplete) {
            setAgendaItems([]);
            setTodoItems([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [agenda, todos] = await Promise.all([
                permissions.agenda ? googleService.getAgendaItems() : Promise.resolve([]),
                permissions.todos ? googleService.getTodoItems() : Promise.resolve([])
            ]);
            setAgendaItems(agenda);
            setTodoItems(todos);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [isGoogleConnected, permissions.agenda, permissions.todos, onboardingComplete]);

    useEffect(() => {
        const sortedAgenda = [...agendaItems].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        const combined = [...sortedAgenda, ...todoItems];
        setCombinedItems(combined);
    }, [agendaItems, todoItems]);


    useEffect(() => {
        localStorage.setItem('permissions', JSON.stringify(permissions));
        fetchData();
    }, [permissions, fetchData]);
    
    const getOnboardingMessage = useCallback(async () => {
        setIsLoading(true);
        try {
            const text = await geminiService.getOnboardingMessage(language);
            setMessages([{ id: Date.now(), text, sender: 'agent' }]);
        } catch (e) {
            console.error(e);
            setMessages([{ id: Date.now(), text: "Welcome! Let's get started by setting up some permissions.", sender: 'agent' }]);
        } finally {
            setIsLoading(false);
        }
    }, [language]);
    
    const getInitialAgentMessage = useCallback(async () => {
        setIsLoading(true);
        try {
            const text = await geminiService.getInitialAgentMessage(permissions, agendaItems, todoItems, isGoogleConnected, language);
            setMessages([{ id: Date.now(), text, sender: 'agent' }]);
        } catch(e) {
            console.error(e);
            setMessages([{ id: Date.now(), text: "Hello! How can I help you today?", sender: 'agent' }]);
        } finally {
            setIsLoading(false);
        }
    }, [permissions, agendaItems, todoItems, isGoogleConnected, language]);

    useEffect(() => {
        localStorage.setItem('language', language);
        if (onboardingComplete) {
            if (messages.length === 0) {
                 getInitialAgentMessage();
            }
        } else {
            getOnboardingMessage();
        }
    }, [language, onboardingComplete, getInitialAgentMessage, getOnboardingMessage, messages.length]);


    const handleSendMessage = async (text: string) => {
        const newUserMessage: Message = { id: Date.now(), text, sender: 'user' };
        const newMessages = [...messages, newUserMessage];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const agentResponseText = await geminiService.interactWithAgent(text, permissions, agendaItems, todoItems, newMessages, isGoogleConnected, language);
            const agentMessage: Message = { id: Date.now() + 1, text: agentResponseText, sender: 'agent' };
            setMessages(prev => [...prev, agentMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: Message = { id: Date.now() + 1, text: "Sorry, I encountered an error. Please try again.", sender: 'agent' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleConnectGoogle = async () => {
        const mockUser = await googleService.connectGoogleAccount();
        setIsGoogleConnected(true);
        setGoogleUser(mockUser);
        localStorage.setItem('isGoogleConnected', 'true');
        localStorage.setItem('googleUser', JSON.stringify(mockUser));
        setIsSettingsOpen(false);
    };
    
    const handleDisconnectGoogle = async () => {
        await googleService.disconnectGoogleAccount();
        setIsGoogleConnected(false);
        setGoogleUser(null);
        setAgendaItems([]);
        setTodoItems([]);
        localStorage.removeItem('isGoogleConnected');
        localStorage.removeItem('googleUser');
        setIsSettingsOpen(false);
    };

    if (!onboardingComplete) {
        return <Onboarding onComplete={onOnboardingComplete} initialMessages={messages} isLoading={isLoading} />;
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            <Sidebar 
                isOpen={isSidebarOpen}
                agendaComponent={
                    <Agenda 
                        items={combinedItems as AgendaItem[]}
                        isLoading={isLoading && (permissions.agenda || permissions.todos)}
                        isAccountConnected={isGoogleConnected}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                    />
                }
            />
            <div className="flex flex-col flex-1 min-w-0">
                <Header 
                    onOpenSettings={() => setIsSettingsOpen(true)} 
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    isSidebarOpen={isSidebarOpen}
                    isSpeechEnabled={isSpeechEnabled}
                    onToggleSpeech={() => setIsSpeechEnabled(!isSpeechEnabled)}
                />
                <main className="flex-1 overflow-hidden p-4">
                     <Chat 
                        messages={messages} 
                        onSendMessage={handleSendMessage} 
                        isLoading={isLoading} 
                        language={language}
                    />
                </main>
            </div>
            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                permissions={permissions}
                setPermissions={setPermissions}
                isGoogleConnected={isGoogleConnected}
                onConnectGoogle={handleConnectGoogle}
                onDisconnectGoogle={handleDisconnectGoogle}
                googleUser={googleUser}
                language={language}
                setLanguage={setLanguage}
            />
        </div>
    );
};

export default App;

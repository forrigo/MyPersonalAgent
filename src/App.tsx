import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Agenda } from '../components/Agenda';
import { Chat } from '../components/Chat';
import { Header } from '../components/Header';
import { Onboarding } from '../components/Onboarding';
import { SettingsModal } from '../components/SettingsModal';
import { Permissions, Message, AgendaItem, TodoItem, GoogleUser } from '../types';
import * as geminiService from './services/geminiService';
// FIX: Corrected import path for googleService to point to the root services directory.
import * as googleService from '../services/googleService';

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
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);

    // FIX: Added useEffect to initialize the Google API client on component mount.
    useEffect(() => {
        const initClient = async () => {
            await googleService.initClient((user) => {
                setGoogleUser(user);
                const connected = !!user;
                setIsGoogleConnected(connected);
                localStorage.setItem('isGoogleConnected', String(connected));
                if (user) {
                    localStorage.setItem('googleUser', JSON.stringify(user));
                } else {
                    localStorage.removeItem('googleUser');
                }
            });
        };
        initClient();
    }, []);

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

    const combinedItems = useMemo(() => {
        const sortedAgenda = [...agendaItems].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        return [...sortedAgenda, ...todoItems];
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
            if (messages.length === 0) {
              getOnboardingMessage();
            }
        }
    }, [language, onboardingComplete, getInitialAgentMessage, getOnboardingMessage, messages.length]);


    const handleSendMessage = async (text: string) => {
        const newUserMessage: Message = { id: Date.now(), text, sender: 'user' };
        const newMessages = [...messages, newUserMessage];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // FIX: Removed 'text' argument to match the function signature in this scope's geminiService.
            const agentResponseText = await geminiService.interactWithAgent(permissions, agendaItems, todoItems, newMessages, isGoogleConnected, language);
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
    
    // FIX: Replaced non-existent 'connectGoogleAccount' with 'signIn'.
    const handleConnectGoogle = () => {
        googleService.signIn();
        setIsSettingsOpen(false);
    };
    
    // FIX: Replaced non-existent 'disconnectGoogleAccount' with 'signOut'.
    const handleDisconnectGoogle = () => {
        googleService.signOut();
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
            {/* FIX: Replaced missing Sidebar component with the correct layout div structure. */}
            <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-full md:w-1/3 lg:w-1/4' : 'w-0'}`}>
                <div className="p-4 h-full overflow-hidden">
                    <Agenda 
                        items={combinedItems}
                        isLoading={isLoading && (permissions.agenda || permissions.todos)}
                        isAccountConnected={isGoogleConnected}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                    />
                </div>
            </div>
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

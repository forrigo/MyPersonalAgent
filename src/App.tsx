import { useState, useEffect, useCallback, useMemo } from 'react';
import { Agenda } from './components/Agenda';
import { Chat } from './components/Chat';
import { Header } from './components/Header';
import { Onboarding } from './components/Onboarding';
import { SettingsModal } from './components/SettingsModal';
import { Permissions, Message, AgendaItem, TodoItem, GoogleUser, ItemType } from './types';
import * as geminiService from './services/geminiService';
import * as googleService from './services/googleService';

const MOCK_DATA_EN: { agenda: AgendaItem[], todos: TodoItem[] } = {
    agenda: [
        { id: 'en1', title: 'Project sync-up', time: '10:00 AM', type: ItemType.AGENDA },
        { id: 'en2', title: 'Lunch with the design team', time: '12:30 PM', type: ItemType.AGENDA },
    ],
    todos: [
        { id: 'en3', title: 'Review new mockups', type: ItemType.TODO },
        { id: 'en4', title: 'Prepare for Friday demo', type: ItemType.TODO },
    ]
};

const MOCK_DATA_PT: { agenda: AgendaItem[], todos: TodoItem[] } = {
    agenda: [
        { id: 'pt1', title: 'Sincronização do projeto', time: '10:00', type: ItemType.AGENDA },
        { id: 'pt2', title: 'Almoço com a equipe de design', time: '12:30', type: ItemType.AGENDA },
    ],
    todos: [
        { id: 'pt3', title: 'Revisar novos mockups', type: ItemType.TODO },
        { id: 'pt4', title: 'Preparar para a demo de sexta-feira', type: ItemType.TODO },
    ]
};

const App: React.FC = () => {
    const [onboardingComplete, setOnboardingComplete] = useState<boolean>(() => localStorage.getItem('onboardingComplete') === 'true');
    const [permissions, setPermissions] = useState<Permissions>(() => {
        const saved = localStorage.getItem('permissions');
        return saved ? JSON.parse(saved) : { agenda: true, todos: true, email: false, notifications: true };
    });

    const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);

    const [language, setLanguage] = useState<string>(() => localStorage.getItem('language') || 'en-US');

    const [messages, setMessages] = useState<Message[]>([]);
    const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
    const [todoItems, setTodoItems] = useState<TodoItem[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
    
    const [initialMessageSent, setInitialMessageSent] = useState(false);

    // Initialize Google API Client
    useEffect(() => {
        const handleAuthUpdate = (user: GoogleUser | null) => {
            setGoogleUser(user);
            setIsGoogleConnected(!!user);
        };
        googleService.initClient(handleAuthUpdate);
    }, []);

    const onOnboardingComplete = (newPermissions: Permissions) => {
        setPermissions(newPermissions);
        setOnboardingComplete(true);
        localStorage.setItem('onboardingComplete', 'true');
        localStorage.setItem('permissions', JSON.stringify(newPermissions));
    };
    
    const fetchData = useCallback(async () => {
        if (!isGoogleConnected) {
            const mockData = language === 'pt-BR' ? MOCK_DATA_PT : MOCK_DATA_EN;
            setAgendaItems(permissions.agenda ? mockData.agenda : []);
            setTodoItems(permissions.todos ? mockData.todos : []);
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
            console.error("Error fetching real data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [isGoogleConnected, permissions.agenda, permissions.todos, language]);

    useEffect(() => {
        localStorage.setItem('permissions', JSON.stringify(permissions));
        fetchData();
    }, [permissions, fetchData]);
    
    const getInitialMessage = useCallback(async () => {
        if (initialMessageSent) return;
        
        setIsLoading(true);
        try {
            const text = await geminiService.getInitialAgentMessage(permissions, agendaItems, todoItems, isGoogleConnected, language);
            setMessages([{ id: Date.now(), text, sender: 'agent' }]);
            setInitialMessageSent(true);
        } catch(e) {
            console.error("Error fetching initial message:", e);
            setMessages([{ id: Date.now(), text: "Hello! How can I assist you?", sender: 'agent' }]);
        } finally {
            setIsLoading(false);
        }
    }, [permissions, agendaItems, todoItems, isGoogleConnected, language, initialMessageSent]);
    
    useEffect(() => {
        if (onboardingComplete && !initialMessageSent) {
            getInitialMessage();
        }
    }, [onboardingComplete, initialMessageSent, getInitialMessage]);

    useEffect(() => {
        localStorage.setItem('language', language);
        setInitialMessageSent(false); // Reset to fetch new message when language changes
    }, [language]);


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
    
    const combinedItems = useMemo(() => {
        const sortedAgenda = [...agendaItems].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        return [...sortedAgenda, ...todoItems];
    }, [agendaItems, todoItems]);
    
    const handleConnectGoogle = () => googleService.signIn();
    const handleDisconnectGoogle = () => {
        googleService.signOut();
        setGoogleUser(null);
        setIsGoogleConnected(false);
    };

    if (!onboardingComplete) {
        return <Onboarding onComplete={onOnboardingComplete} initialMessages={[]} isLoading={false} />;
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
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

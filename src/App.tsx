
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Agenda } from './components/Agenda';
import { Chat } from './components/Chat';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { Onboarding } from './components/Onboarding';
import type { Permissions, Message, AgendaItem } from './types';
import { ItemType } from './types';
import { getOnboardingMessage, getInitialAgentMessage, interactWithAgent, generateNotificationMessage } from './services/geminiService';

// Mock data for demonstration
const MOCK_DATA = {
  agenda: [
    { id: 1, type: ItemType.AGENDA, title: 'Project sync-up', time: '10:00 AM', completed: false },
    { id: 2, type: ItemType.AGENDA, title: 'Lunch with Sarah', time: '12:30 PM', completed: false },
    { id: 3, type: ItemType.AGENDA, title: 'Dentist appointment', time: '3:00 PM', completed: false },
  ],
  todos: [
    { id: 4, type: ItemType.TODO, title: 'Finalize Q3 report', completed: false },
    { id: 5, type: ItemType.TODO, title: 'Buy groceries', completed: true },
    { id: 6, type: ItemType.TODO, title: 'Call the bank', completed: false },
  ],
  emails: [
    { id: 1, subject: 'Re: Project Update', sender: 'Alex', snippet: 'Just wanted to check in on the latest...', read: false },
    { id: 2, subject: 'Your order has shipped!', sender: 'Online Store', snippet: 'Your order #12345 is on its way.', read: true },
    { id: 3, subject: 'Weekly Newsletter', sender: 'Tech Weekly', snippet: 'The latest in AI, startups, and more.', read: false },
  ]
};


function App() {
  // App State
  const [isOnboarding, setIsOnboarding] = useState(() => !localStorage.getItem('onboardingComplete'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [language, setLanguage] = useState('en-US');

  // Data & Permissions State
  const [isGoogleConnected, setIsGoogleConnected] = useState(() => !!localStorage.getItem('googleConnected'));
  const [permissions, setPermissions] = useState<Permissions>(() => {
    const saved = localStorage.getItem('permissions');
    return saved ? JSON.parse(saved) : { agenda: true, todos: true, email: false, notifications: true };
  });
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);

  // Effects
  useEffect(() => {
    localStorage.setItem('permissions', JSON.stringify(permissions));
    updateAgendaView();
  }, [permissions, isGoogleConnected]);

  useEffect(() => {
    localStorage.setItem('googleConnected', isGoogleConnected ? 'true' : '');
  }, [isGoogleConnected]);
  
  const updateAgendaView = useCallback(() => {
    let items: AgendaItem[] = [];
    if(isGoogleConnected) {
      if (permissions.agenda) items = items.concat(MOCK_DATA.agenda);
      if (permissions.todos) items = items.concat(MOCK_DATA.todos);
    }
    setAgendaItems(items.sort((a, b) => (a.time || '').localeCompare(b.time || '')));
  }, [permissions, isGoogleConnected]);

  useEffect(() => {
    // Proactive notification simulation
    if (permissions.notifications && agendaItems.length > 0) {
      const upcomingEvent = agendaItems.find(item => !item.completed && item.type === ItemType.AGENDA);
      if (upcomingEvent && upcomingEvent.title) {
        const timer = setTimeout(async () => {
          const notificationText = await generateNotificationMessage(upcomingEvent.title, upcomingEvent.time || '', language);
          
          // Using browser notifications if permission is granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Upcoming Event', { body: notificationText });
          } else if ('Notification' in window && Notification.permission !== 'denied') {
             Notification.requestPermission().then(permission => {
               if(permission === 'granted') {
                 new Notification('Upcoming Event', { body: notificationText });
               }
             });
          }
          // Also adding to chat
           setMessages(prev => [...prev, { id: Date.now(), text: `🔔 *Reminder:*\n${notificationText}`, sender: 'agent', timestamp: new Date().toISOString() }]);
        }, 5000); // 5 second delay for demo purposes
        return () => clearTimeout(timer);
      }
    }
  }, [permissions.notifications, agendaItems, language]);
  
  const addMessage = (text: string, sender: 'user' | 'agent') => {
    const newMessage = { id: Date.now(), text, sender, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };
  
  // Initial message loading for onboarding and main app
  useEffect(() => {
    if (messages.length > 0) return;

    setIsLoading(true);
    if (isOnboarding) {
      getOnboardingMessage(language)
        .then(text => addMessage(text, 'agent'))
        .catch(err => {
            console.error(err);
            addMessage("Hello! I'm your AI assistant. Let's get you set up.", 'agent');
        })
        .finally(() => setIsLoading(false));
    } else {
       getInitialAgentMessage(permissions, MOCK_DATA, isGoogleConnected, language)
        .then(text => addMessage(text, 'agent'))
        .catch(err => {
          console.error(err);
          addMessage("Hello! How can I help you today?", 'agent');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOnboarding, isGoogleConnected, language, permissions]);


  // Handlers
  const handleSendMessage = async (text: string) => {
    const userMessage = addMessage(text, 'user');
    const currentHistory = [...messages, userMessage];
    setIsLoading(true);
    try {
      const responseText = await interactWithAgent(text, permissions, MOCK_DATA, currentHistory, isGoogleConnected, language);
      addMessage(responseText, 'agent');
    } catch (error) {
      console.error('Error interacting with agent:', error);
      addMessage("Sorry, I encountered an error. Please try again.", 'agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = (newPermissions: Permissions) => {
    setPermissions(newPermissions);
    setIsOnboarding(false);
    localStorage.setItem('onboardingComplete', 'true');
    // Clear onboarding message and load initial agent message
    setMessages([]); 
  };
  
  const handleToggleCompletion = (id: number) => {
    const allItems = [...MOCK_DATA.agenda, ...MOCK_DATA.todos];
    const item = allItems.find(item => item.id === id);
    if (item) {
        item.completed = !item.completed; // This would be an API call in a real app
        updateAgendaView();
    }
  };

  
  const handleConnectGoogle = () => {
    setIsGoogleConnected(true);
    setIsSettingsOpen(false);
    // Refresh the agent's welcome message with new context
    setMessages([]);
  };
  
  const handleDisconnectGoogle = () => {
    setIsGoogleConnected(false);
    // Reset data permissions and clear data-dependent state
    setPermissions(prev => ({...prev, agenda: false, todos: false, email: false}));
    setMessages([]);
  };

  const initialOnboardingMessages = useMemo(() => messages.filter(m => m.sender === 'agent'), [messages]);

  if (isOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} initialMessages={initialOnboardingMessages} isLoading={isLoading} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        isSpeechEnabled={isSpeechEnabled}
        onToggleSpeech={() => setIsSpeechEnabled(!isSpeechEnabled)}
      />
      <div className="flex flex-1 overflow-hidden">
        <aside className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-full md:w-80 lg:w-96' : 'w-0'} overflow-hidden flex-shrink-0`}>
           <div className="p-4 h-full flex flex-col gap-4">
             <Agenda 
                items={agendaItems} 
                onToggleCompletion={handleToggleCompletion}
                isAccountConnected={isGoogleConnected}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
           </div>
        </aside>
        <main className="flex-1 flex flex-col min-w-0">
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
        language={language}
        setLanguage={setLanguage}
      />
    </div>
  );
}

export default App;

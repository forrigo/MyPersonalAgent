import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Onboarding } from './components/Onboarding';
import { Header } from './components/Header';
import { Agenda } from './components/Agenda';
import { Chat } from './components/Chat';
import { SettingsModal } from './components/SettingsModal';
import { Permissions, Message, MockData, AgendaItem, ItemType } from './types';
import { getOnboardingMessage, getInitialAgentMessage, interactWithAgent, generateNotificationMessage } from './services/geminiService';

// Mock Data to simulate a connected user's information
const MOCK_DATA: MockData = {
  agenda: [
    { id: 1, type: ItemType.AGENDA, title: 'Project sync-up', time: '10:00 AM', completed: false },
    { id: 2, type: ItemType.AGENDA, title: 'Lunch with Sarah', time: '12:30 PM', completed: false },
    { id: 3, type: ItemType.AGENDA, title: 'Dentist appointment', time: '3:00 PM', completed: true },
  ],
  todos: [
    { id: 4, type: ItemType.TODO, title: 'Finalize quarterly report', completed: false },
    { id: 5, type: ItemType.TODO, title: 'Book flights for vacation', completed: false },
    { id: 6, type: ItemType.TODO, title: 'Pick up dry cleaning', completed: true },
  ],
  emails: [
    { id: 1, subject: 'Re: Project Alpha Update', sender: 'Alex', snippet: 'Here is the latest update...', read: false },
    { id: 2, subject: 'Your flight confirmation', sender: 'Airline Inc.', snippet: 'Your flight to SFO is confirmed...', read: true },
    { id: 3, subject: 'Weekly Newsletter', sender: 'Tech Today', snippet: 'The top stories in tech this week...', read: false },
  ],
};

const parseTime = (timeStr: string | undefined): number => {
    if (!timeStr) return Infinity; // Put items without a time at the very end
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0; // Midnight case
    return hours * 60 + minutes;
};


const App: React.FC = () => {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [permissions, setPermissions] = useState<Permissions>({ agenda: true, todos: true, email: false, notifications: true });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const notifiedEventIds = useRef<Set<number>>(new Set());

  // Effect to fetch initial onboarding message
  useEffect(() => {
    const fetchOnboardingMessage = async () => {
      try {
        const text = await getOnboardingMessage(language);
        setMessages([{ id: Date.now(), text, sender: 'agent', timestamp: new Date().toISOString() }]);
      } catch (error) {
        console.error("Failed to get onboarding message:", error);
        setMessages([{ id: Date.now(), text: "Hello! I'm your AI assistant. Let's get you set up.", sender: 'agent', timestamp: new Date().toISOString() }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnboardingMessage();
  }, [language]);
  
  // Effect to request notification permissions if enabled by the user
  useEffect(() => {
    if (permissions.notifications && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [permissions.notifications]);

  // Effect for proactive notifications
  useEffect(() => {
    const checkAgendaAndNotify = async () => {
      if (!isGoogleConnected || !permissions.notifications || !permissions.agenda || Notification.permission !== 'granted') {
        return;
      }
      
      const now = new Date();
      const upcomingCutoff = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now

      for (const item of MOCK_DATA.agenda) {
        if (item.time && !item.completed && !notifiedEventIds.current.has(item.id)) {
           // Simple time parsing for demonstration. This is not robust for production.
          const [time, modifier] = item.time.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (modifier === 'PM' && hours < 12) hours += 12;
          if (modifier === 'AM' && hours === 12) hours = 0;

          const eventTime = new Date();
          eventTime.setHours(hours, minutes, 0, 0);

          if (eventTime > now && eventTime <= upcomingCutoff) {
            console.log(`Event "${item.title}" is upcoming. Generating notification.`);
            try {
              const notificationText = await generateNotificationMessage(item.title, item.time, language);
              const registration = await navigator.serviceWorker.ready;
              await registration.showNotification('Upcoming Event Reminder', {
                body: notificationText,
                icon: '/icon.svg',
                badge: '/icon.svg'
              });
              notifiedEventIds.current.add(item.id);
            } catch(e) {
              console.error("Failed to show notification:", e);
            }
          }
        }
      }
    };

    const intervalId = setInterval(checkAgendaAndNotify, 60000); // Check every minute
    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [isGoogleConnected, permissions.agenda, permissions.notifications, language]);


  // Effect to handle post-connection logic
  useEffect(() => {
    if (onboardingComplete && isGoogleConnected) {
      const getFirstMessage = async () => {
        setIsLoading(true);
        try {
          const text = await getInitialAgentMessage(permissions, MOCK_DATA, isGoogleConnected, language);
          setMessages([{ id: Date.now(), text, sender: 'agent', timestamp: new Date().toISOString() }]);
        } catch (error) {
          console.error("Failed to get initial agent message:", error);
          setMessages([{ id: Date.now(), text: "I'm ready to help. What can I do for you today?", sender: 'agent', timestamp: new Date().toISOString() }]);
        } finally {
          setIsLoading(false);
        }
      };
      getFirstMessage();
    } else if (onboardingComplete && !isGoogleConnected) {
      setMessages([{ id: Date.now(), text: "Welcome! To get started, please connect your Google account in the settings.", sender: 'agent', timestamp: new Date().toISOString() }]);
    }
  }, [onboardingComplete, isGoogleConnected, language]);

  // Effect for Text-to-Speech
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (isSpeechEnabled && lastMessage && lastMessage.sender === 'agent' && !isLoading) {
      const utterance = new SpeechSynthesisUtterance(lastMessage.text);
      utterance.lang = language;
      speechSynthesis.speak(utterance);
    }
    // Cleanup function to cancel speech if component unmounts or dependencies change
    return () => {
        speechSynthesis.cancel();
    };
  }, [messages, isLoading, isSpeechEnabled, language]);


  const combinedAgendaAndTodos = useMemo(() => {
    const combined: AgendaItem[] = [];
    if (isGoogleConnected) {
      if (permissions.agenda) {
        combined.push(...MOCK_DATA.agenda);
      }
      if (permissions.todos) {
        combined.push(...MOCK_DATA.todos);
      }
    }
    return combined.sort((a, b) => {
        // Rule 1: Agenda items come before To-Do items.
        if (a.type === ItemType.AGENDA && b.type === ItemType.TODO) return -1;
        if (a.type === ItemType.TODO && b.type === ItemType.AGENDA) return 1;
  
        // Rule 2: Both are Agenda items, sort by time then title.
        if (a.type === ItemType.AGENDA && b.type === ItemType.AGENDA) {
          const timeA = parseTime(a.time);
          const timeB = parseTime(b.time);
          if (timeA !== timeB) {
            return timeA - timeB;
          }
          return a.title.localeCompare(b.title); // Alphabetical for same-time events
        }
  
        // Rule 3: Both are To-Do items, sort by ID.
        if (a.type === ItemType.TODO && b.type === ItemType.TODO) {
          return a.id - b.id;
        }
  
        return 0; // Default case
      });
  }, [permissions, isGoogleConnected]);

  useEffect(() => {
    setAgendaItems(combinedAgendaAndTodos);
  }, [combinedAgendaAndTodos]);

  const handleToggleCompletion = (id: number) => {
    setAgendaItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };
  
  const handleOnboardingComplete = (finalPermissions: Permissions) => {
    setPermissions(finalPermissions);
    setOnboardingComplete(true);
    // Open settings automatically to connect account
    setIsSettingsOpen(true);
  };

  const handleSendMessage = async (text: string) => {
    if (isSpeechEnabled) {
        speechSynthesis.cancel();
    }
    const userMessage: Message = { id: Date.now(), text, sender: 'user', timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const agentResponseText = await interactWithAgent(text, permissions, MOCK_DATA, newMessages, isGoogleConnected, language);
      const agentMessage: Message = { id: Date.now() + 1, text: agentResponseText, sender: 'agent', timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error("Failed to get agent response:", error);
      const errorMessage: Message = { id: Date.now() + 1, text: "Sorry, I ran into an issue. Please try again.", sender: 'agent', timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGoogle = () => {
    setIsGoogleConnected(true);
    setIsSettingsOpen(false);
  };

  const handleDisconnectGoogle = () => {
    setIsGoogleConnected(false);
  };

  if (!onboardingComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} initialMessages={messages} isLoading={isLoading} />;
  }

  return (
    <div className="bg-gray-900 text-white h-screen flex flex-col font-sans">
      <Header 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
        isSpeechEnabled={isSpeechEnabled}
        onToggleSpeech={() => setIsSpeechEnabled(prev => !prev)}
      />
      <main className="flex-1 flex overflow-hidden">
        <div className={`transition-all duration-300 ease-in-out flex flex-col gap-4 border-r border-gray-700/50 overflow-y-auto ${isSidebarOpen ? 'w-full md:w-1/3 lg:w-1/4 p-4' : 'w-0 p-0 border-none'}`}>
          <Agenda 
            items={agendaItems} 
            onToggleCompletion={handleToggleCompletion} 
            isAccountConnected={isGoogleConnected}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>
        <div className={`transition-all duration-300 ease-in-out p-4 flex ${isSidebarOpen ? 'w-full md:w-2/3 lg:w-3/4' : 'w-full'}`}>
           <Chat 
              messages={messages} 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading} 
              language={language}
            />
        </div>
      </main>
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
};

export default App;

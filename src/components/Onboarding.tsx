import React, { useState } from 'react';
import { Permissions, Message } from '../types';
import { Chat } from './Chat';
import { CheckCircleIcon, BookOpenIcon, InboxIcon, BellIcon } from './Icons';

interface OnboardingProps {
  onComplete: (permissions: Permissions) => void;
}

const ONBOARDING_MESSAGE: Message[] = [{
    id: 1,
    sender: 'agent',
    text: "Welcome! I'm your personal AI assistant. To help you best, let's set up some permissions. You can change these at any time."
}];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [permissions, setPermissions] = useState<Permissions>({ agenda: true, todos: true, email: false, notifications: true });
  const [step, setStep] = useState(0);

  const togglePermission = (key: keyof Permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = () => {
    if (step === 0) {
      setStep(1);
    } else {
      onComplete(permissions);
    }
  };
  
  const handleSendMessage = async (text: string) => {
    console.log("Message sent during onboarding:", text);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 space-y-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-400">Welcome!</h1>
            <p className="text-gray-400 mt-2">I'm your personal AI assistant.</p>
          </div>
          
          {step === 0 && (
            <div className="bg-gray-800 rounded-lg p-6 animate-fade-in">
              <h2 className="text-2xl font-semibold mb-4 text-center">Let's get started</h2>
              <p className="text-gray-300 text-center mb-6">
                To help you best, I need access to some of your information. You can change these permissions at any time.
              </p>
               <button
                  onClick={handleContinue}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                >
                  Configure Permissions
                </button>
            </div>
          )}

          {step === 1 && (
            <div className="bg-gray-800 rounded-lg p-6 space-y-6 animate-fade-in">
              <h2 className="text-2xl font-semibold text-center">Access Permissions</h2>
              <PermissionToggle 
                icon={<BookOpenIcon className="w-6 h-6 text-sky-400" />}
                label="Agenda Access"
                description="Allow me to read your calendar events."
                enabled={permissions.agenda}
                onToggle={() => togglePermission('agenda')}
              />
              <PermissionToggle 
                icon={<CheckCircleIcon className="w-6 h-6 text-emerald-400" />}
                label="To-Do List Access"
                description="Let me help you track your tasks."
                enabled={permissions.todos}
                onToggle={() => togglePermission('todos')}
              />
              <PermissionToggle 
                icon={<InboxIcon className="w-6 h-6 text-amber-400" />}
                label="Email Access"
                description="I can summarize important emails. (Read-only)"
                enabled={permissions.email}
                onToggle={() => togglePermission('email')}
              />
               <PermissionToggle 
                icon={<BellIcon className="w-6 h-6 text-rose-400" />}
                label="Proactive Notifications"
                description="Let me send you reminders for important events."
                enabled={permissions.notifications}
                onToggle={() => togglePermission('notifications')}
              />
               <button
                  onClick={handleContinue}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                >
                  Finish Setup
                </button>
            </div>
          )}
        </div>
      </div>
      <div className="hidden lg:flex w-1/2 bg-gray-800/50 p-4">
        <div className="w-full h-full rounded-lg bg-gray-900 flex flex-col">
            <Chat messages={ONBOARDING_MESSAGE} onSendMessage={handleSendMessage} isLoading={false} isReadOnly={true} language="en-US" />
        </div>
      </div>
    </div>
  );
};


interface PermissionToggleProps {
    icon: React.ReactNode;
    label: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
}

const PermissionToggle: React.FC<PermissionToggleProps> = ({ icon, label, description, enabled, onToggle }) => (
    <div className="flex items-center justify-between bg-gray-700/50 p-4 rounded-lg">
      <div className="flex items-center space-x-4">
        {icon}
        <div>
          <h3 className="font-semibold text-gray-100">{label}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <button onClick={onToggle} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${enabled ? 'bg-indigo-600' : 'bg-gray-600'}`}>
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
);

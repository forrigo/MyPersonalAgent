import React from 'react';
import { SettingsIcon, SparklesIcon, SidebarOpenIcon, SidebarClosedIcon, SpeakerLoudIcon, SpeakerOffIcon } from './Icons';

interface HeaderProps {
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isSpeechEnabled: boolean;
  onToggleSpeech: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onToggleSidebar, isSidebarOpen, isSpeechEnabled, onToggleSpeech }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700/50 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-full text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors"
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isSidebarOpen ? <SidebarOpenIcon className="w-6 h-6" /> : <SidebarClosedIcon className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-gray-100 hidden sm:block">Personal AI Agent</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
         <button
            onClick={onToggleSpeech}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors"
            aria-label={isSpeechEnabled ? "Disable voice responses" : "Enable voice responses"}
            title={isSpeechEnabled ? "Disable voice responses" : "Enable voice responses"}
         >
            {isSpeechEnabled ? <SpeakerLoudIcon className="w-6 h-6" /> : <SpeakerOffIcon className="w-6 h-6" />}
         </button>
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors"
          aria-label="Open settings"
        >
          <SettingsIcon className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

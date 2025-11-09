import React from 'react';
import { PermissionsManager } from './PermissionsManager';
import { AccountManager } from './AccountManager';
import { Permissions } from '../types';
import { XIcon, GlobeAltIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: Permissions;
  setPermissions: React.Dispatch<React.SetStateAction<Permissions>>;
  isGoogleConnected: boolean;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  language: string;
  setLanguage: (lang: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    permissions, 
    setPermissions,
    isGoogleConnected,
    onConnectGoogle,
    onDisconnectGoogle,
    language,
    setLanguage,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md relative border border-gray-700 animate-fade-in-up flex flex-col gap-6" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
            <h2 id="settings-title" className="text-2xl font-bold text-gray-100">Settings</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
              aria-label="Close settings"
            >
              <XIcon className="w-6 h-6" />
            </button>
        </div>

        <AccountManager 
            isConnected={isGoogleConnected}
            onConnect={onConnectGoogle}
            onDisconnect={onDisconnectGoogle}
        />
        
        <div className="border-t border-gray-700 -mx-6"></div>

        <PermissionsManager 
            permissions={permissions} 
            setPermissions={setPermissions} 
            isAccountConnected={isGoogleConnected}
        />

        <div className="border-t border-gray-700 -mx-6"></div>

        <div>
          <h3 className="text-lg font-bold text-gray-100 mb-4 text-left flex items-center gap-2">
            <GlobeAltIcon className="w-6 h-6 text-gray-400"/>
            Language
          </h3>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              aria-label="Select language"
            >
              <option value="en-US">English</option>
              <option value="pt-BR">Português (Brasil)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
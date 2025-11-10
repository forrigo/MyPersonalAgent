
import React from 'react';
import { GoogleIcon } from './Icons';

interface AccountManagerProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ isConnected, onConnect, onDisconnect }) => {
  return (
    <div className="w-full">
      <div className="text-left mb-4">
        <h3 className="text-lg font-bold text-gray-100">Account Connection</h3>
        <p className="text-sm text-gray-400 mt-1">
          Connect your Google account to let the agent access your agenda, to-dos, and emails.
        </p>
      </div>
      {isConnected ? (
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50">
           <div className="flex items-center gap-3">
            <GoogleIcon className="w-6 h-6"/>
            <span className="text-gray-200 font-medium">Account Connected</span>
           </div>
           <button 
                onClick={onDisconnect}
                className="bg-red-600/20 text-red-300 hover:bg-red-600/40 hover:text-red-200 text-sm font-semibold py-1 px-3 rounded-md transition-colors"
            >
                Disconnect
            </button>
        </div>
      ) : (
        <button 
            onClick={onConnect}
            className="w-full flex items-center justify-center gap-3 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
            <GoogleIcon className="w-6 h-6"/>
            Connect with Google
        </button>
      )}
    </div>
  );
};

import React from 'react';
import { GoogleIcon, AppleIcon } from './Icons';
import { GoogleUser } from '../types';

interface AccountManagerProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  googleUser: GoogleUser | null;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ isConnected, onConnect, onDisconnect, googleUser }) => {
  return (
    <div>
      <div className="text-left mb-4">
        <h3 className="text-lg font-bold text-gray-100">Connected Accounts</h3>
        <p className="text-sm text-gray-400 mt-1">
          Connect your accounts to allow the agent to access your data.
        </p>
      </div>
      <div className="space-y-3">
        {isConnected && googleUser ? (
          <div className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <img src={googleUser.picture} alt="User profile" className="w-8 h-8 rounded-full" />
              <div>
                <p className="text-gray-200 font-medium">{googleUser.name}</p>
                <p className="text-xs text-gray-400">{googleUser.email}</p>
              </div>
            </div>
            <button
              onClick={onDisconnect}
              className="bg-red-600/80 hover:bg-red-700 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="w-full flex items-center justify-center gap-3 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            <GoogleIcon className="w-5 h-5" />
            Connect Google Account
          </button>
        )}

         <button
            disabled
            className="w-full flex items-center justify-center gap-3 bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors opacity-50 cursor-not-allowed relative"
          >
            <AppleIcon className="w-5 h-5" />
            Connect Apple Account
            <span className="absolute top-1 right-1 text-xs bg-gray-500 text-white px-1.5 py-0.5 rounded-full">Soon</span>
          </button>
      </div>
    </div>
  );
};

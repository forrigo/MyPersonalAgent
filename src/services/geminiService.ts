import React, { useState } from 'react';
import { GoogleIcon } from './Icons';

interface AccountManagerProps {
    isConnected: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ isConnected, onConnect, onDisconnect }) => {
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = () => {
        setIsConnecting(true);
        // Simulate API call for OAuth
        setTimeout(() => {
            onConnect();
            setIsConnecting(false);
        }, 1500);
    };

    return (
        <div>
            <h3 className="text-lg font-bold text-gray-100 mb-4 text-left">Connected Accounts</h3>
            <div className="bg-gray-900/50 rounded-lg p-4">
                {isConnected ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <GoogleIcon className="w-6 h-6" />
                            <div>
                                <p className="font-semibold text-gray-200">Google Account</p>
                                <p className="text-sm text-gray-400">jane.doe@example.com</p>
                            </div>
                        </div>
                        <button 
                            onClick={onDisconnect}
                            className="bg-red-600/20 hover:bg-red-600/40 text-red-300 text-sm font-semibold px-3 py-1 rounded-md transition-colors"
                        >
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <GoogleIcon className="w-6 h-6" />
                            <p className="font-semibold text-gray-200">Google</p>
                        </div>
                        <button 
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-wait text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
                        >
                            {isConnecting ? 'Connecting...' : 'Connect'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

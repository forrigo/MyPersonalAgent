import React from 'react';
import { Permissions } from '../types';
import { BookOpenIcon, CheckCircleIcon, InboxIcon, BellIcon } from './Icons';

interface PermissionsManagerProps {
  permissions: Permissions;
  setPermissions: React.Dispatch<React.SetStateAction<Permissions>>;
  isAccountConnected: boolean;
}

export const PermissionsManager: React.FC<PermissionsManagerProps> = ({ permissions, setPermissions, isAccountConnected }) => {

  const togglePermission = (key: keyof Permissions) => {
    if (!isAccountConnected && key !== 'notifications') return;
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full">
      <div className="text-left mb-4">
        <h3 className="text-lg font-bold text-gray-100">Agent Permissions</h3>
        <p className="text-sm text-gray-400 mt-1">
          {isAccountConnected 
            ? "Manage what data your agent can access."
            : "Connect an account above to enable data access permissions."
          }
        </p>
      </div>
      <div className="space-y-3">
        {/* Data Permissions */}
        <div className={`${!isAccountConnected ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <PermissionRow 
            label="Agenda Access" 
            enabled={permissions.agenda} 
            onToggle={() => togglePermission('agenda')} 
            icon={<BookOpenIcon className="w-5 h-5 text-sky-400" />}
            disabled={!isAccountConnected}
          />
          <PermissionRow 
            label="To-Do Access" 
            enabled={permissions.todos} 
            onToggle={() => togglePermission('todos')} 
            icon={<CheckCircleIcon className="w-5 h-5 text-emerald-400" />}
            disabled={!isAccountConnected}
          />
          <PermissionRow 
            label="Email Access" 
            enabled={permissions.email} 
            onToggle={() => togglePermission('email')}
            icon={<InboxIcon className="w-5 h-5 text-amber-400" />}
            disabled={!isAccountConnected}
          />
        </div>
        
        {/* App-level Permissions */}
        <div className="pt-2">
            <PermissionRow 
              label="Proactive Notifications" 
              enabled={permissions.notifications} 
              onToggle={() => togglePermission('notifications')}
              icon={<BellIcon className="w-5 h-5 text-rose-400" />}
              disabled={false} // This can be toggled anytime
            />
        </div>
      </div>
    </div>
  );
};


interface PermissionRowProps {
    label: string;
    enabled: boolean;
    onToggle: () => void;
    icon: React.ReactNode;
    disabled: boolean;
}
const PermissionRow: React.FC<PermissionRowProps> = ({label, enabled, onToggle, icon, disabled}) => (
    <div className={`flex items-center justify-between p-3 rounded-lg bg-gray-900/50 ${!disabled && 'hover:bg-gray-700/50'} transition-colors`}>
        <div className="flex items-center gap-3">
            {icon}
            <span className="text-gray-300">{label}</span>
        </div>
        <button 
          onClick={onToggle} 
          disabled={disabled}
          className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${enabled ? 'bg-indigo-600' : 'bg-gray-600'}`}
        >
          <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

import React from 'react';
import { AgendaItem, ItemType, TodoItem } from '../types';
import { CalendarIcon, SettingsIcon } from './Icons';

interface AgendaProps {
  items: (AgendaItem | TodoItem)[];
  isLoading: boolean;
  isAccountConnected: boolean;
  onOpenSettings: () => void;
}

export const Agenda: React.FC<AgendaProps> = ({ items, isLoading, isAccountConnected, onOpenSettings }) => {
  const hasItems = items.length > 0;
  
  const EmptyState = () => (
    <div className="text-center text-gray-500 py-10">
      {!isAccountConnected ? (
        <>
            <p className="font-semibold text-gray-400">No Account Connected</p>
            <p className="text-sm mt-2 mb-4">Please connect your Google Account to see your agenda and to-do items.</p>
            <button 
              onClick={onOpenSettings} 
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                <SettingsIcon className="w-5 h-5"/>
                Go to Settings
            </button>
        </>
      ) : (
        <>
            <p className="text-gray-400">No upcoming agenda or to-do items.</p>
            <p className="text-sm mt-1">You're all clear!</p>
        </>
      )}
    </div>
  );

  const LoadingState = () => (
     <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
             <div key={i} className="flex items-center bg-gray-700/40 p-3 rounded-lg animate-pulse">
                <div className="h-5 w-5 rounded bg-gray-600"></div>
                <div className="ml-4 flex-grow space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-600"></div>
                    <div className="h-3 w-1/4 rounded bg-gray-600"></div>
                </div>
            </div>
        ))}
     </div>
  );

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 shadow-lg flex flex-col overflow-hidden flex-grow">
      <div className="flex items-center mb-4">
        <CalendarIcon className="w-5 h-5 mr-2 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-200">Today's Focus</h2>
      </div>
      <div className="overflow-y-auto pr-2 -mr-2">
        {isLoading ? <LoadingState /> : (
            hasItems ? (
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item.id} className="flex items-center bg-gray-700/40 p-3 rounded-lg">
                    <div className="flex-grow">
                      <p className="text-gray-200">{item.title}</p>
                       {item.type === ItemType.AGENDA && item.time && (
                         <p className="text-sm text-gray-400">{item.time}</p>
                       )}
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      item.type === ItemType.AGENDA ? 'bg-sky-900/50 text-sky-300' : 'bg-emerald-900/50 text-emerald-300'
                    }`}>
                      {item.type}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState />
            )
        )}
      </div>
    </div>
  );
};

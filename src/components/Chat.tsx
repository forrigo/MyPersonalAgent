import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { PaperAirplaneIcon, SparklesIcon, UserIcon, ArrowDownIcon, MicrophoneIcon } from './Icons';

interface ChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  isReadOnly?: boolean;
  language: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, isLoading, isReadOnly = false, language }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setInput(input + finalTranscript + interimTranscript);
      };
      recognitionRef.current = recognition;
    }
  }, [input, language]);

  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };
  
  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    // A slight delay ensures the DOM has updated before scrolling.
    setTimeout(() => scrollToBottom('auto'), 100);
  }, [messages]);

  useEffect(() => {
    const container = chatContainerRef.current;
    const handleScroll = () => {
      if (container) {
        const isScrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
        setShowScrollButton(!isScrolledToBottom);
      }
    };

    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !isReadOnly) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white rounded-lg overflow-hidden relative">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-4 ${message.sender === 'user' ? 'justify-end' : ''}`}>
             {message.sender === 'agent' && (
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-5 h-5 text-indigo-400" />
              </div>
            )}
            <div className={`max-w-lg p-4 rounded-xl ${message.sender === 'user' ? 'bg-indigo-600 rounded-br-none' : 'bg-gray-700/70 rounded-bl-none'}`}>
              <p className="text-gray-100 whitespace-pre-wrap">{message.text}</p>
            </div>
             {message.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
        ))}
         {isLoading && messages[messages.length-1]?.sender === 'user' && (
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="max-w-lg p-4 rounded-xl bg-gray-700/70 rounded-bl-none flex items-center space-x-2">
                 <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                 <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                 <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
              </div>
            </div>
         )}
        <div ref={messagesEndRef} />
      </div>
      
      {showScrollButton && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 right-8 w-10 h-10 bg-gray-700/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-300 hover:bg-gray-600 transition-all animate-fade-in"
          aria-label="Scroll to bottom"
        >
          <ArrowDownIcon className="w-6 h-6" />
        </button>
      )}

      <div className="p-4 bg-gray-900 border-t border-gray-700/50">
        <form onSubmit={handleSend} className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isReadOnly ? "You can't reply in this view" : isListening ? "Listening..." : "Ask me anything..."}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-200 disabled:opacity-50"
            disabled={isLoading || isReadOnly}
          />
          {recognitionRef.current && (
             <button 
                type="button" 
                onClick={handleToggleListening}
                disabled={isLoading || isReadOnly}
                className={`p-3 rounded-lg transition-colors flex-shrink-0 relative ${isListening ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} disabled:bg-gray-600 disabled:cursor-not-allowed`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
              {isListening && <span className="absolute inset-0 bg-red-500 rounded-lg animate-ping"></span>}
              <MicrophoneIcon className="w-6 h-6" />
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || isReadOnly || !input.trim()}
            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            aria-label="Send message"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            ) : (
              <PaperAirplaneIcon className="w-6 h-6" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
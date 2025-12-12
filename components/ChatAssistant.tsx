import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Command, Loader2 } from 'lucide-react';
import { Chat } from '@google/genai';
import { createGameAssistantChat, getGeminiResponseStream } from '../services/geminiService';
import { ChatMessage, MessageRole } from '../types';

export const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: MessageRole.MODEL,
      text: 'Lumina OS v2.4. ¿En qué puedo asistirte?'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatRef.current) {
      chatRef.current = createGameAssistantChat();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !chatRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const streamResult = await getGeminiResponseStream(chatRef.current, userMsg.text);
      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelMsgId, role: MessageRole.MODEL, text: '' }]);
      
      let fullText = '';
      for await (const chunk of streamResult) {
        if (chunk.text) {
            fullText += chunk.text;
            setMessages(prev => prev.map(msg => msg.id === modelMsgId ? { ...msg, text: fullText } : msg));
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: MessageRole.MODEL,
        text: 'Connection error.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Minimal Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-white hover:bg-white hover:text-black transition-all duration-300 group"
      >
        {isOpen ? <X size={20} /> : <Command size={20} className="group-hover:scale-110 transition-transform" />}
      </button>

      {/* Chat Interface */}
      <div 
        className={`fixed bottom-24 right-8 w-[350px] max-w-[calc(100vw-3rem)] bg-black border border-zinc-800 shadow-2xl z-40 flex flex-col transition-all duration-500 ease-out
        ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
        style={{ height: '450px' }}
      >
        {/* Terminal-like Header */}
        <div className="px-4 py-3 border-b border-zinc-900 flex justify-between items-center bg-zinc-950">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">AI ASSISTANT</span>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 font-mono text-sm">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === MessageRole.USER ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-zinc-700 mb-1 uppercase">{msg.role === MessageRole.USER ? 'You' : 'System'}</span>
              <div className={`max-w-[90%] ${msg.role === MessageRole.USER ? 'text-white' : 'text-zinc-400'}`}>
               <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex items-center gap-2 text-zinc-600">
                 <Loader2 size={12} className="animate-spin" />
                 <span className="text-xs">Processing...</span>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Minimal Input */}
        <div className="p-3 border-t border-zinc-900 bg-black">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 font-mono">{'>'}</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus={isOpen}
              className="flex-1 bg-transparent border-none text-white text-sm font-mono focus:outline-none placeholder:text-zinc-700"
              placeholder="Type command..."
            />
          </div>
        </div>
      </div>
    </>
  );
};
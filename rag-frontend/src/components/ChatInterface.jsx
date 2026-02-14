import React, { useState, useRef, useEffect } from 'react';
import { Bot, Plus, Menu, ArrowUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { ragApi } from '../services/api';
import logo from '../assets/logo1.png';

// Components
import Sidebar from './Sidebar';
import Message from './Message';
import IngestionModal from './IngestionModal';
import WelcomeScreen from './WelcomeScreen';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('velora_chats');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentChatId, setCurrentChatId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('velora_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (currentChatId) {
      const activeChat = chats.find(c => c.id === currentChatId);
      if (activeChat) setMessages(activeChat.messages);
    } else {
      setMessages([]);
    }
  }, [currentChatId, chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChatId]);

  useEffect(() => {
    if (isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const handleNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      timestamp: new Date().toISOString()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const handleSelectChat = (id) => {
    setCurrentChatId(id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteChat = (id) => {
    setChats(prev => prev.filter(c => c.id !== id));
    if (currentChatId === id) setCurrentChatId(null);
  };

  const handleSubmit = async (e, forcedInput = null, historyOverride = null) => {
    if (e) e.preventDefault();
    const finalInput = forcedInput || inputValue;
    if (!finalInput.trim() || isLoading) return;

    const userMessage = { role: 'user', content: finalInput };
    const historyToUse = historyOverride || messages;
    let chatId = currentChatId;

    if (!chatId) {
      const newChat = {
        id: Date.now().toString(),
        title: finalInput.slice(0, 30) + (finalInput.length > 30 ? '...' : ''),
        messages: [userMessage],
        timestamp: new Date().toISOString()
      };
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      chatId = newChat.id;
    } else {
      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, messages: [...c.messages, userMessage], title: c.messages.length === 0 ? finalInput.slice(0, 30) : c.title } : c
      ));
    }

    setInputValue('');
    setIsLoading(true);

    try {
      const data = await ragApi.query(userMessage.content, historyToUse);
      const botMessage = { role: 'assistant', content: data.answer };
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, botMessage] } : c));
    } catch (error) {
      const errMsg = { role: 'assistant', content: "Error: Service unreachable." };
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, errMsg] } : c));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (newContent, index) => {
    if (isLoading) return;

    // Truncate messages before the edited one
    const updatedMessages = messages.slice(0, index);
    setMessages(updatedMessages);

    // Update the actual chat object in chats array
    setChats(prev => prev.map(c =>
      c.id === currentChatId ? { ...c, messages: updatedMessages } : c
    ));

    // Submit the new content with history override
    handleSubmit(null, newContent, updatedMessages);
  };

  const handleIngest = async (data) => {
    return await ragApi.ingest(data);
  };

  const handleUploadFiles = async (files) => {
    return await ragApi.uploadFiles(files);
  };

  return (
    <div className="flex h-screen w-full bg-dark-theme-bg text-dark-theme-text font-sans overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onOpenIngest={() => setIsIngestModalOpen(true)}
        chats={chats}
        currentChatId={currentChatId}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 bg-dark-theme-bg relative premium-gradient">
        {/* Header Bar */}
        <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-white/5 z-10 glass-morphism !bg-transparent !border-none">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 md:p-2.5 hover:bg-white/5 rounded-xl transition-all">
            <Menu size={20} className="text-slate-400" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 overflow-hidden flex items-center justify-center">
              <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
            <span className="text-[11px] md:text-[13px] font-bold uppercase tracking-[2px] opacity-60">Velora AI Engine 1.0</span>
          </div>

          <button onClick={handleNewChat} className="p-2 md:p-2.5 hover:bg-white/5 rounded-xl transition-all">
            <Plus size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Messaging Container */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-4 md:py-6 h-full relative">
          {messages.length === 0 ? (
            <WelcomeScreen onSuggestionClick={(q) => handleSubmit(null, q)} />
          ) : (
            <div className="flex flex-col w-full animate-fade-in mb-32">
              {messages.map((msg, i) => (
                <Message
                  key={i}
                  message={msg}
                  onResend={(newContent) => handleResend(newContent, i)}
                />
              ))}
              {isLoading && (
                <div className="max-w-4xl mx-auto px-6 py-6 md:py-10 flex gap-4 md:gap-6">
                  <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-xl bg-primary-500 flex items-center justify-center animate-pulse">
                    <Bot size={18} className="text-white md:hidden" />
                    <Bot size={20} className="text-white hidden md:block" />
                  </div>
                  <div className="flex items-center gap-2">
                    {[0, 150, 300].map(delay => <div key={delay} className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />)}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-20" />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex-shrink-0 w-full p-4 md:p-8 pb-6 md:pb-10">
          <div className="max-w-3xl mx-auto relative group">
            {messages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 justify-start md:justify-center px-1">
                {["Summarize", "Compare"].map((pill, i) => (
                  <button key={i} onClick={() => handleSubmit(null, pill)} className="whitespace-nowrap px-4 md:px-5 py-2 rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all text-xs md:text-sm font-semibold text-slate-400 hover:text-white">
                    {pill}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative flex items-end glass-morphism rounded-[20px] md:rounded-[24px] p-1.5 md:p-2 pr-2 md:pr-2.5 pl-3 md:pl-4 ring-1 ring-white/10 focus-within:ring-white/20 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                placeholder="Ask me anything about Velora AI ...."
                className="flex-1 max-h-[150px] md:max-h-[200px] bg-transparent border-none outline-none focus:ring-0 text-white placeholder-slate-600 resize-none py-3 md:py-4 px-1 md:px-2 text-[14px] md:text-[15px] font-medium leading-relaxed"
                style={{ height: '48px', minHeight: '48px' }}
                rows={1}
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={cn(
                  "p-3 md:p-3.5 rounded-xl md:rounded-2xl transition-all mb-0.5",
                  (inputValue.trim() && !isLoading) ? "bg-white text-black hover:bg-slate-200" : "bg-white/5 text-slate-600 cursor-not-allowed"
                )}
              >
                <ArrowUp size={18} className="md:hidden" />
                <ArrowUp size={20} className="hidden md:block" />
              </button>
            </form>
          </div>
        </div>
      </div>

      <IngestionModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngest={handleIngest}
        onUpload={handleUploadFiles}
      />
    </div>
  );
};

export default ChatInterface;

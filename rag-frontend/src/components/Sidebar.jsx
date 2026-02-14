import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, MessageSquare, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import logo from '../assets/logo1.png';

const Sidebar = ({ isOpen, toggleSidebar, onNewChat, onOpenIngest, chats, currentChatId, onSelectChat, onDeleteChat }) => (
    <AnimatePresence>
        {isOpen && (
            <>
                {/* Mobile Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                    onClick={toggleSidebar}
                />
                <motion.div
                    initial={{ width: 0, opacity: 0, x: -20 }}
                    animate={{ width: 280, opacity: 1, x: 0 }}
                    exit={{ width: 0, opacity: 0, x: -20 }}
                    transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
                    className="fixed md:relative h-full bg-dark-theme-panel border-r border-dark-theme-border flex flex-col z-40 overflow-hidden shadow-2xl md:shadow-none"
                >
                    <div className="w-[280px] flex flex-col h-full">
                        <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/5">
                            <div className="flex items-center gap-3">
                                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                    <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white leading-tight">Velora AI</span>
                                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Assistant</span>
                                </div>
                            </div>
                            <button
                                onClick={toggleSidebar}
                                className="p-2 hover:bg-white/10 rounded-xl md:hidden text-slate-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 flex-shrink-0 space-y-3">
                            <button
                                onClick={onNewChat}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-theme-accent/10 hover:bg-dark-theme-accent/20 text-dark-theme-accent rounded-xl border border-dark-theme-accent/20 transition-all font-semibold text-sm"
                            >
                                <Plus size={18} />
                                New Chat
                            </button>
                            <button
                                onClick={onOpenIngest}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] text-dark-theme-text rounded-xl border border-white/5 transition-all font-medium text-sm"
                            >
                                <Sparkles size={16} className="text-primary-400" />
                                Add Knowledge
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-hide">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-[2px] mb-4 px-2">
                                History
                            </div>
                            {chats.length === 0 ? (
                                <div className="py-10 text-center text-slate-600 text-xs font-medium">
                                    No recent chats
                                </div>
                            ) : (
                                chats.map((chat) => (
                                    <div key={chat.id} className="group relative">
                                        <button
                                            onClick={() => onSelectChat(chat.id)}
                                            className={cn(
                                                "w-full text-left px-3 py-3 text-sm rounded-xl truncate transition-all flex items-center gap-3 pr-10",
                                                currentChatId === chat.id ? "bg-white/[0.05] text-white ring-1 ring-white/10" : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200"
                                            )}
                                        >
                                            <MessageSquare size={14} className={currentChatId === chat.id ? "text-dark-theme-accent" : "text-slate-600"} />
                                            <span className="truncate flex-1 font-medium">{chat.title || 'Untitled Conversation'}</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* User Profile Removed */}
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>
);

export default Sidebar;

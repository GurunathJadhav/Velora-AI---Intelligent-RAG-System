import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Copy, Check, Edit2, X, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import logo from '../assets/logo1.png';

const Message = ({ message, onResend }) => {
    const isUser = message.role === 'user';
    const originalContent = typeof message.content === 'string' ? message.content : (message.content?.summary || "No content");

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(originalContent);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(originalContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleSendEdit = () => {
        if (editValue.trim() && editValue !== originalContent) {
            onResend(editValue);
        }
        setIsEditing(false);
    };

    return (
        <div className={cn(
            "w-full group/msg transition-all hover:bg-white/[0.02]",
            isUser ? "bg-transparent" : "bg-white/[0.01]"
        )}>
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10 flex gap-4 md:gap-6 relative">
                <div className={cn(
                    "flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center overflow-visible",
                    isUser ? "bg-slate-700 shadow-md" : "bg-transparent"
                )}>
                    {isUser ? <User size={20} className="text-white md:hidden" /> : <img src={logo} alt="Bot" className="max-w-full max-h-full object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />}
                    {isUser ? <User size={24} className="text-white hidden md:block" /> : null}
                </div>

                <div className="flex-1 min-w-0 pt-1.5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-bold text-[13px] tracking-wide text-white uppercase opacity-90">
                            {isUser ? "You" : "Velora AI"}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                            {!isUser && (
                                <button
                                    onClick={handleCopy}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                                    title="Copy response"
                                >
                                    {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                </button>
                            )}
                            {isUser && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                                    title="Edit question"
                                >
                                    <Edit2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none text-slate-300">
                        {isUser ? (
                            isEditing ? (
                                <div className="space-y-3">
                                    <textarea
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl p-3 text-white text-[15px] focus:ring-1 focus:ring-primary-500 outline-none resize-none min-h-[100px]"
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSendEdit}
                                            className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                                        >
                                            <Send size={12} /> Save & Resend
                                        </button>
                                        <button
                                            onClick={() => { setIsEditing(false); setEditValue(originalContent); }}
                                            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                                        >
                                            <X size={12} /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{originalContent}</div>
                            )
                        ) : (
                            <ReactMarkdown>{originalContent}</ReactMarkdown>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Message;

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Paperclip, ArrowUp, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

const IngestionModal = ({ isOpen, onClose, onIngest, onUpload }) => {
    const [activeTab, setActiveTab] = useState('website');
    const [url, setUrl] = useState('');
    const [recursive, setRecursive] = useState(false);
    const [maxPages, setMaxPages] = useState(10);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isIngesting, setIsIngesting] = useState(false);
    const [status, setStatus] = useState('');
    const fileInputRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsIngesting(true);
        const toastId = toast.loading('Processing knowledge source...');
        
        try {
            if (activeTab === 'website') {
                if (!url) throw new Error('URL is required');
                await onIngest({ urls: [url], recursive, max_pages: maxPages });
            } else {
                if (selectedFiles.length === 0) throw new Error('Please select at least one file');
                await onUpload(selectedFiles);
            }
            
            toast.success('Knowledge base updated successfully!', { id: toastId });
            
            setTimeout(() => {
                onClose();
                setUrl('');
                setSelectedFiles([]);
            }, 1000);
        } catch (error) {
            toast.error(error.message || 'Failed to sync knowledge', { id: toastId });
        } finally {
            setIsIngesting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-dark-theme-panel border border-white/5 rounded-[24px] w-full max-w-lg overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
                <div className="p-6 md:p-8 pb-4 flex justify-between items-center bg-dark-theme-panel sticky top-0 z-10">
                    <h3 className="text-xl font-bold text-white tracking-tight">Knowledge Source</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex p-1.5 bg-black/40 mx-6 md:mx-8 mt-2 rounded-xl border border-white/5">
                    {['website', 'files'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all",
                                activeTab === tab ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {tab === 'website' ? <Search size={16} /> : <Paperclip size={16} />}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                    {activeTab === 'website' ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Source URL</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://franklin-madison.com"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-dark-theme-accent/30 transition-all font-medium"
                                />
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/5 cursor-pointer hover:bg-white/[0.05] transition-colors" onClick={() => setRecursive(!recursive)}>
                                <div className={cn(
                                    "w-5 h-5 rounded flex items-center justify-center border transition-all",
                                    recursive ? "bg-primary-500 border-primary-500" : "border-slate-700 bg-transparent"
                                )}>
                                    {recursive && <ArrowUp size={14} className="text-white" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-200 leading-none">Recursive Scrape</p>
                                    <p className="text-[11px] text-slate-500 mt-1 font-medium italic">Follow internal links to build deeper context</p>
                                </div>
                            </div>

                            {recursive && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="pt-2 px-1">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-dark-theme-accent">Page Limit (Max 10)</label>
                                    </div>
                                    <input
                                        type="number" 
                                        min="1" 
                                        max="10"
                                        value={maxPages}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (val > 10) {
                                                toast.error("Maximum limit is 10 pages");
                                                setMaxPages(10);
                                            } else {
                                                setMaxPages(val);
                                            }
                                        }}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-dark-theme-accent/30 transition-all font-medium"
                                    />
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-white/10 rounded-[20px] p-8 md:p-12 flex flex-col items-center justify-center gap-4 hover:bg-white/5 hover:border-dark-theme-accent/50 transition-all group cursor-pointer"
                            >
                                <input 
                                    ref={fileInputRef} 
                                    type="file" 
                                    multiple 
                                    accept=".pdf,.csv,.docx,.doc,.txt" 
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files);
                                        const validFiles = files.filter(file => {
                                            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
                                            if (!isValidSize) {
                                                toast.error(`File ${file.name} exceeds 10MB limit`);
                                            }
                                            return isValidSize;
                                        });
                                        setSelectedFiles(validFiles);
                                    }} 
                                    className="hidden" 
                                />
                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-[20px] bg-dark-theme-accent/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-dark-theme-accent/20 transition-all duration-500">
                                    <PlusCircle className="text-dark-theme-accent" size={28} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm md:text-base font-bold text-white mb-1">
                                        {selectedFiles.length > 0 ? `${selectedFiles.length} files staged` : "Drop files here"}
                                    </p>
                                    <p className="text-[11px] md:text-[12px] text-slate-500 font-medium">PDF, CSV or Word documents</p>
                                </div>
                            </div>

                            <div className="max-h-32 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                                {selectedFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-[11px] md:text-[12px] font-medium text-slate-400 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-dark-theme-accent animate-pulse" />
                                        <span className="truncate">{file.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}



                    <div className="pt-2 md:pt-4 sticky bottom-0 bg-dark-theme-panel">
                        <button
                            type="submit"
                            disabled={isIngesting || (activeTab === 'website' ? !url : selectedFiles.length === 0)}
                            className="w-full bg-white text-black hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold py-3.5 md:py-4 rounded-xl shadow-xl shadow-white/5 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-[14px] md:text-[15px] flex items-center justify-center gap-2"
                        >
                            {isIngesting ? <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <ArrowUp size={18} />}
                            {isIngesting ? 'Syncing...' : 'Sync Knowledge'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default IngestionModal;

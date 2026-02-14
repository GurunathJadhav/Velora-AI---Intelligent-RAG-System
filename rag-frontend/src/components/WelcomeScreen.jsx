import React from 'react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

const WelcomeScreen = ({ onSuggestionClick }) => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 premium-gradient">
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center mb-8 md:mb-10 overflow-hidden"
        >
            <img src={logo} alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
        </motion.div>

        <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tighter text-center"
        >
            Ask our AI anything
        </motion.h2>

        <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 max-w-sm mb-10 md:mb-12 text-center text-sm md:text-base font-medium leading-relaxed"
        >
            Get instant answers from your documents, analyze client data, or explore Velora AI services in seconds.
        </motion.p>

        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-w-2xl w-full px-4 mb-4"
        >
            {[
                { title: "What can I ask you to do?", subtitle: "Feature overview" },
                { title: "How does this AI work?", subtitle: "System Architecture" }
            ].map((card, i) => (
                <button
                    key={i}
                    onClick={() => onSuggestionClick(card.title)}
                    className="p-4 md:p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:scale-[1.02] transition-all text-left flex flex-col gap-1 group ring-1 ring-inset ring-transparent hover:ring-white/10"
                >
                    <div className="text-[13px] md:text-[14px] font-bold text-white opacity-80 group-hover:opacity-100 transition-opacity">{card.title}</div>
                    <div className="text-[11px] md:text-[12px] text-slate-500 font-medium">{card.subtitle}</div>
                </button>
            ))}
        </motion.div>
    </div>
);

export default WelcomeScreen;

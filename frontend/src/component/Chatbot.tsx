import React, {useState, useEffect, useRef} from 'react';
import {MessageCircle, X, Send, Sparkles} from 'lucide-react';
import {apiFetch} from '../utils/api';
import {useAuth} from '../context/Authcontext';

interface Message {
    sender: 'user' | 'bot';
    text: string;
}

export const Chatbot: React.FC = () => {
    const {user} = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            sender: 'bot',
            text: "Hello! I am your Dihadi Helper Assistant. I can explain platform rules, payment escrows, and how to verify or promote your profile. Hoe can I help you today? (Or click a chip below!)"
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages, loading]);
    if (!user) return null;

    const handleSendMessage = async (textToSend: string) => {
        if (!textToSend.trim()) return;

        setMessages((prev) => [...prev, {sender: 'user', text: textToSend}]);
        setInputText('');
        setLoading(true);

        try {
            const response = await apiFetch('/chatbot', {
                method: 'POST',
                body: JSON.stringify({message: textToSend})
            });
            setTimeout(() => {
                setMessages((prev) => [...prev, {sender: 'bot', text: response.reply}]);
                setLoading(false);
            }, 600);
        } catch (err: any) {
            setMessages((prev) => [...prev, {sender: 'bot', text: 'Sorry, I encountered an error connecting to my database.'}]);
            setLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage(inputText);
    };

    const faqChips= [
        {label: '🛡️ Escrow security', query: 'how does escrow work?'},
        {label: '💰 System fees', query: 'what are commission fees?'},
        {label: '⚠️ Raising disputes', query: 'how to raise a dispute?'},
        {label: '🌟 Promoted cards', query: 'hoe to promote an errand?'},
        {label: '🆔 Verification KYC', query: 'hoe to verify profile KYC?'}
    ];

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
            {/* Floating action buttons */}
            {!isOpen && (
                <button
                onClick={() => setIsOpen(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white rounded-full p-4 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300 transform hover:scale-110 flex items-center justify-center relative group"
                >
                    <MessageCircle className="w-6 h-6"/>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-slate-950 animate-pulse"></span>
                    {/* Tooltip */}
                    <div className="absolute right-14 bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-bold px-2.5 py-1.5 rounded-xl opacity-0 grouo-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md">
                        💬 Dihadi Assistant
                    </div>
                </button>
            )}
            {/* Chatbot expanded panel */}
            {isOpen && (
                <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-3xl w-[calc(100vw-2rem)] sm:w-96 h-[500px] shadow-2xl flex flex-col overflow-hidden animate-hidden animate-in slide-in-from-bottom duration-250">
                    {/* Header */}
                    <div className="bg-slate-950/80 border-b border-slate-850 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-400">
                                <Sparkles className="w-4.5 h-4.5 animate-pulse"/>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-white leading-tight">Dihadi Assistant</h3>
                                <span className="text-[9px] text-emerald-450 font-semibold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                    AI Support Active
                                </span>
                            </div>
                        </div>
                        <button
                        onClick={() => setIsOpen(false)}
                        className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            <X className="w-4 h-4"/>
                        </button>
                    </div>
                    {/* Messages Area */}
                    <div className="flex-grow p-4 overflow-y-auto space-t-3.5 text-xs scrollbar-thin">
                        {messages.map((msg, index) => {
                            const isBot = msg.sender === 'bot';
                            return (
                                <div
                                key={index}
                                className={`flex flex-col max-w-[85%] rounded-2xl p-3 ${
                                    isBot ? 'bg-slate-950 text-slate-200 mr-auto rounded-tl-none border border-slate-850' : 
                                        'bg-brand-500 text-white ml-auto rounded-tr-none'
                                }`}
                                >
                                    <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            );
                        })}
                        {loading && (
                            <div className="bg-slate-955/50 border border-slate-850 text-slate-400 rounded-2xl p-3 w-16 mr-auto rounded-tl-none flex justify-center gap-0.5 animate-pulse">
                                <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                                <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce delay-300"></span>
                            </div>
                        )}
                        <div ref={chatEndRef}/>
                    </div>
                    {/* Help suggestions chips */}
                    <div className="p-3 border-t border-slate-850 bg-slate-950/20 flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
                        {faqChips.map((chip) => (
                            <button
                            key={chip.label}
                            type="button"
                            onClick={() => handleSendMessage(chip.query)}
                            className="bg-slate-950 hover:bg-slate-850 border border-slate-850 text-[10px] text-slate-350 hover:text-white px-22.5 py-1 rounded-xl transition-all duration-200 whitespace-nowrap font-medium shadow-sm hover:scale-105"
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>
                    {/* Input form */}
                    <form onSubmit={handleFormSubmit} className="p-3 border-t border-slate-850 bg-slate-950/50 flex gap-2 items-center flex-shrink-0">
                        <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type FAQ keyword e.g. escrow..."
                        className="flex-grow bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-2 px-3 text-white text-xs focus:outline-none transition-colors duration-200"
                        />
                        <button
                        type="submit"
                        className="bg-brand-500 hover:bg-brand-600 text-white p-2 rounded-xl transition-colors flex-shrnik-0 shadow-md"
                        >
                            <Send className="w-4 h-4"/>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};
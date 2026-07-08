import React, {createContext, useContext, useState, useEffect} from 'react';
import {useAuth} from './Authcontext';
import {io, Socket} from 'socket.io-client';
import {apiFetch} from '../utils/api';
import { CheckCircle2, MessageSquare, IndianRupee, Sparkles, X} from 'lucide-react';

interface Notification {
    _id: string;
    title: string;
    body: string;
    type: 'bid_received' | 'bid_accepted' | 'payment_released' | 'chat_message';
    isRead: boolean;
    createdAt: string;
}

interface Toast {
    id: string,
    title: string;
    body: string;
    type: string;
}

interface SocketContextType {
    socket: Socket | null;
    notifications: Notification[];
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const {user} = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const data = await apiFetch('/notifications');
            setNotifications(data);
        } catch (err) {
            console.error('Fetch notifications error:', err);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            await apiFetch('/notifications/read-all', {method: 'POST'});
            setNotifications(prev => prev.map(n => ({...n, isRead: true})));
        } catch (err) {
            console.error('Mark read error:', err);
        }
    };

    useEffect(() => {
        if (user) {
            const socketInstance = io('http://localhost:5000');
            setSocket(socketInstance);
            socketInstance.emit('join_user_room', user.id);
            fetchNotifications();
            socketInstance.on('new_notification',(notification: Notification) => {
                setNotifications(prev => [notification, ...prev]);
                const toastId = Math.random().toString(36).substring(7);
                setToasts(prev => [...prev, {
                    id: toastId,
                    title: notification.title,
                    body: notification.body,
                    type: notification.type
                }]);
                setTimeout(() => {
                    setToasts(prev => prev.filter(t => t.id !== toastId));
                }, 5000);
            });
            return () => {
                socketInstance.disconnect();
                setSocket(null);
            };
        } else {
            setNotifications([]);
            setToasts([]);
        }
    }, [user]);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <SocketContext.Provider value={{socket, notifications, unreadCount, fetchNotifications, markAllAsRead}}>
            {children}
            {/* Real-time toaster display */}
            <div className="fixed top-20 right-6 z-[9999] space-y-3 pointer-events-none max-w-sm w-full">
                {toasts.map(toast => (
                    <div
                    key={toast.id}
                    className="pointer-events-auto bg-slate-900/95 border border-slate-800 backdrop-blur-md p-4 rounded-2xl shadow-2xl flex gap-3 animate-slide-in-right transition-all duration-300"
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {toast.type === 'bid_received' && <Sparkles className="w-5 h-5 text-amber-450"/>}
                            {toast.type === 'bid_accepted' && <CheckCircle2 className="w-5 h-5 text-emerald-450"/>}
                            {toast.type === 'payment_released' && <IndianRupee className="w-5 h-5 text-indigo-400"/>}
                            {toast.type === 'chat_message' && <MessageSquare className="w-5 h-5 text-blue-400"/>}
                        </div>
                        <div className="flex-grow">
                            <h4 className="text-sm font-bold txt-white leading-none mb-1">{toast.title}</h4>
                            <p className="text-xs text-slate-350 leading-normal">{toast.body}</p>
                        </div>
                        <button
                            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className="flex-shrink-0 text-slate-500 hover:text-white transition-colors duration-150 self-start"
                        >
                            <X className="w-4 h-4"/>
                        </button>
                    </div>
                ))}
            </div>
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error('useSocket must be within SocketProvider');
    return context;
};
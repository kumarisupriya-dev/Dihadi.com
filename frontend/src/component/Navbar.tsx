import React, {useState} from 'react';
import {useAuth} from '../context/Authcontext';
import {useSocket} from '../context/SocketContext';
import {Briefcase, LogOut, ShieldCheck, Wallet, Bell, Sun, Moon} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {useTheme} from '../context/ThemeContext';

export const Navbar: React.FC = () => {
    const {user, currentRole, toggleRole, logout} = useAuth();
    const {notifications, unreadCount, markAllAsRead} = useSocket();
    const {theme, toggleTheme} = useTheme();
    const [showNotifications, setShowNotifications] = useState(false);
    const navigate = useNavigate();

    if (!user) return null;
    return (
        <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* LOGO */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <Briefcase className="w-8 h-8 text-brand-500"/>
                    <span className="text-2xl font-black tracking-tight text-white">Dihadi<span className="text-brand-500">.com</span></span>
                </div>
                {/* Middle Switch and Wallet */}
                <div className="flex items-center gap-6">
                    {/* Wallet Balance Display */}
                    <div
                    onClick={() => navigate('/wallet')}
                    className="flex items-center gap-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/30 rounded-xl px-4 py-1.5 shadow-inner cursor-pointer transition-all duration-200"
                    >
                        <Wallet className="w-5 h-5 text-emerald-400"/>
                        <span className="font-semibold text-slate-200">₹{(user.walletBalance ?? 0).toFixed(2)}</span>
                    </div>
                    {/* Notifications Dropdown Bell */}
                    <div className="relative"></div>
                    <button
                    onClick={toggleTheme}
                    className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/30 rounded-xl transition-all duration-200 text-slate-400 hover:text-amber-400"
                    title="Toogle light/dark mode"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5 text-indigo-400"/>}
                    </button>
                        <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            if (!showNotifications && unreadCount) {
                                markAllAsRead();
                            }
                        }}
                        className="relative p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/30 rounded-xl transition-all duration-200"
                        >
                           <Bell className="w-5 h-5 text-indigo-400"/>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-[999] space-y-4 backdrop-blur-md bg-opacity-95">
                                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                                    <h3 className="font-bold text-sm text-white">Alerts Center</h3>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} className="text-[10px] text-brand-500 hover:underline">
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                                    {notifications.length === 0 ? (
                                        <p className="text-xs text-slate-500 text-center py-6">No recent alerts.</p>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n._id} className={`p-2.5 rounded-xl border transition-colors ${
                                                n.isRead ? 'bg-slate-950/20 border-slate-850' : 'bg-brand-500/5 border-brand-500/25'
                                            }`}>
                                                <h4 className="text-[11px] font-bold text-white mb-0.5">{n.title}</h4>
                                                <p className="text-[10px] text-slate-350 leading-normal">{n.body}</p>
                                                <span className="text-[8px] text-slate-500 block mt-1">
                                                    {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    <button
                    onClick={() => navigate('/verification')}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all duration-200 ${
                        user.verificationStatus  ==='verified' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450 hover:bg-emerald-500/20' :
                            user.verificationStatus === 'pending' ? 'bg-amber-500/10 border-amber-500/20 tex-amber-400 hover:bg-amber-500/20' : 
                                'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
                    }`}
                    >
                        {user.verificationStatus === 'verified'
                        ? 'Profile Verified'
                        : user.verificationStatus === 'pending'
                        ? 'Pending Review'
                        : 'Get Verified'}
                    </button>
                    {/* Toggle Role Button */}
                   <button
                   onClick={toggleRole}
                   className={`relative inline-flex items-center h-9 rounded-full w-48 transition-colors duration-300 focus:outline-none ${
                       currentRole === 'client' ? 'bg-indigo-600' : 'bg-emerald-600'
                   }`}
                   >
                       <span className="absolute left-3 text-xs font-bold text-white uppercase pointer-events-none">
                           {currentRole === 'client' ? 'Client Mode' : 'Tasker Mode'}
                       </span>
                       <span className={`inline-block w-7 h-7 transform bg-white rounded-full transition-transform duration-300 shadow-md ${
                           currentRole === 'client' ? 'translate-x-38' : 'translate-x-1.5'
                       }`} />
                   </button>
                </div>
                {/* User Info and Logout */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col text-right">
                        <span className="text-sm font-semibold text-white flex items-center gap-1">
                            {user.name}{user.isVerified && <ShieldCheck className="w-4 h-4 text-emerald-400"/>}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">{currentRole}</span>
                    </div>
                    <button
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                    className="p-2 text-slate-400 hover:text-rose-400 transition-colors duration-200 bg-slate-800 hover:bg-slate-800/80 rounded-xl border border-slate-700/50"
                        title="Log out"
                    >
                        <LogOut className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </nav>
    );
};
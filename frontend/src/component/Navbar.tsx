import React from 'react';
import {useAuth} from '../context/Authcontext';
import {Briefcase, LogOut, ShieldCheck, Wallet} from 'lucide-react';
import {useNavigate} from 'react-router-dom';

export const Navbar: React.FC = () => {
    const {user, currentRole, toggleRole, logout} = useAuth();
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
                    <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-1.5 shadow-inner">
                        <Wallet className="w-5 h-5 text-emerald-400"/>
                        <span className="font-semibold text-slate-200">₹{(user.walletBalance ?? 0).toFixed(2)}</span>
                    </div>
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
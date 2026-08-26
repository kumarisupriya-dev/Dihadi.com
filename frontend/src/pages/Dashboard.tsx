import React, {useEffect, useState} from 'react';
import {useAuth} from '../context/Authcontext';
import {apiFetch} from "../utils/api";
import {useNavigate} from "react-router-dom";
import {Plus, Briefcase, ChevronRight, Calendar, AlertCircle} from 'lucide-react';

interface Task  {
    _id: string;
    title: string;
    category: string;
    budget: string;
    status: 'open' | 'assigned' | 'completed';
    createdAt: string;
}

export const Dashboard: React.FC = () => {
    const {user, currentRole} = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [scrathpadText, setScrathpadText] = useState(localStorage.getItem('dihadi_quick_scrathpad') || '');
    const [statusBannerText, setStatusBannerText] = useState(localStorage.getItem('dihadi_status_banner') || 'Looking to run some errands today!');

    const fetchDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
            if (currentRole === 'client') {
                const data = await apiFetch('/tasks/my-posts');
                setTasks(data);
            } else {
                const data = await apiFetch('/tasks/my-jobs');
                setTasks(data);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [currentRole]);

    if (!user) return null;

    const getStatusStyle = (status: Task['status']) => {
        switch (status) {
            case 'open' :
                return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case 'assigned' :
                return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            case 'completed' :
                return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            default:
                return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="bg-gradient-to-r from-brand-600/20 via-indigo-600/10 to-transparent border border-brand-500/20 rounded-3xl p-6 mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-100">Welcome Back, {user.name}!</h1>
                    <p className="text-xs text-brand-400 mt-1 italic">“{statusBannerText}”</p>
                </div>
                <span className="bg-brand-500/10 text-brand-400 text-[10px] font-extrabold px-3 py-1.5 rounded-full border border-brand-500/20 w-fit self-start sm:self-auto uppercase tracking-wide">
                    {currentRole === 'client' ? 'Client Dashboard' : 'Tasker Workspace'}
                </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-slate-100 mb-1">Hello, {user.name}</h2>
                        <p className="text-xs text-slate-400 mb-4">{user.email}</p>
                        {currentRole === 'client' ? (
                            <button
                            onClick={() => navigate('/post-task')}
                            className="w-full bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5"/>
                                Post a New Errand
                            </button>
                        ) : (
                            <button
                            onClick={() => navigate('/explore')}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2"
                            >
                                <Briefcase className="w-5 h-5"/>
                                Explore Nearby Errands
                            </button>
                        )}
                        <div className="mt-6 pt-5 border-t border-slate-800 space-y-2">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">My Status Motto</label>
                            <input
                            type="text"
                            value={statusBannerText}
                            onChange={(e) => {
                                setStatusBannerText(e.target.value);
                                localStorage.setItem('dihadi_status_banner', e.target.value);
                            }}
                            placeholder="What is your focus today?"
                            className="w-full bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-2 px-3.5 text-slate-200 text-xs focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-100">Quick Scratchpad 📝</h3>
                            <p className="text-[10px] text-slate-450 mt-0.5">Jot down temporary notes (directions, phone numbers, lists) saved locally.</p>
                        </div>
                        <textarea
                        value={scrathpadText}
                        onChange={(e) => {
                            setScrathpadText(e.target.value);
                            localStorage.setItem('dihadi_quick_scrathpad', e.target.value);
                        }}
                        placeholder="Start typing some notes here..."
                        className="w-full h-32 bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl p-3 text-slate-100 text-xs focus:outline-none transition-colors"
                        />
                        <div className="flex justify-between items-center text-[9px] text-slate-500">
                            <span>Auto-save active</span>
                            <button
                            type="button"
                            onClick={() => {
                                setScrathpadText('');
                                localStorage.removeItem('dihadi_quick_scrathpad');
                            }}
                            className="text-rose-450 hover:underline"
                            >
                                Clear Notes
                            </button>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-full flex flex-col">
                        <h2 className="text-2xl font-bold text-slate-100 mb-6">
                            {currentRole === 'client' ? 'My Posted Errands' : 'My Active Jobs'}
                        </h2>
                        {error && (
                            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 text-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0"/>
                                <span>{error}</span>
                            </div>
                        )}
                        {loading ? (
                            <div className="flex-grow flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/10">
                                <p className="text-slate-400 max-w-sm mb-6">
                                    {currentRole === 'client'
                                    ? "You haven't posted any tasks yet. Need help? Post a task to get started." :
                                    "You are not working on any active jobs right now. Explore tasks to start earning!"}
                                </p>
                                {currentRole === 'client' ? (
                                    <button
                                    onClick={() => navigate('/post-task')}
                                    className="bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-400 font-bold px-5 py-2 rounded-xl transition-colors duration-200"
                                    >
                                        Post First Work
                                    </button>
                                ) : (
                                    <button
                                    onClick={() => navigate('/explore')}
                                    className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 font-bold px-5 py-2 rounded-xl transition-colors duration-200"
                                    >
                                        Find Work
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tasks.map((task) => (
                                    <div
                                    key={task._id}
                                    onClick={() => navigate(`/tasks/${task._id}`)}
                                    className="flex items-center justify-between bg-slate-955/40 hover:bg-slate-955/80 border border-slate-850 hover:border-slate-700/50 rounded-2xl p-5 cursor-pointer transition-all duration-200"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="text-lg font-bold text-slate-100 leading-tight">{task.title}</span>
                                            <div className="flex items-center gap-4 text-xs text-slate-450">
                                                <span className="bg-slate-800 px-2 py-0.5 rounded-md font-semibold text-slate-300">{task.category}</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5"/>
                                                    {new Date(task.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                             <div className="flex flex-col text-right">
                                                 <span className="text-lg font-black text-slate-100">₹{task.budget}</span>
                                                 <span className="text-[10px] px-2 py-0.5 rounded-full capitalize w-fit self-end">
                                                     <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${getStatusStyle(task.status)}`}>
                                                         {task.status}
                                                     </span>
                                                 </span>
                                             </div>
                                            <ChevronRight className="w-5 h-5 text-slate-500" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
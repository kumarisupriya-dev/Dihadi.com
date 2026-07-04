import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAuth} from '../context/Authcontext';
import {apiFetch} from '../utils/api';
import {IndianRupee, Clock, MessageSquare, ShieldCheck, Star, AlertCircle, ArrowLeft, Send} from 'lucide-react';

interface Task {
    _id: string;
    title: string;
    description: string;
    category: string;
    budget: number;
    address: string;
    status: 'open' | 'assigned' | 'completed';
    createdAt: string;
    client: {
        _id: string;
        name: string;
        email: string;
        rating: number;
        isVerified: boolean;
    };
    assignedTasker?: {
        _id: string;
        name: string;
        email: string;
    };
}

interface Bid {
    _id: string;
    tasker: {
        _id: string;
        name: string;
        rating: number;
        isVerified: boolean;
        reviewCount: number;
    };
    bidAmount: number;
    estimatedTime: string;
    message?: string;
    status: 'pending' | 'accepted' | 'rejected';
}

export const TaskDetails: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const {user, refreshUser} = useAuth();
    const navigate = useNavigate();
    const [task, setTask] = useState<Task | null>(null);
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [bidAmount, setBidAmount] = useState('');
    const [estimatedTime, setEstimatedTime] = useState('');
    const [message, setMessage] = useState('');
    const [bidSubmitting, setBidSubmitting] = useState(false);

    const fetchTaskDetails = async () => {
        setLoading(true);
        setError('');
        try {
            const taskData = await apiFetch(`/tasks/${id}`);
            setTask(taskData);
            if (user && taskData.client._id === user.id) {
                const bidsData = await apiFetch(`/bids/task/${id}`);
                setBids(bidsData);
            } else if (user) {
                try {
                    const bidsData = await apiFetch(`/bids/task/${id}`);
                    setBids(bidsData);
                } catch {
                    setBids([]);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load task details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && id) {
            fetchTaskDetails();
        }
    }, [id, user]);
    const handlePlaceBid = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task || bidSubmitting) return;
        setError('');
        setBidSubmitting(true);

        try {
            await apiFetch('/bids', {
                method: 'POST',
                body: JSON.stringify({
                    taskId: task._id,
                    bidAmount: Number(bidAmount),
                    estimatedTime,
                    message,
                }),
            });
            setBidAmount('');
            setEstimatedTime('');
            setMessage('');
            await fetchTaskDetails();
        } catch (err: any) {
            setError(err.message || 'Failed to place bid.');
        } finally {
            setBidSubmitting(false);
        }
    };
    const handleAcceptBid = async (bidId: string) => {
        if (!window.confirm('Are you sure you want to accept this bid and hire this tasker?')) return;
        setError('');
        try {
            await apiFetch(`/bids/${bidId}/accept`, {method: 'POST'});
            await fetchTaskDetails();
        } catch (err: any) {
            setError(err.message || 'failed to accept bid.');
        }
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh] bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
            </div>
        );
    }
    if (!task || !user) {
        return (
            <div
                className="max-w-7xl mx-auto px-6 py-12 text-center bg-slate-950 min-h-screen flex flex-col items-center justify-center">
                <p className="text-rose-400 mb-4">Task details could not be loaded.</p>
                <button onClick={() => navigate('/')} className="text-brand-500 hover:underline">
                    Go to Dashboard
                </button>
            </div>
        );
    }
    const isOwner = task.client._id === user.id;
    const myBid = bids.find((b) => b.tasker._id === user.id) || null;

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-450 hover:text-white transition-colors duration-205 mb-6 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm"
            >
                <ArrowLeft className="w-4 h-4"/>
                Back
            </button>
            {error && (
                <div
                    className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}
            {/* Main Grid: Details + Action Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Details Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <span
                                className="bg-slate-800 text-slate-350 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                {task.category}
                            </span>
                            <span
                                className="text-2xl font-black text-white flex items-center bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-2xl px-4 py-1.5 shadow-inner">
                                ₹{task.budget}
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-white mb-6 leading-tight">{task.title}</h1>
                        <h3 className="text-md font-bold text-slate-300 mb-2">Location Area / Address</h3>
                        <p className="text-slate-300 bg-slate-950/30 p-4 rounded-2xl border border-slate-855 text-sm">
                            {task.address}
                        </p>
                    </div>
                    {/* Client Info Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                                <Star className="w-7 h-7 text-amber-400 fill-amber-400"/>
                            </div>
                        <div>
                        <h4 className="font-bold text-white text-lg flex items-center gap-1.5">
                            {task.client.name}
                            {task.client.isVerified && <ShieldCheck className="w-5 h-5 text-emerald-450"/>}
                        </h4>
                        <p className="text-xs text-slate-450">Client Profile</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-md font-bold text-slate-200 flex items-center gap-1">
                        {task.client.rating > 0 ? `${task.client.rating.toFixed(1)} / 5.0` : 'No reviews'}
                    </span>
                    <p className="text-xs text-slate-455">Rating</p>
                </div>
            </div>
        </div>
            <div className="lg:col-span-1 space-y-6">
                {/* Status Badge */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center">
                    <span className="text-xs text-slate-450 uppercase font-semibold block mb-2">Errand Status</span>
                    <span className={`inline-block text-sm font-black px-6 py-2 rounded-full capitalize border ${
                        task.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        task.status === 'assigned' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'    
                    }`}>
                        {task.status}
                    </span>
                </div>
                {/* Client View */}
                {isOwner && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                        {task.status === 'assigned' ? (
                            <div className="space-y-4 text-center">
                                <h3 className="text-lg font-bold text-white">Errand in Progress</h3>
                                <p className="text-xs text-slate-400">
                                    Tasker <span className="font-bold text-white">
                                    {task.assignedTasker?.name} is working on this errand.
                                </span>
                                </p>
                                <button
                                onClick={async () => {
                                    if (!window.confirm('Are you sure you want to mark this task as completed and release the locked escrow payment to the tasker?')) return;
                                    setError('');
                                    try {
                                        await apiFetch(`/tasks/${task._id}/complete`, {method: 'POST'});
                                        await refreshUser();
                                        await fetchTaskDetails();
                                } catch (err: any) {
                                        setError(err.message || 'Failed to complete task.');
                                    }
                                    }}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-colors duration-200 shadwo-md animate-pulse-once"
                                >
                                    Confirm Completion & Release Payment
                                </button>
                            </div>
                        ) : (
                            <>
                            <h3 className="text-xl font-bold text-white">Received Bids ({bids.length}</h3>
                                {bids.length === 0 ? (
                                    <p className="text-slate-450 text-sm text-center py-6 border border-dashed border-slate-800 rounded-2xl">
                                        No bids received yet. Taskers will place offers soon.
                                    </p>
                                ) : (
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                        {bids.map((bid) => (
                                            <div key={bid._id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-semibold text-white text-sm flex items-center gap-1">
                                                            {bid.tasker.name}
                                                            {bid.tasker.isVerified && <ShieldCheck className="w-4 h-4 text-emerald-450"/>}
                                                        </span>
                                                        <span className="text-[10px] text-slate-450">
                                                             {bid.tasker.rating > 0 ? `★ ${bid.tasker.rating.toFixed(1)}` : 'New Tasker'}
                                                        </span>
                                                    </div>
                                                    <span className="text-emerald-450 font-black text-sm">₹{bid.bidAmount}</span>
                                                </div>
                                                {bid.message && (
                                                    <p className="txt-xs txt-slate-400 bg-slate-950/80 p-2.5 rounded-xl border border-slate-850 italic">
                                                        "{bid.message}"
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 text-[10px] text-slate-455">
                                                    <Clock className="w-3.5 h-3.5"/>
                                                    <span>Ready in: {bid.estimatedTime}</span>
                                                </div>
                                                {task.status === 'open' && (
                                                    <button
                                                        onClick={async () => {
                                                            await handleAcceptBid(bid._id);
                                                            await refreshUser();
                                                        }}
                                                        className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 rounded-xl text-xs transition-colors duration-200 shadow-md">
                                                        Accept & Hire
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
                {/* Tasker View - place bid or view my placed bid */}
                {!isOwner && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                        {task.status === 'open' && !myBid && (
                            <form onSubmit={handlePlaceBid} className="space-y-4">
                                <h3 className="text-lg font-bold text-white">Place an Offer</h3>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">My Bid Amount (₹)</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                                        <input
                                        type="number"
                                        required
                                        min={10}
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        placeholder="e.g. 750"
                                        className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2 pl-9 pr-3 text-white text-sm focus:outline-none transition-colors duration-200 shadow-inner"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Time to complete</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                                        <input
                                        type="text"
                                        required
                                        value={estimatedTime}
                                        onChange={(e) => setEstimatedTime(e.target.value)}
                                        placeholder="e.g. 2 hours / 1 day"
                                        className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2 pl-9 pr-3 text-white text-sm focus:outline-none transition-colors duration-200 shadow-inner"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Proposal Message</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-500"/>
                                        <textarea
                                        rows={3}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Why should the client hire you?"
                                        className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2 pl-9 pr-3 text-white text-sm focus:outline-none transition-colors duration-200 shadow-inner resize-none"
                                        />
                                    </div>
                                </div>
                                <button
                                type="submit"
                                disabled={bidSubmitting}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-colors duration-200 shadow-md flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4"/>
                                    {bidSubmitting ? 'Submitting...' : 'Submit Bid'}
                                </button>
                            </form>
                        )}
                        {/* Task opened but user already place a bid */}
                        {task.status  === 'open' && myBid && (
                            <div className="text-center py-4 space-y-3">
                                <h3 className="text-md font-bold text-white">Your Placed Offer</h3>
                                <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-2 text-left">
                                    <div className="flex justify-between items-center text-sm font-semibold">
                                        <span className="text-slate-400">Offer Amount:</span>
                                        <span className="text-emerald-400 font-bold">₹{myBid.bidAmount}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-semibold">
                                        <span className="text-slate-400">Time estimate:</span>
                                        <span className="text-white">{myBid.estimatedTime}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-semibold">
                                        <span className="text-slate-400">Bid Status:</span>
                                        <span className="text-amber-400 capitalize">{myBid.status}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Waiting for the client to review and accept.
                                </p>
                            </div>
                        )}
                        {/* task assigned to someone else */}
                        {task.status === 'assigned' && task.assignedTasker?._id !== user.id && (
                            <p className="text-slate-450 text-sm text-center py-4">
                                This task has been assigned to another tasker.
                            </p>
                        )}
                        {/* task assigned to current user */}
                        {task.status === 'assigned' && task.assignedTasker?._id === user.id && (
                            <div className="text-center py-4 space-y-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                                <h3 className="text-md font-extrabold text-emerald-400">You are hired!</h3>
                                <p className="text-xs text-slate-350">
                                    Get in touch with the client to complete this task.
                                </p>
                            </div>
                        )}
                        {/* Task completed */}
                        {task.status === 'completed' && (
                            <p className="text-slate-450 text-sm text-center py-4">
                                This errand is marked completed.
                            </p>
                        )}
                    </div>
                )}
            </div>
    </div>
    </div>
    );
};
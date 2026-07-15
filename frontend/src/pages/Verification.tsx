import React, {useState, useEffect} from 'react';
import {useAuth} from '../context/Authcontext';
import {apiFetch} from '../utils/api.ts';
import {ShieldCheck, Upload, AlertCircle, Sparkles, Check, X, ShieldAlert, Scale, HelpCircle} from 'lucide-react';

interface PendingUser {
    _id: string;
    name: string;
    email: string;
    verificationDocument: string;
}

interface DisputedTask {
    _id: string;
    title: string;
    budget: number;
    disputeReason: string;
    client: {name: string; email: string;};
    assignedTasker: {name: string; email: string};
    completionProof?: {
        documentBase64: string;
        comment?: string;
    };
}

export const Verification: React.FC = () => {
    const {user, refreshUser} = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [loadingQueue, setLoadingQueue] = useState(false);
    const [pendingQueue, setPendingQueue] = useState<PendingUser[]>([]);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [disputedQueue, setDisputedQueue] = useState<DisputedTask[]>([]);
    const [loadingDisputes, setLoadingDisputes] = useState(false);

    const fetchDisputedQueue = async () => {
        if (!user?.isAdmin) return;
        setLoadingDisputes(true);
        try {
            const data = await apiFetch('/tasks/disputed-errands');
            setDisputedQueue(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load disputed errands.');
        } finally {
            setLoadingDisputes(false);
        }
    };

    useEffect(() => {
        if (user?.isAdmin) {
            fetchPendingQueue();
            fetchDisputedQueue();
        }
    }, [user]);

    const handleResolveDispute = async (taskId: string, action: 'release_to_tasker' | 'refund_to_client') => {
        setError('');
        setMessage('');
        try {
            await apiFetch(`/tasks/${taskId}/resolve-dispute`, {
                method: 'POST',
                body: JSON.stringify({action}),
            });
            setMessage(`Dispute resolved successfully.`);
            await fetchDisputedQueue();
            await refreshUser();
        } catch (err: any) {
            setError(err.message || 'Dispute resolution failed.');
        }
    };

    const fetchPendingQueue = async () => {
        if (!user?.isAdmin) return;
        setLoadingQueue(true);
        try {
            const data = await apiFetch('/auth/pending-verifications');
            setPendingQueue(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load pending verifications.');
        } finally {
            setLoadingQueue(false);
        }
    };

    useEffect(() => {
        if (user?.isAdmin) {
            fetchPendingQueue();
        }
    }, [user]);

    const handleFileUplaod = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError('');
        setMessage('');
        setSubmitting(true);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const base64Str = reader.result as string;
                const res = await apiFetch('/auth/verify-request', {
                    method: 'POST',
                    body: JSON.stringify({documentBase64: base64Str}),
                });
                setMessage(res.message);
                await refreshUser();
            } catch (err: any) {
                setError(err.message || 'Verification upload failed.');
            } finally {
                setSubmitting(false);
            }
        };
    };
    const handleAction = async (userId: string, approve: boolean) => {
        setError('');
        setMessage('');
        try {
            await apiFetch(`/auth/approve-verification/${userId}`, {
                method: 'POST',
                body: JSON.stringify({approve}),
            });
            setMessage(`Verification ${approve ? 'approved' : 'rejected'} successfully.`);
            await fetchPendingQueue();
            await refreshUser();
        } catch (err: any) {
            setError(err.message || 'Action failed.');
        }
    };

    const makeMeAdmin = async () => {
        setError('');
        setMessage('');
        try {
            await apiFetch('/auth/make-admin', {method: 'POST'});
            await refreshUser();
        }  catch (err: any) {
            setError(err.message || 'Failed to become admin.');
        }
    };
    if (!user) return null;

    return (
        <div className="max-w-4xl mx-atuo px-6 py-12 space-y-8">
            {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-sm p-4 rounded-xl">
                    <AlertCircle className="w-5 h-5 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}
            {message && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-sm p-4 rounded-xl">
                    <ShieldCheck className="w-5 h-5 flex-shrink-0"/>
                    <span>{message}</span>
                </div>
            )}
            {/* Normal user verification */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-center max-w-xl mx-auto">
                <h2 className="text-2xl font-black text-white mb-2 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-brand-500"/>
                    Identity verification
                </h2>
                <p className="text-xs text-slate-400 mb-8">
                    Get verified to unlock trusted badges and stand out to clients.
                </p>
                {user.verificationStatus === 'none' && (
                    <div className="space-y-6">
                        <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 hover:border-brand-500/40 transition-colors cursor-pointer relative bg-slate-950/20">
                            <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUplaod}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={submitting}
                            />
                            <Upload  className="w-10 h-10 text-slate-500 mx-auto mb-3"/>
                            <span className="text-xs font-bold text-slate-300 blcok mb-1">
                                {submitting ? 'Uploading file...' : 'Upload Identity Card / ID Document'}
                            </span>
                            <span className="text-[10px] text-slate-500">Supports JPG, PNG images</span>
                        </div>
                        {!user.isAdmin && (
                            <button
                            onClick={makeMeAdmin}
                            className="text-[10px] bg-slate-800 hover:bg-slate-750 text-brand-400 font-bold px-3 py-1.5 rounded-lg border border-slate-700/50 transition-all duration-200"
                            >
                                Become Admin (Dev Testing)
                            </button>
                        )}
                    </div>
                )}
                {user.verificationStatus === 'pending' && (
                    <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-2">
                        <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto animate-pulse"/>
                        <h4 className="text-sm font-bold text-white">Review in Progress</h4>
                        <p className="text-xs text-slate-400">
                            Your document has been submitted and is currently being reviewed by administrators.
                        </p>
                    </div>
                )}
                {user.verificationStatus === 'verified' && (
                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2">
                        <ShieldCheck className="w-8 h-8 text-emerald-450 mx-auto"/>
                        <h4 className="text-sm font-bold text-white">Verified Account</h4>
                        <p className="text-xs text-slate-450">
                            Your profile is verified. You now have a trusted earner badge displayed.
                        </p>
                    </div>
                )}
            </div>
            {/* Admin verification queue */}
            {user.isAdmin && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
                    <h3 className="text-lg font-black text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400"/>
                        Admin Verification Queue ({pendingQueue.length})
                    </h3>
                    {loadingQueue ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
                        </div>
                    ) : pendingQueue.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-8">No pending verifications to review.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {pendingQueue.map((item) => (
                                <div key={item._id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-xs text-white leading-none mb-1">{item.name}</h4>
                                            <p className="text-[10px] text-slate-500">{item.email}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                            onClick={() => handleAction(item._id, true)}
                                            className="bg-emerald-600 hover:bg-emerald-700 p-1.5 rounded-lg text-white"
                                            title="Approve verification"
                                            >
                                                <Check className="w-3.5 h-3.5"/>
                                            </button>
                                            <button
                                            onClick={() => handleAction(item._id, false)}
                                            className="bg-rose-600 hover:bg-rose-700 p-1.5 rounded-lg text-white"
                                            title="Reject verification"
                                            >
                                                <X className="w-3.5 h-3.5"/>
                                            </button>
                                        </div>
                                    </div>
                                    {/* Document Preview */}
                                    {item.verificationDocument && (
                                        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 max-h-40 flex items-center justify-center">
                                            <img
                                            src={item.verificationDocument}
                                            alt="KYC Document Uploaded"
                                            className="w-full h-auto max-h-40 object-contain"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {user.isAdmin && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6 mt-8">
                    <h3 className="text-lg font-black text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                        <Scale className="w-5 h-5 text-indigo-400"/>
                        Admin Escrow Disputes Queue ({disputedQueue.length})
                    </h3>
                    {loadingDisputes ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
                        </div>
                    ) : disputedQueue.length === 0 ? (
                        <p className="text-xs text-slate-550 text-center py-8">No active escrow disputes to resolve.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {disputedQueue.map((task) => (
                                <div key={task._id} className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex flex-col gap-4">
                                    <div>
                                        <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase block w-max mb-1">Frozen Escrow: ₹{task.budget}</span>
                                        <h4 className="font-extrabold text-sm text-white">{task.title}</h4>
                                        <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                                            <p>Client: <span className="text-slate-300 font-semibold">{task.assignedTasker.name}</span>({task.assignedTasker.email})</p>
                                        </div>
                                    </div>
                                    {/* Dispute Reason */}
                                    <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                                        <span className="text-[9px] font-bold text-rose-500 block uppercase">Dispute Statement:</span>
                                        <p className="text-xs text-slate-300 italic mt-0.5">"{task.disputeReason}"</p>
                                    </div>
                                    {/* Completion proof display */}
                                    {task.completionProof?.documentBase64 && (
                                        <div className="space-y-1.5">
                                            <span className="text-[9px] font-bold text-indgio-400 block uppercase">Uploaded Completion Proof:</span>
                                            <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-950 max-h-40 flex items-center justify-center">
                                                <img
                                                src={task.completionProof.documentBase64}
                                                alt="KYC Completion Proof"
                                                className="w-full h-auto max-h-40 object-contain"
                                                />
                                            </div>
                                            {task.completionProof.comment && (
                                                <p className="text-[10px] text-slate-400 italic">Comment: "{task.completionProof.comment}"</p>
                                            )}
                                        </div>
                                    )}
                                    {/* Dispute Resolution Buttons */}
                                    <div className="flx gap-2 border-t border-slate-850 pt-3">
                                        <button
                                        onClick={() => handleResolveDispute(task._id, 'release_to_tasker')}
                                        className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Check className="w-3.5 h-3.5"/>
                                            Release to Tasker
                                        </button>
                                        <button
                                        onClick={() => handleResolveDispute(task._id, 'refund_to_client')}
                                        className="flex-grow bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1"
                                        >
                                            <X className="w-3.5 h-3.5"/>
                                            Refund Client
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
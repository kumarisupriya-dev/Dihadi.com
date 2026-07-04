import React, {useState, useEffect} from 'react';
import {useAuth} from '../context/Authcontext';
import {apiFetch} from '../utils/api';
import {Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, AlertCircle, History, Landmark} from 'lucide-react';

interface Transaction {
    _id: string;
    amount: number;
    type: 'deposit' | 'withdraw' | 'escrow_lock' | 'escrow_release' | 'payment_received';
    description: string;
    createdAt: string;
}

export const Wallet: React.FC = () => {
    const {user, refreshUser} = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchTransactions = async () => {
        try {
            const data = await apiFetch('/wallet/transactions');
            setTransactions(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load transaction ledger.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!depositAmount || submitting) return;
        setError('');
        setSuccessMsg('');
        setSubmitting(true);

        try {
            await apiFetch('/wallet/deposit', {
                method: 'POST',
                body: JSON.stringify({amount: Number(depositAmount)})
            });
            setDepositAmount('');
            setSuccessMsg(`Successfully deposited ₹${Number(depositAmount).toFixed(2)} into your wallet.`);
            await refreshUser();
            await fetchTransactions();
        } catch (err: any) {
            setError(err.message || 'Deposit simulation failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdraw= async (e: React.FormEvent) => {
        e.preventDefault();
        if (!withdrawAmount || submitting) return;
        setError('');
        setSuccessMsg('');
        setSubmitting(true);

        try {
            await apiFetch('/wallet/withdraw', {
                method: 'POST',
                body: JSON.stringify({amount: Number(withdrawAmount)})
            });
            setWithdrawAmount('');
            setSuccessMsg(`Successfully withdrew ₹${Number(withdrawAmount).toFixed(2)} from your wallet.`);
            await refreshUser();
            await fetchTransactions();
        } catch (err: any) {
            setError(err.message || 'Withdrawal simulation failed.');
        } finally {
            setSubmitting(false);
        }
    };
    if (!user) return null;

    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <h1 className="text-3xl font-black text-white mb-8 flex items-center gap-3">
                <WalletIcon className="w-8 h-8 text-emerald-400"/>
                My Wallet Dashboard
            </h1>
            {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-sm p-4 rounded-xl mb-6">
                    <AlertCircle className="w-5 h-5 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}
            {successMsg && (
               <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-sm p-4 rounded-xl mb-6">
                   <Landmark className="w-5 h-5 flex-shrink-0" />
                   <span>{successMsg}</span>
               </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side: Balance and quick actions */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Balance Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl translate-y-4"></div>
                        <span className="text-xs text-slate-450 uppercase font-semibold block mb-1">Available Balance</span>
                        <span className="text-4xl  font-black text-white">₹{user.walletBalance.toFixed(2)}</span>
                        <p className="text-xs text-slate-500 mt-4 italic">Simulated Escrow Wallet Mode</p>
                    </div>
                    {/* Deposit Form */}
                <div className="bg-slate-900 border-slate-800 rounded-3xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
                        Add Simulated Funds
                    </h3>
                <form onSubmit={handleDeposit} className="space-y-4">
                    <input
                        type="number"
                        required
                        min={1}
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="Enter deposit amount (₹)"
                        className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none transition-colors duration-200"/>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors duration-200 shadow-md">
                        {submitting ? 'Adding...' :'Deposit Funds'}
                    </button>
                </form>
                </div>
                    {/* Withdraw Form */}
                    <div className="bg-slate-900 border-slate-800 rounded-3xl p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <ArrowUpCircle className="w-5 h-5 text-rose-400" />
                            withdraw funds
                        </h3>
                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <input
                                type="number"
                                required
                                min={1}
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="enter withdrawl amount (₹)"
                                    className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none transition-colors duration-200"/>
                                    <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors duration-200 shadow-md">
                                        {submitting ? 'Withdrawing...' : 'Withdraw Funds'}
                                    </button>
                        </form>
                    </div>
                </div>
                {/* Right Side : Transaction History list */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-full flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-400"/>
                            Transaction Ledger History
                        </h3>
                        {loading ? (
                            <div className="flex-grow flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/10">
                                <p className="text-slate-450 text-sm">
                                    Your transaction ledger is empty. Wallet activities will log here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                                {transactions.map((tx) => (
                                    <div
                                    key={tx._id}
                                    className="flex items-center justify-between bg-slate-950/40 border border-slate-850 p-4 rounded-2xl text-sm">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-white font-bold">{tx.description}</span>
                                            <span className="text-[10px] text-slate-500">
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <span className={`font-black text-md ${
                                        tx.amount > 0 ? 'text-emerald-450' : 'text-rose-400'
                                        }`}>
                                        {tx.amount > 0 ? `+₹${tx.amount.toFixed(2)}` : `-₹${Math.abs(tx.amount).toFixed(2)}`}
                                        </span>
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

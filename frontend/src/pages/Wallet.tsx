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
    const [filter, setFilter] = useState<'all' | 'deposits' | 'withdrawals' | 'escrow'>('all');
    const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
    const handlePrintReceipt = (tx: Transaction) => {
        const printWindow = window.open('','_blank');
        if (!printWindow) return;

        printWindow.document.write(`
        <html>
        <head>
        <title>Dihadi Receipt - ${tx._id}</title>
        <style>
        body {font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #f8fafc;}
        .receipt-box {border: 1px solid #e2e8f0; padding: 40px; max-width: 480px; margin: auto; border-radius: 24px; background: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);}
        .logo {font-size: 28px; font-weight: 900; color: #6366f1; text-align: center; margin-bottom: 4px;}
        .subtitle {text-align: center; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px;}
        .header {border-bottom: 2px dashed #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; text-align: center;}
        .header h3 {margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;}
        .row {display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 13px;}
        .label {color: #64748b; font-weight: 500;}
        .value {font-weight: 700; color: #0f172a; max-width: 250px; text-align: right; word-break: break-word;}
        .amount-row {border-top: 2px dashed #e2e8f0; padding-top: 18px; margin-top: 18px;}
        .amount {font-size: 22px; font-weight: 900; color: ${tx.amount > 0 ? '#10b981' : '#ef4444'};}
        .footer {text-align: center; margin-top: 32px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px;}
        .footer p {margin: 2px 0;}
</style>
</head>
<body>
<div class="row">
<div class="logo">Dihadi.com</div>
<div class="header">
<h3>OFFICIAL TRANSACTION RECEIPT</h3>
</div>
<div class="row"><span class="label">Receipt ID:</span><span class="value">${tx._id}</span></div>
<div class="row"><span class="label">Date & Time:</span><span class="value">${new Date(tx.createdAt).toLocaleString()}</span></div>
<div class="row"><span class="label">Category Type:</span><span class="value">${tx.type.replace('_', ' ').toUpperCase()}</span></div>
<div class="row"><span class="label">Payment Description:</span><span class="value">${tx.description}</span></div>
<div class="row amount-row"><span class="label">Total Amount:</span><span class="value amount">${tx.amount > 0 ? '+' : '-'}₹${Math.abs(tx.amount).toFixed(2)}</span></div>
<div class="footer">
<p>Thank you for choosing Dihadi.com</p>
<p>This transaction has been digitally verified & signed</p>
</div>
</div>
<script>
window.onload = function() {window.print(); window.print(); window.close();}
</script>
</body>
</html>
        `);
        printWindow.document.close();
    };

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
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-400"/>
                            Transaction Ledger History
                        </h3>
                    </div>
                    {/* Transaction classification tab bar filters */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-1 text-[10px] uppercase font-bold">
                        {(['all', 'deposits', 'withdrawals', 'escrow'] as const).map((tab) => (
                            <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-3.5 py-1.5 rounded-lg border transition-all duration-200 ${
                                filter === tab ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400 font-extrabold' : 
                                    'bg-slate-950/40 border-slate-850 text-slate-500 hover:text-slate-300'
                            }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    {loading ? (
                        <div className="flex-grow flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/10">
                            <p className="text-slate-455 text-sm">
                                Your transaction ledger is empty. Wallet activities will log here.
                            </p>
                        </div>
                    ): (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                            {transactions
                                .filter((tx) => {
                                    if (filter === 'all') return true;
                                    if (filter === 'deposits') return tx.type === 'deposit' || tx.type === 'payment_received';
                                    if (filter === 'withdrawals') return tx.type === 'withdraw';
                                    if (filter === 'escrow') return tx.type === 'escrow_lock' || tx.type === 'escrow_release';
                                    return true;
                                })
                                .map((tx) => (
                                    <div
                                    key={tx._id}
                                    className="flex items-center justify-between bg-slate-950/40 border border-slate-850 p-4 rounded-2xl text-sm hover:border-slate-800 transition-colors"
                                    >
                                        <div className="flex flex-col gap-1 pr-4">
                                            <span className="text-white font-bold">{tx.description}</span>
                                            <span className="text-[10px] text-slate-500">
                                                {new Date(tx.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <span className={`font-black text-md ${
                                                tx.amount > 0 ? 'text-emerald-450' : 'text-rose-400'
                                            }`}>
                                                {tx.amount > 0 ? `+₹${tx.amount.toFixed(2)}` : `-₹${Math.abs(tx.amount).toFixed(2)}`}
                                            </span>
                                            {/* Action button to generate receipt */}
                                            <button
                                            onClick={() => setActiveReceipt(tx)}
                                            className="text-[10px] font-bold text-brand-400 hover:text-brand-300 border border-brand-500/20 hover:border-brand-500/40 bg-brand-500/5 px-2.5 py-1.5 rounded-xl transition-all duration-200"
                                            >
                                                Receipt
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
            </div>
            {activeReceipt && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slalte-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative">
                        <div className="text-center">
                            <span className="text-2xl font-black text-brand-400 block tracking-tight">Dihadi.com</span>
                            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mt-1 block">Escrow Receipts Network</span>
                        </div>
                        <div className="border-t border-b border-slate-800 py-4 space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-455">Receipt Id:</span>
                                <span className="font-mono text-white text-right break-all ml-4">{activeReceipt._id}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-455">Created Date:</span>
                                <span className="text-white font-bold">{new Date(activeReceipt.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-455">Category:</span>
                                <span className="text-white uppercase font-bold">{activeReceipt.type.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-455 font-bold">Total Amount:</span>
                                <span className={`font-black text-sm ${activeReceipt.amount > 0 ? 'text-emerald-450' : 'text-rose-400'}`}>
                                    {activeReceipt.amount > 0 ? `+₹${activeReceipt.amount.toFixed(2)}` : `₹${Math.abs(activeReceipt.amount).toFixed(2)}`}
                                </span>
                            </div>
                        </div>
                        <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-2xl text-xs space-y-1.5">
                            <span className="text-[9px] font-bold text-slate-500 block uppercase">Payment Description</span>
                            <p className="text-slate-300 leading-relaxed italic">"{activeReceipt.description}"</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                            onClick={() => handlePrintReceipt(activeReceipt)}
                            className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md"
                            >
                                Print / PDF Receipt
                            </button>
                            <button
                            onClick={() => setActiveReceipt(null)}
                            className="bg-slate-800 hover:bg-slate-750 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
    );
};

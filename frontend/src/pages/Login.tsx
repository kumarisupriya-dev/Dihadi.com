import React, {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {useAuth} from '../context/Authcontext';
import {apiFetch} from "../utils/api";
import {KeyRound, Mail, AlertCircle} from 'lucide-react';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const {login} = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            login(data.token, data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-3xl font-extrabold text-white mb-2 text-center">Welcome Back</h2>
                <p className="text-slate-400 text-center mb-8">Sign in to post or find errands</p>
                {error && (
                    <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl mb-6 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-slate-950 bordr border-slate-850 focus:border-brand-500 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none transition-colors duration-200 shadow-inner"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            className="w-full bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none transition-colors duration-200 shadow-inner"
                            />
                        </div>
                    </div>
                    <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center"
                    >
                        {submitting ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
                <p className="mt-8 text-center text-sm text-slate-400">
                    Don't have an account?{''}
                    <Link to="/signup" className="text-brand-500 hover:underline font-semibold">
                        Create account
                    </Link>
                </p>
            </div>
        </div>
    );
};
import React, {useState, useEffect} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {useAuth} from '../context/Authcontext';
import {apiFetch} from '../utils/api';
import {User, Mail, KeyRound, MapPin, AlertCircle} from 'lucide-react';

export const Signup: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const {signup} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCoordinates([position.coords.longitude, position.coords.latitude]);
                },
                (err) => {
                    console.warn('Geolocation access denied. users can specify later.', err);
                }
            );
        }
    }, []);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const data = await apiFetch('/auth/signup', {
                method: 'POST',
                body: JSON.stringify({name, email, password, coordinates}),
            });
            signup(data.token, data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-3xl font-extrabold text-white mb-2 text-center">Join Dihadi.com</h2>
                <p className="text-slate-400 text-center mb-8">Start posting tasks or earning money</p>
                {error && (
                    <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1.5">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none transition-colors duration-200 shadow-inner"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            className="w-full bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none transition-colors duration-200 shadow-inner"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1.5">Password</label>
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="w-full bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none transition-colors duration-200 shadow-inner"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-4 py-3 rounded-xl">
                        <MapPin className={`w-5 h-5 ${coordinates ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span className="text-sm text-slate-400">
                            {coordinates ? 'Location captured successfully' : 'Requesting location...'}
                        </span>
                    </div>
                    <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center mt-6"
                    >
                        {submitting ? 'Creating Account...' : 'Get Started'}
                    </button>
                </form>
                <p className="mt-8 text-center text-sm text-slate-400">
                    Already have an account?{' '}
                    <Link to="/login" className="text-brand-500 hover:underline font-semibold">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};
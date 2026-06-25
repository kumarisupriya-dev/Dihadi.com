import React, {useState, useEffect, type FormEvent} from 'react';
import {useNavigate} from 'react-router-dom';
import {apiFetch} from '../utils/api';
import {Briefcase, IndianRupee, MapPin, AlignLeft, ClipboardList, AlertCircle} from 'lucide-react';

const CATEGORIES = [
    'AC Repair',
    'TV Repair',
    'WiFi/Network Repair',
    'Electrical',
    'Cleaning',
    'Plumbing',
    'Tutoring',
    'Delivery/Errands',
    'Other'
];

export const PostTask: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [budget, setBudget] = useState('');
    const [address, setAddress] = useState('');
    const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCoordinates([position.coords.longitude, position.coords.latitude]);
                },
                (err) => {
                    console.warn('Geolocation denied, using default coordinates.', err);
                    setError('Location access was denied. Task location will default to city center.');
                    setCoordinates([77.2090, 28.6139]);
                }
            );
        } else {
            setCoordinates([77.2090, 28.6139]);
        }
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (!coordinates) {
            setError('Waiting for location coordinates...');
            return;
        }
        setSubmitting(true);
        try {
            await apiFetch('/tasks', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    description,
                    category,
                    budget: Number(budget),
                    coordinates,
                    address
                })
            });
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to post task.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-6 py-12">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Briefcase className="w-8 h-8 text-brand-500"/>
                    <h2 className="text-3xl font-semibold text-white">Post a New Errand</h2>
                </div>
                <p className="text-slate-400 mb-8">
                    Provide the details of the job. Local students and helpers will see this and place bids.
                </p>
                {error && (
                    <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Errand Title</label>
                            <div className="relative">
                                <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Clean & service Split AC unit"
                                className="w-full bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none transition-colors duration-200 shadow-inner animate-pulse-once"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Category</label>
                            <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-3 px-4 text-white focus:outline-none transition-colors duration-200 shadow-inner"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Task Description</label>
                        <div className="relative">
                            <AlignLeft className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
                            <textarea
                            required
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Explain what needs to be done. Be specific so taskers can bid accurately."
                            className="w-full bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none transition-colors duration-200 shadow-inner resize-none"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Estimated Budget (₹)</label>
                            <div className="relative">
                                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                type="number"
                                required
                                min={10}
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="e.g. 500"
                                className="w-full bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none transition-colors duration-200 shadow-inner"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Task Address / Location Area</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                type="text"
                                required
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="e.g. Flat 304, Sector 15, Rohini"
                                className="w-full bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none transition-colors duration-200 shadow-inner"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 mt-8 pt-4 border-t border-slate-800">
                        <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-6 rounded-xl transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                        type="submit"
                        disabled={submitting}
                        className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-xl transition-colors duration-200 shadow-md"
                        >
                            {submitting ? 'Posting...' : 'Post Errand'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
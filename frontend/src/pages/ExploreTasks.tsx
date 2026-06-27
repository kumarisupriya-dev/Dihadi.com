import React, {useState, useEffect} from 'react';
import {apiFetch} from '../utils/api';
import {useNavigate} from 'react-router-dom';
import {Search, MapPin, IndianRupee, Calendar, SlidersHorizontal, AlertCircle, Compass} from 'lucide-react';

interface Task {
    _id: string;
    title: string;
    category: string;
    budget: number;
    address: string;
    createdAt: string;
    client: {
        name: string;
        rating: number;
        isVerified: boolean;
    };
}

const CATEGORIES = [
    'All Categories',
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

export const ExploreTasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All Categories');
    const [radius, setRadius] = useState('10');
    const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
    const [locationStatus, setLocationStatus] = useState('Detecting location...');
    const navigate = useNavigate();

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCoordinates([position.coords.longitude, position.coords.latitude]);
                    setLocationStatus('Using browser location');
                },
                (err) => {
                    console.warn('Geolocation denied, using default coordinates.', err);
                    setLocationStatus('Location access denied. Using default coordinates (New Delhi).');
                    setCoordinates([77.2090, 28.6139]);
                }
            );
        } else {
            setLocationStatus('Geolocation not supported by browser. Using default.');
            setCoordinates([77.2090, 28.6139]);
        }
    }, []);

    const fetchTasks = async () => {
        if (!coordinates) return;
        setLoading(true);
        setError('');
        try {
            let query = `?lat=${coordinates[1]}&lng=${coordinates[0]}&radius=${radius}`;
        if (category !== 'All Categories') {
            query += `&category=${encodeURIComponent(category)}`;
        }
        const data = await apiFetch(`/tasks${query}`);
        setTasks(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch nearby errands.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [coordinates, category, radius]);
    const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase()) ||
    task.address.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-2">
                        <Compass className="w-8 h-8 text-emerald-400"/>
                        Explore Nearby Errands
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-400"/>
                        {locationStatus}
                    </p>
                </div>
            </div>
            {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}
            {/* Filters Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl mb-8 space-y-6">
                <div className="flex items-center gap-2 text-slate-350 font-bold border-b border-slate-800 pb-3">
                    <SlidersHorizontal className="w-5 h-5 text-emerald-400"/>
                    <span>Search & Filters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Search Bar */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Search keywords</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-550"/>
                            <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by keywords or address..."
                            className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2.5 pl-12 pr-4 text-white focus:outline-none transition-colors duration-200 shadow-inner"
                            />
                        </div>
                    </div>
                    {/* Category selection */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                        <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-white focus:outline-none transition-colors duration-200 shadow-inner"
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Distance Radius */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Maximum Distance: <span className="text-emerald-400 font-bold">{radius} km</span>
                        </label>
                        <select
                        value={radius}
                        onChange={(e) => setRadius(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-white focus:outline-none transition-colors duration-200 shadow-inner"
                        >
                            <option value="5">Within 5 km</option>
                            <option value="10">Within 10 km</option>
                            <option value="25">Within 25 km</option>
                            <option value="50">Within 50 km</option>
                        </select>
                    </div>
                </div>
            </div>
            {/* Task Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-3xl p-16 text-center bg-slate-900/40">
                    <p className="text-slate-450 max-w-sm mx-auto mb-4">
                        No open errands found nearby matching your filters. Try widening your search radius or checking different categories!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map((task) => (
                        <div
                        key={task._id}
                        onClick={() => navigate(`/tasks/${task._id}`)}
                        className="group bg-slate-900 hover:bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 shadow-md hover:shadow-emerald-500/5 cursor-pointer transition-all duration-300 flex flex-col justify-between"
                        >
                            <div>
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2 mb-4">
                                    <span className="bg-slate-800 text-slate-350 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                        {task.category}
                                    </span>
                                    <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-black">
                                        <IndianRupee className="w-3.5 h-3.5"/>
                                        <span>{task.budget}</span>
                                    </div>
                                </div>
                                {/* Title */}
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-200 leading-snug">
                                    {task.title}
                                </h3>
                                {/* Client Info */}
                                <p className="text-xs text-slate-450 mb-4">
                                    Posted by: <span className="font-semibold text-slate-200">{task.client.name}</span>
                                </p>
                            </div>
                            {/* Bottom Info */}
                            <div className="border-t border-slate-800/80 pt-4 mt-6 flex items-center justify-between text-xs text-slate-500">
                                <span className="flex items-center gap-1 max-w-[65%] truncate" title={task.address}>
                                    <MapPin className="w-4 h-4 text-slate-600 flex-shrink-0"/>
                                    {task.address}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4 text-slate-600"/>
                                    {new Date(task.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {apiFetch} from '../utils/api';
import {MapPin, Navigation, Briefcase, Eye, AlertCircle, Sliders} from 'lucide-react';
import {MapContainer, TileLayer, Marker, Popup, useMap} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

const userIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

interface Task {
    _id: string;
    title: string;
    description?: string;
    category: string;
    budget: number;
    address: string;
    location: {
        coordinates: [number, number];
    };
    client: {
        _id: string;
        name: string;
        rating: number;
        isVerified: boolean;
    };
    isFeatured?: boolean;
    createdAt?: string;
}

const ChangeMapView: React.FC<{center: [number, number]}> = ({center}) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 13);
    }, [center, map]);
    return null;
};

export const ExploreTasks: React.FC = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [category, setCategory] = useState('');
    const [radius, setRadius] = useState('10');
    const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
    const [locationName, setLocationName] = useState('Fetching location...');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [minBudget, setMinBudget] = useState(0);
    const [maxBudget, setMaxBudget] = useState(10000);
    const [sortBy, setSortBy] = useState<'newest' | 'budget' | 'nearest'>('newest');

    const getBrowserLocation = () => {
        setLoading(true);
        setError('');
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            setCoordinates([28.6139, 77.2090]);
            setLocationName('New Delhi (Default)');
            setLoading(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoordinates([position.coords.latitude, position.coords.longitude]);
                setLocationName('My Current Location');
                setLoading(false);
            },
            (err) => {
                console.error('Geo error:', err);
                setError('Location access denied. Defaulting to New Delhi.');
                setCoordinates([28.6139, 77.2090]);
                setLocationName('New Delhi (Default)');
                setLoading(false);
            },
            {enableHighAccuracy: true, timeout: 10000}
        );
    };

    useEffect(() => {
        getBrowserLocation();
    }, []);

    const fetchNearbyTasks = async () => {
        if (!coordinates) return;
        setLoading(true);
        try {
            const [lat, lng] = coordinates;
            let url = `/tasks?lat=${lat}&lng=${lng}&radius=${radius}`;
            if (category) {
                url += `&category=${category}`;
            }
            const data = await apiFetch(url);
            setTasks(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load nearby tasks.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (coordinates) {
            fetchNearbyTasks();
        }
    }, [coordinates, category, radius]);

    const calculateDistance = (taskLat: number, taskLng: number): string => {
        if (!coordinates) return '0.0';
        const [userLat, userLng] = coordinates;
        const R = 6371;
        const dLat = ((taskLat - userLat) * Math.PI) / 180;
        const dLng = ((taskLng - userLng) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((userLat * Math.PI) / 180) *
            Math.cos((taskLat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    };

    const filteredAndSortedTasks = [...tasks]
        .filter((task) => {
            if (task.budget < minBudget || task.budget > maxBudget) return false;
            return true;
        })
        .sort((a, b) => {
            if (a.isFeatured !== b.isFeatured) {
                return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
            }
            if (sortBy === 'newest') {
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            }
            if (sortBy === 'budget') {
                return b.budget - a.budget;
            }
            if (sortBy === 'nearest') {
                const [aLng, aLat] = a.location.coordinates;
                const [bLng, bLat] = b.location.coordinates;
                const distA = parseFloat(calculateDistance(aLat, aLng));
                const distB = parseFloat(calculateDistance(bLat, bLng));
                return distA - distB;
            }
            return 0;
        });

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col h-[calc(100vh-80px)] relative">
            {/* Search filter header */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl mb-8 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Navigation className="w-6 h-6 text-brand-500 animate-pulse"/>
                    <div>
                        <h2 className="text-sm font-semibold text-slate-400">Search Radius Location</h2>
                        <p className="text-white font-bold text-xs">{locationName}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4 flex-grow max-w-2xl justify-end items-center">
                    <button
                    type="button"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`font-bold py-2 px-4 rounded-xl text-xs transition-all duration-200 flex items-center gap-1.5 border shadow-md ${
                        isFilterOpen
                        ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                            : 'bg-slate-850 hover:bg-slate-800 border-slate-750 text-white'
                    }`}
                    >
                        <Sliders className="w-4 h-4"/>
                        {isFilterOpen ? 'Close Filter Sidebar' : 'Filters & Sorting0'}
                    </button>
                    <button
                    onClick={getBrowserLocation}
                    className="bg-slate-850 hover:bg-slate-800 border border-slate-750 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                        <MapPin className="w-4 h-4"/>
                        Refresh GPS
                    </button>
                </div>
            </div>
            {/* Collapsible filters sidebar panel */}
            {isFilterOpen && (
                <div className="absolute top-36 left-6 bottom-12 w-80 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-3xl p-6 shadow-2xl z-40 flex flex-col justify-between animate-in slide-in-from-left duration-200">
                    <div className="space-y-6">
                        <h3 className="text-xs font-bold text-white border-b border-slate-800 pb-2 uppercase tracking-wider">
                            Filter Console
                        </h3>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-slate-455 block">Errand Category</label>
                            <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-2 px-3 text-white text-xs focus:outline-none transition-colors"
                            >
                                <option value="">All Categories</option>
                                <option value="Delivery">Delivery</option>
                                <option value="Cleaning">Cleaning</option>
                                <option value="Tech Help">Tech Help</option>
                                <option value="Housework">Housework</option>
                                <option value="Pets">Pets</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-455">
                                <label>Search Radius</label>
                                <span className="text-brand-400 font-extrabold">{radius} km</span>
                            </div>
                            <input
                            type="range"
                            min="1"
                            max="100"
                            value={radius}
                            onChange={(e) => setRadius(e.target.value)}
                            className="w-full h-1.5 bg-slate-950 rounded-lg apperance-none cursor-pointer accent-brand-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-455">
                                <label>Budget Threshold</label>
                                <span className="text-emerald-450 font-extrabold">₹{minBudget} - ₹{maxBudget}+</span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                type="number"
                                value={minBudget === 0 ? '' : minBudget}
                                onChange={(e) => setMinBudget(Number(e.target.value))}
                                placeholder="Min (₹)"
                                className="w-1/2 bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-1.5 px-3 text-white text-xs focus:outline-none"
                                />
                                <input
                                type="number"
                                value={maxBudget === 10000 ? '': maxBudget}
                                onChange={(e) => setMaxBudget(Number(e.target.value) || 10000)}
                                placeholder="Max (₹)"
                                className="w-1/2 bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-1.5 px-3 text-white text-xs focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-slate-455 block">Sort Errand Feed By</label>
                            <div className="grid grid-cols-3 gap-1">
                                {(['newest', 'budget', 'nearest'] as const).map((opt) => (
                                    <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setSortBy(opt)}
                                    className={`py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all duration-200 ${
                                        sortBy === opt
                                        ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' :
                                            'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-350'
                                    }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button
                    type="button"
                    onClick={() => {
                        setMinBudget(0);
                        setMaxBudget(1000);
                        setCategory('');
                        setRadius('10');
                        setSortBy('newest');
                    }}
                    className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 text-slate-45 hover:text-white font-bold py-2 rounded-xl text-[10px] transition-colors mt-6"
                    >
                        Reset Filters
                    </button>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-sm p-4 rounded-xl mb-6">
                    <AlertCircle className="w-5 h-5"/>
                    <span>{error}</span>
                </div>
            )}
            {/* Main split layout */}
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px]">
                {/* Left column: Errands list */}
                <div className="space-y-4 overflow-auto max-h-[550px] pr-2">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-indigo-400"/>
                        Available Errands ({filteredAndSortedTasks.length})
                    </h3>
                    {loading && filteredAndSortedTasks.length === 0 ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
                        </div>
                    ) : filteredAndSortedTasks.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-slate-800  rounded-3xl bg-slate-900/10">
                            <p className="text-slate-500 text-sm">No errands match these criteria.</p>
                        </div>
                    ) : (
                        filteredAndSortedTasks.map((task) => {
                            const [taskLng, taskLat] = task.location.coordinates;
                            const dist = calculateDistance(taskLat, taskLng);
                            return (
                                <div
                                key={task._id}
                                onClick={() => navigate(`/tasks/${task._id}`)}
                                className={`bg-slate-900 border ${
                                    task.isFeatured
                                    ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.12)] hover:border-amber-400' :
                                        'border-slate-800 hover:border-brand-500/40'
                                } rounded-3xl p-5 shadow-lg flex justify-between items-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5`}
                                >
                                    <div className="space-y-3 flex-grow pr-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {task.isFeatured && (
                                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider animate-pulse">
                                                    ★ Featured
                                                </span>
                                            )}
                                            <span className="bg-slate-850 text-slate-350 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                                                {task.category}
                                            </span>
                                            <span className="text-[10px] text-brand-400 font-semibold flex items-center gap-1">
                                                <Navigation className="w-3 h-3"/>
                                                {dist} km away
                                            </span>
                                        </div>
                                        <h4 className="text-md font-bold text-white leading-snug">{task.title}</h4>
                                        <p className="text-xs text-slate-400 line-clamp-2">{task.address}</p>
                                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                            <span>Posted by
                                            <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/profile/${task.client._id}`);
                                            }}
                                            className="font-bold text-slate-300 hover:text-brand-400 ml-1 transition-colors hover:underline"
                                            >
                                                {task.client.name}
                                            </button>
                                            </span>
                                            <span>•</span>
                                            <span>★ {task.client.rating > 0 ? task.client.rating.toFixed(1) : 'New'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-3 flex-shrink-0">
                                        <span className="text-lg font-black text-emerald-450 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-3 py-1 shadow-inner">
                                            ₹{task.budget}
                                        </span>
                                        <button className="bg-slate-800 hover:bg-slate-750 text-white font-bold p-2.5 rounded-xl text-xs transition-colors border border-slate-750 shadow-md">
                                            <Eye className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                {/* Right column: leaflet map */}
                {coordinates && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl h-[550px] relative z-10">
                        <MapContainer
                        center={coordinates}
                        zoom={13}
                        scrollWheelZoom={true}
                        className="w-full h-full"
                        >
                            <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="htpps://osm.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <ChangeMapView center={coordinates}/>
                            <Marker position={coordinates} icon={userIcon}>
                                <Popup>
                                    <div className="text-xs font-bold text-slate-900">You are here</div>
                                </Popup>
                            </Marker>
                            {/* Task Pins */}
                            {filteredAndSortedTasks.map((task) => {
                                const [taskLng, taskLat] = task.location.coordinates;
                                return (
                                    <Marker key={task._id} position={[taskLat, taskLng]}>
                                        <Popup>
                                            <div className="p-1 space-y-1">
                                                <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                    {task.category}
                                                </span>
                                                <h4 className="font-bold text-xs text-slate-900 leading-tight mt-1">{task.title}</h4>
                                                <p className="text-[10px] text-emerald-600 font-extrabold">₹{task.budget}</p>
                                                <button
                                                onClick={() => navigate(`/tasks/${task._id}`)}
                                                className="mt-2 w-full bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-bold py-1.5 rounded-md transition-colors text-center block"
                                                >
                                                    View Errand Details
                                                </button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MapContainer>
                    </div>
                )}
            </div>
        </div>
    );
};
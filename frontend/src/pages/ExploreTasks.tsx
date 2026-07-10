import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {apiFetch} from '../utils/api';
import {MapPin, Navigation, Briefcase, Eye, AlertCircle} from 'lucide-react';
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
                setError('Location access denied. Defaulting to NEw Delhi.');
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
            const [lat,lng] = coordinates;
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
    const calculatedDistance = (taskLat: number, taskLng: number): string => {
        if (!coordinates) return '0.0';
        const [userLat, userLng] = coordinates;
        const R = 6371;
        const dLat = ((taskLat - userLat) * Math.PI) /180;
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

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col h-[calc(100vh-80px)]">
            {/* Search Filter Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl mb-8 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Navigation className="w-6 h-6 text-brand-500 animate-pulse"/>
                    <div>
                        <h2 className="text-sm font-semibold text-slate-400">Search Radius Location</h2>
                        <p className="text-white font-bold text-xs">{locationName}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4 flex-grow max-w-2xl justify-end">
                    {/* Category Dropdown */}
                    <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-2 px-4 text-white text-xs focus:outline-none transition-colors"
                    >
                        <option value="">All Categories</option>
                        <option value="Delivery">Delivery</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Tech Help">Tech Help</option>
                        <option value="Housework">Housework</option>
                        <option value="Pets">Pets</option>
                        <option value="Other">Other</option>
                    </select>
                    {/* Radius selector */}
                    <select
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-2 px-4 text-white text-xs focus:outline-none transition-colors"
                    >
                        <option value="5">Within 5 km</option>
                        <option value="10">Within 10 km</option>
                        <option value="20">Within 20 km</option>
                        <option value="50">Within 50 km</option>
                    </select>
                    <button
                    onClick={getBrowserLocation}
                    className="bg-slate-850 hover:bg-slate-800 border border-slate-750 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center gap-1.5"
                    >
                        <MapPin className="w-4 h-4"/>
                        Refresh GPS
                    </button>
                </div>
            </div>
            {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-sm p-4 rounded-xl mb-6">
                    <AlertCircle className="w-5 h-5"/>
                    <span>{error}</span>
                </div>
            )}
            {/* Main Split Layout */}
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px]">
                {/* Left Column : Errands List */}
                <div className="space-y-4 overflow-y-auto max-h-[550px] pr-2">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-indigo-400"/>
                        Available Errands ({tasks.length})
                    </h3>
                    {loading && tasks.length === 0 ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                            <p className="text-slate-500 text-sm">No errands found within this range. Try increasing search radius.</p>
                        </div>
                    ) : (
                        tasks.map((task) => {
                            const [taskLng, taskLat] = task.location.coordinates;
                            const dist = calculatedDistance(taskLat, taskLng);
                            return (
                                <div
                                key={task._id}
                                onClick={() => navigate(`/tasks/${task._id}`)}
                                className="bg-slate-900 border border-slate-800 hover:border-brand-500/40 rounded-3xl p-5 shadow-lg flex justify-between items-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                                >
                                    <div className="space-y-3 flex-grow pr-4">
                                        <div className="flex items-center gap-2">
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
                {/* Right Column : Leaflet map */}
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
                            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <ChangeMapView center={coordinates}/>
                            <Marker position={coordinates} icon={userIcon}>
                                <Popup>
                                    <div className="text-xs font-bold text-slate-900">You are here</div>
                                </Popup>
                            </Marker>

                            {/* Task Pins */}
                            {tasks.map((task) => {
                                const[taskLng, taskLat] = task.location.coordinates;
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
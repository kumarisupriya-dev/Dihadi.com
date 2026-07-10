import React, {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useAuth} from '../context/Authcontext';
import {apiFetch} from '../utils/api';
import {io} from 'socket.io-client';
import {IndianRupee, Clock, MessageSquare, ShieldCheck, Star, AlertCircle, ArrowLeft, Send} from 'lucide-react';
import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
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
    description: string;
    category: string;
    budget: number;
    address: string;
    location: {
        coordinates: [number, number];
    };
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
        rating: number;
        isVerified: boolean;
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

interface ChatMessage {
    _id: string;
    text: string;
    sender: {
        _id: string;
        name: string;
    };
    createdAt: string;
}

interface SubmittedReview {
    _id: string;
    rating: number;
    comment?: string;
    createdAt: string;
}

export const TaskDetails: React.FC = () => {
    const {id} = useParams<{id: string}>();
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
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessageText, setNewMessageText] = useState('');
    const [socket, setSocket] = useState<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitted, setReviewSubmitted] = useState<SubmittedReview | null> (null);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [taskerLocation, setTaskerLocation] = useState<[number, number] | null> (null);
    const [isTrackingActive, setIsTRackingActive] = useState(false);
    const trackingIntervalRef = useRef<any>(null);

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
            if (user && (taskData.client._id === user.id || taskData.assignedTasker?._id === user.id)) {
                if (taskData.status === 'assigned' || taskData.status === 'completed') {
                    const msgs = await apiFetch(`/messages/${id}`);
                    setMessages(msgs);
                }
            }
            if (taskData.status === 'completed' && taskData.assignedTasker) {
                try {
                    const reviewsData = await apiFetch(`/reviews/user/${taskData.assignedTasker._id}`);
                    const matchingReview = reviewsData.find((r: any) => r.task === id) || null;
                    setReviewSubmitted(matchingReview);
                } catch {
                    setReviewSubmitted(null);
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
    useEffect(() => {
        if (user && id && task && (task.status === 'assigned' || task.status === 'completed')) {
            const isPart = task.client._id === user.id || task.assignedTasker?._id === user.id;
            if (isPart) {
                const socketInstance = io('http://localhost:5000');
                setSocket(socketInstance);
                socketInstance.emit('join_room', id);
                socketInstance.on('receive_message', (msg: ChatMessage) => {
                    setMessages((prev) => [...prev, msg]);
                });
                socketInstance.on('location_update', (coords: [number, number]) => {
                    setTaskerLocation(coords);
                })
                return () => {
                    socketInstance.disconnect();
                };
            }
        }
    }, [id, user, task?.status]);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);
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
            await refreshUser();
            await fetchTaskDetails();
        } catch (err: any) {
            setError(err.message || 'Failed to accept bid.');
        }
    };
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessageText.trim() || !socket || !task || !user) return;

        socket.emit('send_message', {
            taskId: task._id,
            senderId: user.id,
            text: newMessageText,
        });
        setNewMessageText('');
    };
    const handleSubmitReview = async (e: React.FormEvent)=> {
        e.preventDefault();
        if (!task || reviewSubmitting) return;
        setError('');
        setReviewSubmitting(true);
        try {
            await apiFetch('/reviews', {
                method: 'POST',
                body: JSON.stringify({
                    taskId: task._id,
                    rating: reviewRating,
                    comment: reviewComment,
                }),
            });
            setReviewComment('');
            await fetchTaskDetails();
        } catch (err: any) {
            setError(err.message || 'Failed to submit review.');
        } finally {
            setReviewSubmitting(false);
        }
    };
    const toggleLocationSharing = () => {
        if (!task || !socket) return;
    const [taskLng, taskLat] = task.location.coordinates;
        if (isTrackingActive) {
            if (trackingIntervalRef.current)
                clearInterval(trackingIntervalRef.current);
            setIsTRackingActive(false);
            setTaskerLocation(null);

            socket.emit('share_location', {
                taskId: task._id,
                coordinates: null
            });
        } else {
           setIsTRackingActive(true);
           let currentLng = taskLng - 0.012;
           let currentLat = taskLat - 0.012;

           socket.emit('share_location', {
           taskId: task._id,
           coordinates: [currentLng, currentLat]
        });
           trackingIntervalRef.current = setInterval(() => {
           currentLng += (taskLng - currentLng) * 0.08;
           currentLat += (taskLat - currentLat) * 0.08;

           socket.emit('share_location', {
           taskId: task._id,
           coordinates: [currentLat, currentLng]
           });
           if (Math.abs(taskLng - currentLng) < 0.0001 && Math.abs(taskLat - currentLat) < 0.0001) {
           clearInterval(trackingIntervalRef.current);
           setIsTRackingActive(false);
           }
        }, 2000);
        }
    };
    useEffect(() => {
        return () => {
            if (trackingIntervalRef.current)
    clearInterval(trackingIntervalRef.current);
        };
    }, []);
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh] bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
            </div>
        );
    }
    if (!task || !user) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12 text-center bg-slate-950 min-h-screen flex flex-col items-center justify-center">
                <p className="text-rose-400 mb-4">Task details could not be loaded.</p>
                <button onClick={() => navigate('/')} className="text-brand-500 hover:underline">
                    Go to Dashboard
                </button>
            </div>
        );
    }
    const isOwner = task.client._id === user.id;
    const myBid = bids.find((b) => b.tasker._id === user.id) || null;
    const isParticipant = isOwner || task.assignedTasker?._id === user.id;
    const [taskLng, taskLat] = task.location.coordinates;

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            {/* Back Button */}
            <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-455 hover:text-white transition-colors duration-200 mb-6 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm"
            >
                <ArrowLeft className="w-4 h-4"/>
                Back
            </button>
            {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-sm p-4 rounded-xl mb-6">
                    <AlertCircle className="w-5 h-5 flex-shrink-0"/>
                    <span>{error}</span>
                </div>
            )}
            {/* Main Grid: Details + Action Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Colum: Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <span className="bg-slate-800 text-slate-350 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                {task.category}
                            </span>
                            <span className="text-2xl font-black text-white flex items-center bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-2xl px-4 py-1.5 shadow-inner">
                                ₹{task.budget}
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-white mb-6 leading-tight">{task.title}</h1>
                        <h3 className="text-md font-bold text-slate-300 mb-2">Description</h3>
                        <p className="text-slate-355 leading-relaxed bg-slate-955/30 p-5 rounded-2xl border border-slate-850 mb-6 whitespace-pre-wrap">
                            {task.description}
                        </p>
                        <h3 className="text-md font-bold text-slate-300 mb-2">Location Area / Address</h3>
                        <p className="text-slate-355 bg-slate-955/30 p-4 rounded-2xl border border-slate-850 text-sm">
                            {task.address}
                        </p>
                        {/* Leaflet Map */}
                        <div className="h-64 rounded-2xl overflow-hidden border border-slate-800 z-10 relative">
                            <MapContainer
                            center={[taskLat, taskLng]}
                            zoom={14}
                            scrollWheelZoom={false}
                            className="w-full h-full"
                            >
                                <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <Marker position={[taskLat, taskLng]}>
                                    <Popup>
                                        <div className="text-xs font-bold text-slate-900">Job Site: {task.title}</div>
                                    </Popup>
                                </Marker>
                                {taskerLocation && (
                                <Marker position={[taskerLocation[1], taskerLocation[0]]} icon={userIcon}>
                                    <Popup>
                                        <div className="text-xs font-bold text-slate-900">Hired Earner (Live Location)</div>
                                    </Popup>
                                </Marker>
                                    )}
                            </MapContainer>
                        </div>
                    </div>
                    {/* Client Info Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-between">
                        {isOwner && task.assignedTasker ? (
                          <>
                              <div className="flex items-center gap-4">
                                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                                      <Star className="w-7 h-7 text-indigo-400 fill-indigo-400/20"/>
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-white text-lg flex items-center gap-1.5">
                                          <button
                                          onClick={() => navigate(`/profile/${task.assignedTasker?._id}`)}
                                          className="hover:text-brand-400 hover:underline transition-colors text-left"
                                          >
                                              {task.assignedTasker.name}
                                          </button>
                                          {task.assignedTasker.isVerified && <ShieldCheck className="w-5 h-5 text-emerald-450"/>}
                                      </h4>
                                      <p className="text-xs text-slate-455">Assigned Tasker Profile</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <span className="text-md font-bold text-slate-200 flex items-center gap-1 justify-end">
                                      {task.assignedTasker.rating > 0 ? `${task.assignedTasker.rating.toFixed(1)} / 5.0` : 'No reviews'}
                                  </span>
                                  <p className="text-xs text-slate-455">Tasker Rating</p>
                              </div>
                          </>
                        ) : (
                            <>
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                                        <Star className="w-7 h-7 text-amber-400 fill-amber-400"/>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg flex items-center gap-1.5">
                                            <button
                                            onClick={() => navigate(`/profile/${task.client._id}`)}
                                            className="hover:text-brand-400 hover:underline transition-colors text-lfet"
                                            >
                                                {task.client.name}
                                            </button>
                                            {task.client.isVerified && <ShieldCheck className="w-5 h-5 text-emerald-450"/>}
                                        </h4>
                                        <p className="text-xs text-slate-455">Client Profile</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-md font-bold text-slate-200 flex items-center gap-1 justify-end">
                                        {task.client.rating > 0 ? `${task.client.rating.toFixed(1)} / 5.0` : 'No reviews'}
                                    </span>
                                    <p className="text-xs text-slate-455">Client Rating</p>
                                </div>
                            </>
                        )}
                </div>
                </div>
                {/* Right Column: Actions & Chat */}
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
                    {/* Chat Interface */}
                    {isParticipant && (task.status === 'assigned' || task.status === 'completed') && (
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-[400px]">
                            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-indigo-400"/>
                                Live Errand Chat
                            </h3>
                            {/* Message Log */}
                            <div className="flex-grow overflow-y-auto mb-4 space-y-3 pr-1 text-xs scrollbar-thin">
                                {messages.map((msg) => {
                                    const isMe = msg.sender._id === user.id;
                                    return (
                                        <div
                                        key={msg._id}
                                        className={`flex flex-col max-w-[80%] rounded-2xl p-3 ${
                                            isMe
                                            ? 'bg-brand-500 text-white ml-auto rounded-tr-none'
                                            : 'bg-slate-950 text-slate-200 mr-auto rounded-tl-none border border-slate-850'    
                                        }`}
                                        >
                                            <span className="text-[10px] text-slate-450 font-bold mb-1 block">
                                                {isMe ? 'You' : msg.sender.name}
                                            </span>
                                            <p className="leading-relaxed break-words">{msg.text}</p>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef}/>
                            </div>
                            {/* Chat Input Form */}
                            {task.status === 'assigned' && (
                                <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-800 pt-3">
                                    <input
                                    type="text"
                                    value={newMessageText}
                                    onChange={(e) => setNewMessageText(e.target.value)}
                                    placeholder="Type Message"
                                    className="flex-grow bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-2 px-3 text-white text-xs focus:outline-none transition-colors duration-200"
                                    />
                                    <button
                                    type="submit"
                                    className="bg-brand-500 hover:bg-brand-600 text-white p-2 rounded-xl transition-colors duration-200 flex-shrink-0"
                                    >
                                        <Send className="w-4 h-4"/>
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                    {/* 1.Client View - accept bids or complete errand */}
                    {isOwner && (
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                            {task.status === 'assigned' ? (
                                <div className="space-y-4 text-center">
                                    <h3 className="text-lg font-bold text-white">Errand in Progress</h3>
                                    <p className="text-xs text-slate-450">
                                        Tasker <span className="font-bold text-white">{task.assignedTasker?.name}</span> is hired.
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
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-colors duration-200 shadow-md"
                                    >
                                        Confirm Job Done & Pay
                                    </button>
                                </div>
                            ) : task.status === 'open' ? (
                                <>
                                <h3 className="text-xl font-bold text-white">Received Bids ({bids.length})</h3>
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
                                                               <button
                                                               onClick={() => navigate(`/profile/${bid.tasker._id}`)}
                                                               className="hover:text-brand-400 hover:underline transition-colors text-left"
                                                               >
                                                                   {bid.tasker.name}
                                                               </button>
                                                                {bid.tasker.isVerified && <ShieldCheck className="w-4 h-4 text-emerald-450"/>}
                                                            </span>
                                                            <span className="text-[10px] text-slate-450">
                                                                {bid.tasker.rating > 0 ?`★ ${bid.tasker.rating.toFixed(1)}` : 'New Tasker'}
                                                            </span>
                                                        </div>
                                                        <span className="text-emerald-450 font-black text-sm">₹{bid.bidAmount}</span>
                                                    </div>
                                                    {bid.message && (
                                                        <p className="text-xs text-slate-400 bg-slate-950/80 p-2.5 rounded-xl border border-slate-850 italic">
                                                            "{bid.message}"
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-455">
                                                        <Clock className="w-3.5 h-3.5"/>
                                                        <span>Ready in: {bid.estimatedTime}</span>
                                                    </div>
                                                    <button
                                                    onClick={() => handleAcceptBid(bid._id)}
                                                    className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 rounded-xl text-xs transition-colors duration-200 shadow-md"
                                                    >
                                                        Accept & Hire
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : null}
                            {/* Task completed: Rating form or display */}
                            {task.status === 'completed' && (
                                <div className="space-y-4">
                                    {reviewSubmitted ? (
                                        <div className="bg-slate-955/40 border border-slate-850 rounded-2xl p-4 space-y-2">
                                            <h4 className="text-xs text-slate-450 uppercase font-bold">Your Submitted Review</h4>
                                            <div className="flex items-center gap-1 text-amber-400">
                                                {Array.from({length: 5}).map((_, index) => (
                                                    <Star
                                                    key={index}
                                                    className={`w-4 h-4 ${index < reviewSubmitted.rating ? 'fill-amber-400' : 'text-slate-600'}`}
                                                    />
                                                ))}
                                            </div>
                                            {reviewSubmitted.comment && (
                                                <p className="text-xs text-slate-300 italic">"{reviewSubmitted.comment}"</p>
                                            )}
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmitReview} className="space-y-4">
                                            <h3 className="text-md font-bold text-white">Rate the Tasker's Work</h3>
                                            {/* Rating Stars */}
                                            <div className="flex items-center gap-2">
                                                {Array.from({length: 5}).map((_, index) => {
                                                    const starValue = index  + 1;
                                                return (
                                                    <button
                                                    type="button"
                                                    key={index}
                                                    onClick={() => setReviewRating(starValue)}
                                                    className="text-amber-400 hover:scale-110 transition-transform duration-100"
                                                    >
                                                        <Star className={`w-7 h-7 ${starValue <= reviewRating ? 'fill-amber-400' : 'text-slate-600'}`}/>
                                                    </button>
                                                );
                                                })}
                                            </div>
                                            {/* Comment */}
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Feedback Comment</label>
                                                <textarea
                                                rows={3}
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                                placeholder="Tell us about your experience..."
                                                className="w-full bg-slate-950 border border-slate-850 focus:border-brand-500 rounded-xl py-2 px-3 text-white text-xs focus:outline-none transition-colors duration-200 resize-none"
                                                />
                                            </div>
                                            <button
                                            type="submit"
                                            disabled={reviewSubmitting}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-colors duration-200 shadow-md"
                                            >
                                                {reviewSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {/* 2.Tasker View - Place bid or view my placed bid status */}
                    {!isOwner && (
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                            {/* Place bid form */}
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
                                            className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2 pl-9 pr-3 text-white text-sm focus:outline-none transition-colors duration-200"
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
                                            className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2 pl-9 pr-3 text-white text-sm focus:outline-none transition-colors duration-200"
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
                                            className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl py-2 pl-9 pr-3 text-white text-sm focus:outline-none transition-colors duration-200 resize-none"
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
                            {/* Task opened but user already placed a bid */}
                            {task.status === 'open' && myBid && (
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
                                    <p className="text-xs text-slate-550">
                                        Waiting for the client to review and accept.
                                    </p>
                                </div>
                            )}
                            {/* task is assigned to someone else */}
                            {task.status === 'assigned' && task.assignedTasker?._id !== user.id && (
                                <p className="text-slate-450 text-sm text-center py-4">
                                    This task has been assigned to another tasker.
                                </p>
                            )}
                            {/* Task is assigned to the current user */}
                            {task.status === 'assigned' && task.assignedTasker?._id === user.id && (
                                <div className="text-center py-4 space-y-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                                    <h3 className="text-md font-extrabold text-emerald-400">You are hired!</h3>
                                    <p className="text-xs text-slate-350">
                                        Your live chat is now active. Communicate with the client to complete this task.
                                    </p>
                                    <button
                                    onClick={toggleLocationSharing}
                                    className={`w-full font-bold py-2 rounded-xl text-xs transition-all duration-200 shadow-md border ${
                                        isTrackingActive ? 'bg-rose-600/15 border-rose-500/20 text-rose-455 hover:bg-rose-600/20' :
                                            'bg-emerald-600 hover:bg-emerald-700 border-emerald-700 text-white'
                                    }`}
                                    >
                                        {isTrackingActive ? 'Stop Live Location Sharing' : 'Start Live Location Sharing'}
                                    </button>
                                </div>
                            )}
                            {/* Task is completed */}
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
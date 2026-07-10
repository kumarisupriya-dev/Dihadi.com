import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {apiFetch} from '../utils/api';
import {Star, ShieldCheck, ArrowLeft, AlertCircle, Calendar, MessageSquare, Briefcase} from 'lucide-react';

interface UserProfile {
    _id: string;
    name: string;
    email: string;
    isVerified: boolean;
    rating: number;
    reviewCount: number;
    createdAt: string;
}

interface Review {
    _id: string;
    reviewer: {
        _id: string;
        name: string;
    };
    rating: number;
    comment?: string;
    createdAt: string;
}

export const Profile: React.FC = () => {
    const {userId} = useParams<{userId: string}>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile |null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProfileData = async () => {
        setLoading(true);
        setError('');
        try {
            const profileData = await apiFetch(`/auth/profile/${userId}`);
            setProfile(profileData);
            const reviewsData = await apiFetch(`/reviews/user/${userId}`);
            setReviews(reviewsData);
        } catch (err: any) {
            setError(err.message || 'Failed to load profile details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchProfileData();
        }
    }, [userId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh] bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
            </div>
        );
    }
    if (error || !profile) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12 text-center bg-slate-950 min-h-[80vh] flex flex-col items-center justify-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-4 animate-bounce"/>
                <p className="text-rose-400 mb-4">{error || 'Profile could not be loaded.'}</p>
                <button onClick={() => navigate(-1)} className="text-brand-500 hover:underline">
                    Go Back
                </button>
            </div>
        );
    }
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
            {/* Back Button */}
            <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-450 hover:text-white transition-colors duration-200 mb-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm self-start"
            >
                <ArrowLeft className="w-4 h-4"/>
                Back
            </button>
            {/* Main profile info card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    {/* Avatar Icon */}
                    <div className="bg-brand-500/10 border border-brand-500/20 text-brand-500 w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black shadow-inner">
                        {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-white flex items-center justify-center md:justify-start gap-2">
                            {profile.name}
                            {profile.isVerified && <ShieldCheck className="w-7 hg-7 text-emerald-450 fill-emerald-450/10"/>}
                        </h1>
                        <p className="text-sm text-slate-400">{profile.name}</p>
                        <p className="text-xs text-slate-500 flex items-center justify-center md:justify-start gap-1">
                            <Calendar className="w-4 h-4"/>
                            Member since {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                {/* User ratings dashboard widget */}
                <div className="flex gap-8 border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8 w-full md:w-auto justify-around">
                    <div className="text-center">
                        <span className="text-4xl font-black text-white flex items-center justify-center gap-1">
                            {profile.rating > 0 ? profile.rating.toFixed(1) : '—'}
                            {profile.rating > 0 && <Star className="w-6 h-6 text-amber-400 fill-amber-400"/>}
                        </span>
                        <p className="text-xs text-slate-450 uppercase font-smeibold mt-1">Average Rating</p>
                    </div>
                    <div className="text-center">
                        <span className="text-4xl font-black text-white">
                            {profile.reviewCount}
                        </span>
                        <p className="text-xs text-slate-450 uppercase font-semibold mt-1">Total Reviews</p>
                    </div>
                </div>
            </div>
            {/* Historical reviews feed section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-400"/>
                    Review History Feed
                </h3>
                {reviews.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-950/10">
                        <Briefcase className="w-10 h-10 text-slate-650 mx-auto mb-3"/>
                        <p className="text-slate-500 text-sm">No review feedback comments left for this user yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((rev) => (
                            <div key={rev._id} className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        {/* Clickable reviewer name */}
                                        <button
                                        onClick={() => navigate(`/profile/${rev.reviewer._id}`)}
                                        className="font-bold text-sm text-white hover:text-brand-400 transition-colors text-left"
                                        >
                                            {rev.reviewer.name}
                                        </button>
                                        <span className="text-[10px] text-slate-500 block mt-0.5">
                                            {new Date(rev.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {/* Star display */}
                                    <div className="flex items-center gap-0.5 text-amber-400">
                                        {Array.from({length: 5}).map((_, index) => (
                                            <Star
                                            key={index}
                                            className={`w-3.5 h-3.5 ${
                                                index < rev.rating ? 'fill-amber-400' : 'text-slate-700'
                                            }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {rev.comment && (
                                    <p className="text-xs text-slate-300 italic leading-relaxed">
                                        "{rev.comment}"
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
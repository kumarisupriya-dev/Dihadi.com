import React from 'react';
import {useAuth} from '../context/Authcontext';

export const Dashboard: React.FC = () => {
    const {user, currentRole} = useAuth();
    if (!user) return null;
    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
                <h1 className="text-3xl font-extrabold text-white mb-2">
                    Welcome, {user.name}!
                </h1>
                <p className="text-slate-400 mb-6">
                    You are currently in <span className="font-bold text-white capitalize">{currentRole} Mode</span>
                </p>
                {/* View Selection */}
                {currentRole === 'client' ? (
                    <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-950/20">
                        <h3 className="text-lg font-bold text-white mb-2">Post a New Errand</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-6">
                            Need AC service, wiring checks, or device repairs? Post an errand to hire local earners.
                        </p>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors duration-200">
                            Create Errand Post
                        </button>
                    </div>
                ) : (
                    <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-950/20">
                        <h3 className="text-lg font-bold text-white mb-2">Explore Nearby Errands</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-6">
                            Look for local tasks around your location, place a bid, and start earning money today.
                        </p>
                        <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors duration-200">
                            Browse Errands
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
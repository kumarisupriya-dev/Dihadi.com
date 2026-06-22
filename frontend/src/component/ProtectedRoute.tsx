import React from 'react';
import {Navigate} from 'react-router-dom';
import {useAuth} from '../context/Authcontext';

export const ProtectedRoute: React.FC<{children: React.ReactNode}> = ({children}) => {
    const {token, loading} = useAuth();
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
            </div>
        );
    }
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};
import React, {createContext, useContext, useState, useEffect} from 'react';

export type UserRole = 'client' | 'tasker';
interface User {
    id: string;
    name: string;
    email: string;
    walletBalance: number;
    location? : {coordinates: [number, number]};
    isVerified: boolean;
}
interface AuthContextType {
    user: User | null;
    token: string | null;
    currentRole: UserRole;
    loading: boolean;
    login: (token: string, user: User) => void;
    signup: (token: string, user: User) => void;
    logout: () => void;
    toggleRole: () => void;
    refreshUser: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('dihadi_token'));
    const [currentRole, setCurrentRole] = useState<UserRole>((localStorage.getItem('dihadi_role') as UserRole) || 'client');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const API_URL = 'http://localhost:5000/api';
                    const res = await fetch(`${API_URL}/auth/me`, {
                        headers: {'Authorization': `Bearer ${token}`}
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const dbUser = data.user;
                        setUser({
                            id: dbUser._id,
                            name: dbUser.name,
                            email: dbUser.email,
                            walletBalance: dbUser.walletBalance ?? 0,
                            location: dbUser.location,
                            isVerified: dbUser.isVerified
                        });
                    } else {
                        logout();
                    }
                } catch (err) {
                    console.error(err);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, [token]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('dihadi_token', newToken);
        setToken(newToken);
        setUser(newUser);
    };
    const signup = (newToken: string, newUser: User) => {
        localStorage.setItem('dihadi_token', newToken);
        setToken(newToken);
        setUser(newUser);
    };
    const logout = () => {
        localStorage.removeItem('dihadi_token');
        setToken(null);
        setUser(null);
    };
    const toggleRole = () => {
        const nextRole = currentRole === 'client' ? 'tasker' : 'client';
        localStorage.setItem('dihadi_role', nextRole);
        setCurrentRole(nextRole);
    };

    const refreshUser = async () => {
        if (!token) return;
            try {
                const API_URL = 'http://localhost:5000/api';
                const res = await fetch(`${API_URL}/auth/me`, {
                    headers: {'Authorization': `Bearer ${token}`}
                });
                if (res.ok) {
                    const data = await res.json();
                    const dbUser = data.user;
                    setUser({
                        id: dbUser._id,
                        name: dbUser.name,
                        email: dbUser.email,
                        walletBalance: dbUser.walletBalance ?? 0,
                        location: dbUser.location,
                        isVerified: dbUser.isVerified
                    });
                }
            } catch (err) {
                console.error('Failed to refresh user profile data:', err);
            }
        }
        ;

        return (
            <AuthContext.Provider
                value={{ user, token, currentRole, loading, login, signup, logout, toggleRole, refreshUser }}>
                {children}
            </AuthContext.Provider>
        );
    };
    export const useAuth = () => {
        const context = useContext(AuthContext);
        if (!context) throw new Error('useAuth must be used within an AuthProvider');
        return context;
    };

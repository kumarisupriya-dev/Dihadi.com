import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {AuthProvider} from './context/Authcontext';
import {ProtectedRoute} from './component/ProtectedRoute';
import {Navbar} from './component/Navbar';
import {Login} from './pages/Login';
import {Signup} from './pages/Signup';
import {Dashboard} from './pages/Dashboard';
import {PostTask} from './pages/PostTask';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
                    <Navbar />
                    <main className="flex-grow">
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />}/>
                            <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                            />
                            <Route
                            path="/post-task"
                            element={
                                <ProtectedRoute>
                                    <PostTask/>
                                </ProtectedRoute>
                            }
                            />
                            <Route path="*" element={<Navigate to="/" replace />}/>
                        </Routes>
                    </main>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
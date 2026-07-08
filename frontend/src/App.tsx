import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {AuthProvider} from './context/Authcontext';
import {ProtectedRoute} from './component/ProtectedRoute';
import {Navbar} from './component/Navbar';
import {Login} from './pages/Login';
import {Signup} from './pages/Signup';
import {Dashboard} from './pages/Dashboard';
import {PostTask} from './pages/PostTask';
import {ExploreTasks} from './pages/ExploreTasks';
import {TaskDetails} from './pages/TaskDetails';
import {Wallet} from './pages/Wallet';
import {SocketProvider} from './context/SocketContext';
import {ThemeProvider} from './context/ThemeContext';

function App() {
    return (
      <ThemeProvider>
        <AuthProvider>
            <SocketProvider>
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
                                    <PostTask />
                                </ProtectedRoute>
                            }
                            />
                            <Route
                            path="/explore"
                            element={
                                <ProtectedRoute>
                                    <ExploreTasks />
                                </ProtectedRoute>
                            }
                            />
                            <Route
                            path="/tasks/:id"
                            element={
                                <ProtectedRoute>
                                    <TaskDetails />
                                </ProtectedRoute>
                            }
                            />
                            <Route
                            path="/wallet"
                            element={
                                <ProtectedRoute>
                                    <Wallet />
                                </ProtectedRoute>
                            }
                            />
                            <Route path="*" element={<Navigate to="/" replace />}/>
                        </Routes>
                    </main>
                </div>
            </Router>
            </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    );
}

export default App;
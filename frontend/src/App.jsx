import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Database, BookOpen, Sun, Moon } from 'lucide-react';

import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import EmbeddingPage from './pages/EmbeddingPage';
import TeacherDashboard from './pages/TeacherDashboard';
import { authService } from './services/auth.service';

function Layout({ children, onLogout, userRole, isDark, onToggleDark }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden selection:bg-zinc-200 selection:text-zinc-900 ${isDark ? 'dark bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'}`}>
      {onLogout && (
        <header className={`h-16 flex items-center justify-between px-6 md:px-8 border-b backdrop-blur-md shrink-0 z-50 shadow-sm ${
            isDark
              ? 'border-zinc-800 bg-zinc-950/80 shadow-zinc-900/50'
              : 'border-zinc-100 bg-white/70 shadow-zinc-100/50'
          }`}>
          <Link 
            to={userRole === 'STUDENT' ? '/student' : userRole === 'TEACHER' ? '/teacher' : '/admin'} 
            className="flex items-center gap-3 group transition-opacity hover:opacity-90"
          >
            <div className="relative w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform group-hover:scale-[1.03] duration-300">
              <span>E</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-bold tracking-tight leading-none ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>EduBot AI</span>
              <span className="text-[9px] text-zinc-400 font-bold tracking-wider uppercase mt-0.5">Workspace</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-6">
            {userRole === 'ADMIN' && (
              <nav className={`hidden md:flex items-center gap-1.5 p-1 rounded-xl border ${isDark ? 'bg-zinc-800/60 border-zinc-700/40' : 'bg-zinc-100/60 border-zinc-200/40'}`}>
                <Link 
                  to="/admin" 
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive('/admin') 
                      ? isDark ? 'bg-zinc-700 text-zinc-100 shadow-sm border border-zinc-600/30' : 'bg-white text-zinc-900 shadow-sm border border-zinc-200/30'
                      : isDark ? 'text-zinc-400 hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <LayoutDashboard size={13} /> Dashboard
                </Link>
                <Link 
                  to="/embedding" 
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive('/embedding') 
                      ? isDark ? 'bg-zinc-700 text-zinc-100 shadow-sm border border-zinc-600/30' : 'bg-white text-zinc-900 shadow-sm border border-zinc-200/30'
                      : isDark ? 'text-zinc-400 hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <Database size={13} /> Knowledge Base
                </Link>
              </nav>
            )}
            
            {userRole === 'TEACHER' && (
              <nav className={`hidden md:flex items-center gap-1.5 p-1 rounded-xl border ${isDark ? 'bg-zinc-800/60 border-zinc-700/40' : 'bg-zinc-100/60 border-zinc-200/40'}`}>
                <Link 
                  to="/teacher" 
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive('/teacher') 
                      ? isDark ? 'bg-zinc-700 text-zinc-100 shadow-sm border border-zinc-600/30' : 'bg-white text-zinc-900 shadow-sm border border-zinc-200/30'
                      : isDark ? 'text-zinc-400 hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <BookOpen size={13} /> Course Docs
                </Link>
              </nav>
            )}

            <div className={`flex items-center gap-4 border-l pl-6 ${isDark ? 'border-zinc-700/80' : 'border-zinc-200/80'}`}>
              <div className={`hidden sm:flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider border ${
                isDark
                  ? 'text-zinc-400 bg-zinc-800/60 border-zinc-700/60'
                  : 'text-zinc-500 bg-zinc-50 border-zinc-200/80'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {userRole}
              </div>
              <button
                onClick={onToggleDark}
                className={`p-2 rounded-xl border border-transparent transition-all focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
                  isDark
                    ? 'text-zinc-400 hover:text-yellow-300 hover:bg-zinc-800 hover:border-zinc-700/50'
                    : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 hover:border-zinc-200/50 hover:shadow-sm'
                }`}
                title={isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
                id="theme-toggle-btn"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button 
                onClick={onLogout} 
                className={`p-2 rounded-xl border border-transparent transition-all focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
                  isDark
                    ? 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800 hover:border-zinc-700/50'
                    : 'text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 hover:border-zinc-200/50 hover:shadow-sm'
                }`}
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>
      )}
      <main className={`flex-1 flex overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-zinc-50'}`}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleToggleDark = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem('userRole', role);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('userRole');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout isDark={isDark} onToggleDark={handleToggleDark}>
              <AuthPage onLogin={handleLogin} />
            </Layout>
          }
        />
        <Route
          path="/student"
          element={
            isAuthenticated && userRole === 'STUDENT' ? (
              <Layout onLogout={handleLogout} userRole={userRole} isDark={isDark} onToggleDark={handleToggleDark}>
                <StudentDashboard isDark={isDark} />
              </Layout>
            ) : <Navigate to="/" />
          }
        />
        <Route
          path="/admin"
          element={
            isAuthenticated && userRole === 'ADMIN' ? (
              <Layout onLogout={handleLogout} userRole={userRole} isDark={isDark} onToggleDark={handleToggleDark}>
                <AdminDashboard isDark={isDark} />
              </Layout>
            ) : <Navigate to="/" />
          }
        />
        <Route
          path="/embedding"
          element={
            isAuthenticated && userRole === 'ADMIN' ? (
              <Layout onLogout={handleLogout} userRole={userRole} isDark={isDark} onToggleDark={handleToggleDark}>
                <EmbeddingPage isDark={isDark} />
              </Layout>
            ) : <Navigate to="/" />
          }
        />
        <Route
          path="/teacher"
          element={
            isAuthenticated && userRole === 'TEACHER' ? (
              <Layout onLogout={handleLogout} userRole={userRole} isDark={isDark} onToggleDark={handleToggleDark}>
                <TeacherDashboard isDark={isDark} />
              </Layout>
            ) : <Navigate to="/" />
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

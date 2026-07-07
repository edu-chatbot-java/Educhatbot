import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';

import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import EmbeddingPage from './pages/EmbeddingPage';
import TeacherDashboard from './pages/TeacherDashboard';
import { authService } from './services/auth.service';

function Layout({ children, theme, toggleTheme, onLogout, userRole }) {
  return (
    <div className={`h-screen flex flex-col bg-background text-foreground transition-colors duration-300 font-sans overflow-hidden`}>
      <header className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-primary to-violet-600 flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/20">E</div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80">EduBot AI</span>
        </div>
        <div className="flex items-center gap-4">
          {onLogout && userRole === 'ADMIN' && (
            <div className="flex gap-4 mr-4 text-sm font-medium">
              <a href="/admin" className="hover:text-primary transition-all duration-200 py-1.5 px-3 rounded-lg hover:bg-muted">Admin Dashboard</a>
              <a href="/embedding" className="hover:text-primary transition-all duration-200 py-1.5 px-3 rounded-lg hover:bg-muted">Embedding Center</a>
            </div>
          )}
          {onLogout && userRole && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {userRole === 'ADMIN' ? '👑 Admin' : userRole === 'TEACHER' ? '👨‍🏫 Giảng viên' : '👨‍🎓 Sinh viên'}
            </span>
          )}
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted transition-colors border border-border/50">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {onLogout && (
            <button onClick={onLogout} className="p-2 rounded-full hover:bg-muted transition-colors text-destructive border border-destructive/20 hover:bg-destructive/10">
              <LogOut size={20} />
            </button>
          )}
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

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
            <Layout theme={theme} toggleTheme={toggleTheme}>
              <AuthPage onLogin={handleLogin} />
            </Layout>
          } 
        />
        <Route 
          path="/student" 
          element={
            isAuthenticated && userRole === 'STUDENT' ? (
              <Layout theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} userRole={userRole}>
                <StudentDashboard />
              </Layout>
            ) : <Navigate to="/" />
          } 
        />
        <Route 
          path="/admin" 
          element={
            isAuthenticated && userRole === 'ADMIN' ? (
              <Layout theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} userRole={userRole}>
                <AdminDashboard />
              </Layout>
            ) : <Navigate to="/" />
          } 
        />
        <Route 
          path="/embedding" 
          element={
            isAuthenticated && userRole === 'ADMIN' ? (
              <Layout theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} userRole={userRole}>
                <EmbeddingPage />
              </Layout>
            ) : <Navigate to="/" />
          } 
        />
        <Route 
          path="/teacher" 
          element={
            isAuthenticated && userRole === 'TEACHER' ? (
              <Layout theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} userRole={userRole}>
                <TeacherDashboard />
              </Layout>
            ) : <Navigate to="/" />
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPage({ onLogin }) {
  const [userType, setUserType] = useState('STUDENT');
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mssv, setMssv] = useState('');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  const handleAuth = async () => {
    try {
      if (tab === 'signin') {
        const response = await authService.login({ email, password });
        const realRole = response.role ? response.role.replace('ROLE_', '') : 'STUDENT';
        
        // Nếu là Admin, ưu tiên cao nhất đẩy vào trang Admin
        if (realRole === 'ADMIN') {
          if (onLogin) onLogin('ADMIN');
          navigate('/admin');
        } else {
          // Còn lại điều hướng dựa trên Tab Sinh viên/Giảng viên
          if (onLogin) onLogin(userType);
          
          if (userType === 'TEACHER') {
            navigate('/teacher');
          } else {
            navigate('/student');
          }
        }
      } else {
        await authService.register({ 
          email, 
          password, 
          username: mssv, 
          fullName: fullName || mssv 
        });
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        setTab('signin');
      }
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Vui lòng kiểm tra lại thông tin.'));
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      
      {/* Left Column: Branding / Visual (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-white text-3xl font-medium tracking-tight">EduChatbot</h1>
          </motion.div>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-6 leading-[1.1]"
          >
            An intelligent assistant for modern education.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-zinc-400 text-lg leading-relaxed max-w-md"
          >
            Seamlessly integrating AI into your learning and teaching workflow. 
            Access course materials, answer queries instantly, and track progress all in one place.
          </motion.p>
        </div>
        
        {/* Subtle decorative mesh or gradient could go here, keeping it minimal for now */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-800/40 via-zinc-950 to-zinc-950 opacity-60"></div>
      </div>

      {/* Right Column: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-[420px]">
          
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10"
          >
            <h2 className="text-3xl font-medium tracking-tight text-zinc-950 mb-2">
              {tab === 'signin' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-zinc-500">
              {tab === 'signin' 
                ? 'Enter your credentials to access your workspace.' 
                : 'Sign up to start using the education platform.'}
            </p>
          </motion.div>

          {/* User Type Segmented Control */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex p-1 bg-zinc-100 rounded-xl mb-8"
          >
            <button 
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                userType === 'STUDENT' 
                  ? 'bg-white text-zinc-900 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
              onClick={() => setUserType('STUDENT')}
            >
              Student
            </button>
            <button 
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                userType === 'TEACHER' 
                  ? 'bg-white text-zinc-900 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
              onClick={() => setUserType('TEACHER')}
            >
              Teacher
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            <AnimatePresence mode="popLayout">
              {tab === 'signup' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Nguyen Van A" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all placeholder:text-zinc-400" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900">Username</label>
                    <input 
                      type="text" 
                      placeholder="e.g. nguyenvan_a" 
                      value={mssv}
                      onChange={e => setMssv(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all placeholder:text-zinc-400" 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900">Email address</label>
              <input 
                type="email" 
                placeholder="student@university.edu" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all placeholder:text-zinc-400" 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-900">Password</label>
                {tab === 'signin' && (
                  <button className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                    Forgot password?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all placeholder:text-zinc-400" 
              />
            </div>

            <button 
              onClick={handleAuth}
              className="w-full py-3.5 mt-2 bg-zinc-900 text-white rounded-xl font-medium text-sm hover:bg-zinc-800 transition-colors active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 focus:ring-offset-zinc-50"
            >
              {tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-zinc-500">
              {tab === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
                className="font-medium text-zinc-900 hover:underline focus:outline-none"
              >
                {tab === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}


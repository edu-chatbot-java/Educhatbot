import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Mail, Lock, User, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AuthPage({ onLogin }) {
  const [userType, setUserType] = useState('STUDENT');
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mssv, setMssv] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    setError('');
    setSuccess('');
    
    if (!email) {
      setError('Vui lòng nhập Email.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email không đúng định dạng.');
      return false;
    }

    if (!password) {
      setError('Vui lòng nhập Mật khẩu.');
      return false;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return false;
    }

    if (tab === 'signup') {
      if (!fullName) {
        setError('Vui lòng nhập Họ và tên.');
        return false;
      }
      if (!mssv) {
        setError('Vui lòng nhập Tên đăng nhập.');
        return false;
      }
    }
    return true;
  };

  const handleAuth = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (tab === 'signin') {
        const response = await authService.login({ email, password });
        if (!response) {
          throw new Error('Sai tài khoản hoặc mật khẩu.');
        }
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
        const response = await authService.register({ 
          email, 
          password, 
          username: mssv, 
          fullName: fullName || mssv 
        });
        
        if (response && response.success === false) {
          throw new Error(response.message || 'Đăng ký thất bại.');
        }

        setSuccess('Đăng ký tài khoản thành công! Vui lòng chuyển sang Tab Đăng nhập.');
        setTab('signin');
      }
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-background relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl -z-10 animate-pulse delay-1000"></div>

      <div className="w-full max-w-md bg-card/65 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
        
        {/* Top-level User Type Toggle */}
        <div className="flex p-1.5 bg-muted/40 border-b border-border/30">
          <button 
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${userType === 'STUDENT' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10 scale-100' : 'text-muted-foreground hover:bg-muted/50'}`}
            onClick={() => {
              setUserType('STUDENT');
              setError('');
              setSuccess('');
            }}
          >
            👨‍🎓 Sinh viên
          </button>
          <button 
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${userType === 'TEACHER' ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10 scale-100' : 'text-muted-foreground hover:bg-muted/50'}`}
            onClick={() => {
              setUserType('TEACHER');
              setError('');
              setSuccess('');
            }}
          >
            👨‍🏫 Giảng viên
          </button>
        </div>

        {/* Sub-level Login/Signup Toggle */}
        <div className="flex border-b border-border/40">
          <button 
            className={`flex-1 py-4 text-center font-semibold transition-all duration-200 ${tab === 'signin' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted/30'}`}
            onClick={() => {
              setTab('signin');
              setError('');
              setSuccess('');
            }}
          >
            Đăng nhập
          </button>
          <button 
            className={`flex-1 py-4 text-center font-semibold transition-all duration-200 ${tab === 'signup' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted/30'}`}
            onClick={() => {
              setTab('signup');
              setError('');
              setSuccess('');
            }}
          >
            Đăng ký
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-black bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              {userType === 'STUDENT' ? 'Cổng Sinh viên' : 'Cổng Giảng viên'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1.5">
              {tab === 'signin' ? 'Vui lòng nhập tài khoản để vào hệ thống' : 'Tạo tài khoản để gửi yêu cầu và thảo luận'}
            </p>
          </div>

          {/* Inline Alert Messages */}
          {error && (
            <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-semibold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 animate-bounce" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {tab === 'signup' && (
            <>
              <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
                <label className="text-xs font-bold text-foreground/80">Họ và tên</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <User size={16} />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Nguyễn Văn A" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-background/50 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all duration-200" 
                  />
                </div>
              </div>
              <div className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
                <label className="text-xs font-bold text-foreground/80">Tên đăng nhập</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <KeyRound size={16} />
                  </span>
                  <input 
                    type="text" 
                    placeholder="VD: nguyenvan_a" 
                    value={mssv}
                    onChange={e => setMssv(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-background/50 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all duration-200" 
                  />
                </div>
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground/80">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Mail size={16} />
              </span>
              <input 
                type="email" 
                placeholder="student@ut.edu.vn" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-background/50 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all duration-200" 
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground/80">Mật khẩu</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Lock size={16} />
              </span>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-background/50 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all duration-200" 
              />
            </div>
          </div>

          <button 
            onClick={handleAuth}
            disabled={isLoading}
            className={`w-full py-3 mt-5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
            ) : tab === 'signin' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </div>
      </div>
    </div>
  );
}

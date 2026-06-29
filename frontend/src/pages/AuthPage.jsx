import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

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
    <div className="flex-1 flex items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Top-level User Type Toggle */}
        <div className="flex p-1 bg-muted/30">
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${userType === 'STUDENT' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
            onClick={() => setUserType('STUDENT')}
          >
            👨‍🎓 Sinh viên
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${userType === 'TEACHER' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
            onClick={() => setUserType('TEACHER')}
          >
            👨‍🏫 Giảng viên
          </button>
        </div>

        {/* Sub-level Login/Signup Toggle */}
        <div className="flex border-b border-border">
          <button 
            className={`flex-1 py-4 text-center font-medium transition-colors ${tab === 'signin' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
            onClick={() => setTab('signin')}
          >
            Đăng nhập
          </button>
          <button 
            className={`flex-1 py-4 text-center font-medium transition-colors ${tab === 'signup' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
            onClick={() => setTab('signup')}
          >
            Đăng ký
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">
              {userType === 'STUDENT' ? 'Cổng thông tin Sinh viên' : 'Cổng thông tin Giảng viên'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {tab === 'signin' ? 'Vui lòng đăng nhập để tiếp tục' : 'Tạo tài khoản mới để tham gia'}
            </p>
          </div>

          {tab === 'signup' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Họ và tên</label>
                <input 
                  type="text" 
                  placeholder="Nguyễn Văn A" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tên đăng nhập</label>
                <input 
                  type="text" 
                  placeholder="VD: nguyenvan_a" 
                  value={mssv}
                  onChange={e => setMssv(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input 
              type="email" 
              placeholder="student@ut.edu.vn" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Mật khẩu</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
            />
          </div>
          

          <button 
            onClick={handleAuth}
            className="w-full py-2.5 mt-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            {tab === 'signin' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </div>
      </div>
    </div>
  );
}

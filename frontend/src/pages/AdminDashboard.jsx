import React, { useState, useEffect } from 'react';
import { 
  Settings, Users, Search, 
  FileText, Monitor, Star, Play, Shield
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminService } from '../services/admin.service';

export default function AdminDashboard() {
  // --- STATE ---
  const [stats, setStats] = useState({ avgLatency: 0, rating: 0, totalChats: 0 });
  const [latencyData, setLatencyData] = useState([]);
  const [winRateData, setWinRateData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA ---
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Gọi API thống kê tổng quan và biểu đồ
      const statsRes = await adminService.getDashboardStats(); 
      if (statsRes && statsRes.data) {
        setStats({
          avgLatency: statsRes.data.avgLatency || 125, // Fallback số liệu nếu Backend chưa có
          rating: statsRes.data.rating || 4.7,
          totalChats: statsRes.data.totalChats || 14205
        });
        setLatencyData(statsRes.data.latencyHistory || []);
        setWinRateData(statsRes.data.winRateHistory || []);
      }

      // 2. Gọi API danh sách người dùng (API mới bổ sung trong SR2)
      const usersRes = await adminService.getUsers();
      // Xử lý an toàn: Backend Spring Boot thường bọc mảng trong data.content (phân trang) hoặc trả thẳng mảng
      const usersList = usersRes.data?.content || usersRes.data || [];
      setUsers(usersList);

    } catch (err) {
      console.error("Lỗi khi tải dữ liệu Dashboard:", err);
      // Fallback mock data tạm thời để giao diện không bị trắng nếu API lỗi
      setLatencyData([
        { name: 'Q1', rag: 120, ft: 45 }, { name: 'Q2', rag: 150, ft: 50 },
      ]);
      setWinRateData([
        { name: 'JAVA_OOP', rag: 65, ft: 35 }, { name: 'DSA', rag: 40, ft: 60 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await adminService.exportJsonl();
      
      // Logic xử lý tải file Blob từ Browser
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'training_data.jsonl');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert("Xuất dữ liệu thành công!");
    } catch (err) {
      alert("Xuất dữ liệu thất bại! Vui lòng kiểm tra lại mạng hoặc phân quyền.");
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-muted/10 overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Quản lý người dùng và theo dõi hiệu suất AI</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-md shadow-sm text-sm font-medium hover:bg-muted transition-colors">
            <Settings size={16} /> Cài đặt hệ thống
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-primary">
              <Monitor size={20} />
              <p className="text-sm font-medium text-muted-foreground">Độ trễ trung bình (RAG)</p>
            </div>
            <h3 className="text-2xl font-bold mt-1">
              {loading ? "..." : `${stats.avgLatency}ms`}
            </h3>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-yellow-500">
              <Star size={20} />
              <p className="text-sm font-medium text-muted-foreground">Tỉ lệ hài lòng (Rating)</p>
            </div>
            <h3 className="text-2xl font-bold mt-1">
              {loading ? "..." : `${stats.rating} / 5.0`}
            </h3>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-2 text-blue-500">
              <Users size={20} />
              <p className="text-sm font-medium text-muted-foreground">Tổng lượt tương tác</p>
            </div>
            <h3 className="text-2xl font-bold mt-1">
              {loading ? "..." : stats.totalChats.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <Play size={18} className="text-primary" /> Latency: RAG vs Fine-tuning
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="rag" name="RAG (ms)" stroke="hsl(var(--primary))" strokeWidth={3} />
                  <Line type="monotone" dataKey="ft" name="Fine-tuning (ms)" stroke="hsl(var(--destructive))" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4 text-sm">Tỉ lệ thắng (Win-rate Blind Test)</h3>
            <div className="h-48 mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={winRateData} layout="vertical">
                  <YAxis dataKey="name" type="category" fontSize={12} width={80} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="rag" name="RAG (%)" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="ft" name="Fine-tuning (%)" stackId="a" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data Table - Quản lý User */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield size={18} className="text-primary" /> Quản lý Người Dùng Hệ Thống
            </h3>
            <div className="flex gap-3">
              <div className="relative hidden md:block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Tìm người dùng..." className="pl-9 pr-4 py-1.5 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <button onClick={handleExport} className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors">
                <FileText size={16} /> Xuất .jsonl
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium">Họ & Tên</th>
                  <th className="px-6 py-3 font-medium">Username</th>
                  <th className="px-6 py-3 font-medium">Vai trò (Role)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-muted-foreground animate-pulse">
                      Đang tải dữ liệu người dùng...
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 text-muted-foreground">#{user.id}</td>
                      <td className="px-6 py-4 font-medium">{user.fullName || 'Chưa cập nhật'}</td>
                      <td className="px-6 py-4">{user.username}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === 'ROLE_ADMIN' ? 'bg-destructive/10 text-destructive' : 
                          user.role === 'ROLE_TEACHER' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {user.role?.replace('ROLE_', '')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-muted-foreground">
                      Không có dữ liệu người dùng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
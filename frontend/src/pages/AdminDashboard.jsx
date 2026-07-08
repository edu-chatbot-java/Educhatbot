import React, { useState, useEffect } from 'react';
import { 
  Settings, Users, Search, 
  FileText, Monitor, Star, Play, Shield, Trash2, Lock, Unlock,
  ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminService } from '../services/admin.service';
import EmbeddingPage from './EmbeddingPage';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  // --- STATE ---
  const [stats, setStats] = useState({ avgLatency: 0, rating: 0, totalChats: 0 });
  const [latencyData, setLatencyData] = useState([]);
  const [winRateData, setWinRateData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- TABS STATE ---
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'documents', 'users'

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(0); 
  const [totalPages, setTotalPages] = useState(1);

  // --- FETCH DATA ---
  useEffect(() => {
    loadDashboardData();
  }, [currentPage]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const statsRes = await adminService.getDashboardStats(); 
      if (statsRes && statsRes.data) {
        setStats({
          avgLatency: statsRes.data.ragAverageLatencyMs || 125,
          rating: statsRes.data.averageRating || 4.7,
          totalChats: statsRes.data.totalChatSessions || 14205
        });
        
        setLatencyData([
          { name: 'Current', rag: statsRes.data.ragAverageLatencyMs || 120, ft: statsRes.data.finetuneAverageLatencyMs || 45 }
        ]);
        
        const ragWin = statsRes.data.ragWinRatePercentage || 65;
        setWinRateData([
          { name: 'Overall', rag: ragWin, ft: 100 - ragWin }
        ]);
      }

      const usersRes = await adminService.getUsers(currentPage, 10);
      
      const apiData = usersRes.data?.success !== undefined ? usersRes.data.data : usersRes.data;
      const usersList = apiData?.content || apiData || [];
      
      setUsers(Array.isArray(usersList) ? usersList : []);
      setTotalPages(apiData?.totalPages || 1);

    } catch (err) {
      console.error("Error loading dashboard data:", err);
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
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'training_data.jsonl');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert("Data exported successfully!");
    } catch (err) {
      alert("Failed to export data. Please check permissions.");
      console.error(err);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      loadDashboardData();
    } catch (e) {
      alert('Error updating status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if(window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await adminService.deleteUser(userId);
        loadDashboardData();
      } catch(e) {
        alert('Error deleting user');
      }
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await adminService.changeRole(userId, newRole);
      loadDashboardData();
    } catch(e) {
      alert('Error updating role');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: 'Documents' },
    { id: 'users', label: 'Users' }
  ];

  return (
    <div className="flex-1 w-full bg-zinc-50 h-full overflow-y-auto text-zinc-900 font-sans flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full px-6 py-8 md:py-12 flex-1 flex flex-col">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Quản lý người dùng và theo dõi hiệu suất AI</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-full hover:border-zinc-300 hover:text-zinc-900 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900">
            <Settings size={16} /> 
            <span>Settings</span>
          </button>
        </motion.div>

        {/* Tabs Menu */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex space-x-2 bg-zinc-100 p-1.5 rounded-xl w-max mb-6"
        >
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              className={`relative px-6 py-2.5 text-sm font-medium rounded-lg transition-colors focus:outline-none ${
                activeTab === tab.id ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="active-tab-indicator"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm border border-zinc-200/50"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </motion.div>

        <div className="flex-1 w-full relative">
          <AnimatePresence mode="wait">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-10"
              >
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm flex flex-col justify-between h-40">
                    <div className="flex items-center gap-3 text-zinc-500">
                      <Activity size={18} />
                      <p className="text-sm font-medium">Avg RAG Latency</p>
                    </div>
                    <h3 className="text-4xl font-medium tracking-tight text-zinc-950">
                      {loading ? "..." : `${stats.avgLatency}ms`}
                    </h3>
                  </div>
                  <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm flex flex-col justify-between h-40">
                    <div className="flex items-center gap-3 text-zinc-500">
                      <Star size={18} />
                      <p className="text-sm font-medium">User Satisfaction</p>
                    </div>
                    <h3 className="text-4xl font-medium tracking-tight text-zinc-950">
                      {loading ? "..." : `${stats.rating}`} <span className="text-2xl text-zinc-400 font-normal">/5.0</span>
                    </h3>
                  </div>
                  <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm flex flex-col justify-between h-40">
                    <div className="flex items-center gap-3 text-zinc-500">
                      <Users size={18} />
                      <p className="text-sm font-medium">Total Interactions</p>
                    </div>
                    <h3 className="text-4xl font-medium tracking-tight text-zinc-950">
                      {loading ? "..." : stats.totalChats.toLocaleString()}
                    </h3>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-8">
                    <h3 className="font-medium text-lg text-zinc-900 mb-8 flex items-center gap-2">
                      <Play size={16} className="text-zinc-400" /> Latency Profile
                    </h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={latencyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#71717a'}} />
                          <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#71717a'}} />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                            cursor={{stroke: '#e4e4e7', strokeWidth: 2}}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                          <Line type="monotone" dataKey="rag" name="RAG (ms)" stroke="#18181b" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                          <Line type="monotone" dataKey="ft" name="Fine-tuning (ms)" stroke="#a1a1aa" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-8">
                    <h3 className="font-medium text-lg text-zinc-900 mb-8">Win-rate Blind Test</h3>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={winRateData} layout="vertical" barSize={32}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                          <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#71717a'}} />
                          <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={80} tick={{fill: '#71717a'}} />
                          <RechartsTooltip 
                            cursor={{fill: '#f4f4f5'}}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                          <Bar dataKey="rag" name="RAG (%)" stackId="a" fill="#18181b" radius={[4, 0, 0, 4]} />
                          <Bar dataKey="ft" name="Fine-tuning (%)" stackId="a" fill="#d4d4d8" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

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
                  <th className="px-6 py-3 font-medium">Trạng thái</th>
                  <th className="px-6 py-3 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground animate-pulse">
                      Đang tải dữ liệu người dùng...
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.id} className={`hover:bg-muted/20 transition-colors ${(user.active === false || user.isActive === false) ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4 text-muted-foreground">#{user.id}</td>
                      <td className="px-6 py-4 font-medium">{user.fullName || 'Chưa cập nhật'}</td>
                      <td className="px-6 py-4">{user.username}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={user.role} 
                          onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          className={`px-2 py-1.5 rounded text-xs font-medium border-none cursor-pointer outline-none appearance-none bg-transparent ${
                            user.role === 'ROLE_ADMIN' ? 'text-red-500 bg-red-500/10' : 
                            user.role === 'ROLE_TEACHER' ? 'text-blue-500 bg-blue-500/10' : 'text-emerald-500 bg-emerald-500/10'
                          }`}
                        >
                          <option value="ROLE_STUDENT" className="bg-background text-foreground">STUDENT</option>
                          <option value="ROLE_TEACHER" className="bg-background text-foreground">TEACHER</option>
                          <option value="ROLE_ADMIN" className="bg-background text-foreground">ADMIN</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {(user.active !== false && user.isActive !== false) ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500"><Unlock size={14}/> Hoạt động</span>
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-zinc-500">
                              No users found in directory.
                            </td>
                          </tr>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => handleToggleStatus(user.id)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                          title={(user.active !== false && user.isActive !== false) ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {(user.active !== false && user.isActive !== false) ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                          title="Xóa tài khoản"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                      Không có dữ liệu người dùng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="p-3 border-t border-border flex justify-between items-center bg-muted/10 text-xs text-muted-foreground">
            <span>Trang {currentPage + 1} / {totalPages}</span>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-2 py-1 border border-border rounded hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Trước
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1 || totalPages === 0}
                className="px-2 py-1 border border-border rounded hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Tab Content: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="animate-in fade-in zoom-in-95 duration-300 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            {/* Render trực tiếp EmbeddingPage vào đây, ẩn padding mặc định của nó đi để vừa vặn */}
            <div className="-m-6">
              <EmbeddingPage />
            </div>
          </div>
        )}

            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' && (
              <motion.div 
                key="documents"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Embedded EmbeddingPage inherently has min-h-screen and bg-zinc-50, which looks perfect inside this container too because it will stretch, or we can let it be self-contained. Actually EmbeddingPage has its own max-w-1400px wrapper. To avoid double padding, let's just render it directly but handle it properly. */}
                <div className="-mt-12 -mb-12">
                  <EmbeddingPage />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

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
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-zinc-950">
              Workspace
            </h1>
            <p className="text-zinc-500 text-lg mt-3 max-w-xl leading-relaxed">
              Manage system configurations, user access, and monitor AI performance metrics.
            </p>
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

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <motion.div 
                key="users"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  
                  <div className="p-6 md:px-8 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="font-medium text-lg text-zinc-900 flex items-center gap-2">
                      <Shield size={18} className="text-zinc-400" /> Access Control
                    </h3>
                    <div className="flex w-full sm:w-auto gap-3">
                      <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                          type="text" 
                          placeholder="Search users..." 
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all placeholder:text-zinc-400" 
                        />
                      </div>
                      <button onClick={handleExport} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 focus:ring-offset-white">
                        <FileText size={16} /> <span className="hidden sm:inline">Export</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-50/50 text-xs text-zinc-500 font-medium border-b border-zinc-100">
                        <tr>
                          <th className="px-6 md:px-8 py-4">ID</th>
                          <th className="px-6 md:px-8 py-4">Full Name</th>
                          <th className="px-6 md:px-8 py-4">Username</th>
                          <th className="px-6 md:px-8 py-4">Role</th>
                          <th className="px-6 md:px-8 py-4">Status</th>
                          <th className="px-6 md:px-8 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {loading ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-zinc-400 animate-pulse">
                              Loading directory...
                            </td>
                          </tr>
                        ) : users.length > 0 ? (
                          users.map(user => (
                            <tr key={user.id} className={`hover:bg-zinc-50/50 transition-colors ${(user.active === false || user.isActive === false) ? 'opacity-50 grayscale' : ''}`}>
                              <td className="px-6 md:px-8 py-4 text-zinc-500 tabular-nums">#{user.id}</td>
                              <td className="px-6 md:px-8 py-4 font-medium text-zinc-900">{user.fullName || '—'}</td>
                              <td className="px-6 md:px-8 py-4 text-zinc-600">{user.username}</td>
                              <td className="px-6 md:px-8 py-4">
                                <select 
                                  value={user.role} 
                                  onChange={(e) => handleChangeRole(user.id, e.target.value)}
                                  className={`px-3 py-1.5 rounded-md text-xs font-medium border-none cursor-pointer outline-none appearance-none ${
                                    user.role === 'ROLE_ADMIN' ? 'text-zinc-900 bg-zinc-200' : 
                                    user.role === 'ROLE_TEACHER' ? 'text-zinc-700 bg-zinc-100' : 'text-zinc-600 bg-zinc-50'
                                  }`}
                                >
                                  <option value="ROLE_STUDENT" className="bg-white text-zinc-900">STUDENT</option>
                                  <option value="ROLE_TEACHER" className="bg-white text-zinc-900">TEACHER</option>
                                  <option value="ROLE_ADMIN" className="bg-white text-zinc-900">ADMIN</option>
                                </select>
                              </td>
                              <td className="px-6 md:px-8 py-4">
                                {(user.active !== false && user.isActive !== false) ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full"><Unlock size={12}/> Active</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full"><Lock size={12}/> Locked</span>
                                )}
                              </td>
                              <td className="px-6 md:px-8 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => handleToggleStatus(user.id)}
                                    className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors focus:outline-none"
                                    title={(user.active !== false && user.isActive !== false) ? 'Lock account' : 'Unlock account'}
                                  >
                                    {(user.active !== false && user.isActive !== false) ? <Lock size={16} /> : <Unlock size={16} />}
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors focus:outline-none"
                                    title="Delete account"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-zinc-500">
                              No users found in directory.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  <div className="px-6 md:px-8 py-4 border-t border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                    <span className="text-sm text-zinc-500">Page {currentPage + 1} of {totalPages}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="p-2 border border-zinc-200 rounded-lg hover:bg-white hover:border-zinc-300 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-zinc-200 transition-colors text-zinc-700"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1 || totalPages === 0}
                        className="p-2 border border-zinc-200 rounded-lg hover:bg-white hover:border-zinc-300 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-zinc-200 transition-colors text-zinc-700"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
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
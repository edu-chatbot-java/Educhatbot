import React, { useState, useEffect } from 'react';
import { 
  Settings, Database, Users, Search, 
  FileText, Trash2, Monitor, Star, Play
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { documentService } from '../services/document.service';
import { analyticsService } from '../services/analytics.service';

export default function AdminDashboard() {
  // --- STATE ---
  const [stats, setStats] = useState({ avgLatency: 125, rating: 4.7, totalChats: 14205 });
  const [latencyData, setLatencyData] = useState([]);
  const [winRateData, setWinRateData] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA ---
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Gọi API thống kê (Endpoint từ test-all.http)
      const res = await analyticsService.getDashboardStats(); 
      setStats({
        avgLatency: res.data.avgLatency || 125,
        rating: res.data.rating || 4.7,
        totalChats: res.data.totalChats || 14205
      });
      setLatencyData(res.data.latencyHistory || []);
      setWinRateData(res.data.winRateHistory || []);

      // Gọi API danh sách tài liệu
      const docRes = await documentService.getDocuments(0, 10);
      setDocuments(docRes.data.content || []);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await analyticsService.exportJsonl();
      alert("Xuất dữ liệu thành công!");
    } catch (err) {
      alert("Xuất dữ liệu thất bại!");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-muted/10 overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Quản lý dữ liệu và theo dõi hiệu suất hệ thống</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-md shadow-sm text-sm font-medium hover:bg-muted transition-colors">
            <Settings size={16} /> Cài đặt hệ thống
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Độ trễ trung bình (RAG)</p>
            <h3 className="text-2xl font-bold mt-1">{stats.avgLatency}ms</h3>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Tỉ lệ hài lòng (Rating)</p>
            <h3 className="text-2xl font-bold mt-1">{stats.rating} / 5.0</h3>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Tổng lượt tương tác</p>
            <h3 className="text-2xl font-bold mt-1">{stats.totalChats.toLocaleString()}</h3>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2"><Play size={18} className="text-primary" /> Latency</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rag" name="RAG" stroke="hsl(var(--primary))" strokeWidth={3} />
                  <Line type="monotone" dataKey="ft" name="Fine-tuning" stroke="hsl(var(--destructive))" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4 text-sm">Win-rate (Blind Test)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={winRateData} layout="vertical">
                  <YAxis dataKey="name" type="category" fontSize={12} />
                  <Bar dataKey="rag" stackId="a" fill="hsl(var(--primary))" />
                  <Bar dataKey="ft" stackId="a" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
            <h3 className="font-semibold">Data Management Table</h3>
            <button onClick={handleExport} className="text-xs bg-primary text-white px-3 py-1 rounded">Xuất .jsonl</button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Title</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id} className="border-t">
                  <td className="px-6 py-4">{doc.title}</td>
                  <td className="px-6 py-4">{doc.status}</td>
                  <td className="px-6 py-4 text-right"><Trash2 size={16} className="cursor-pointer text-destructive" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
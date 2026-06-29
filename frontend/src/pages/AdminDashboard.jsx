import React, { useState } from 'react';
import { 
  Settings, Database, Users, Search, 
  FileText, UploadCloud, Trash2, Monitor, Star, Play
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { documentService } from '../services/document.service';
import { analyticsService } from '../services/analytics.service';

const mockLatencyData = [
  { name: 'Q1', rag: 120, ft: 45 },
  { name: 'Q2', rag: 150, ft: 50 },
  { name: 'Q3', rag: 110, ft: 40 },
  { name: 'Q4', rag: 180, ft: 55 },
  { name: 'Q5', rag: 140, ft: 48 },
];

const mockWinRateData = [
  { name: 'JAVA_OOP', rag: 65, ft: 35 },
  { name: 'DSA', rag: 40, ft: 60 },
  { name: 'CSHARP_BASIC', rag: 55, ft: 45 },
];

export default function AdminDashboard() {
  return (
    <div className="flex-1 flex flex-col bg-muted/10 overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto w-full space-y-8">
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
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 text-primary rounded-lg"><Monitor size={20} /></div>
              <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+12%</span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Độ trễ trung bình (RAG)</p>
              <h3 className="text-2xl font-bold mt-1">125ms</h3>
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><Star size={20} /></div>
              <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+4.2%</span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tỉ lệ hài lòng (Rating)</p>
              <h3 className="text-2xl font-bold mt-1">4.7 / 5.0</h3>
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Users size={20} /></div>
              <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+18%</span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tổng lượt tương tác</p>
              <h3 className="text-2xl font-bold mt-1">14,205</h3>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-6 flex items-center gap-2"><Play size={18} className="text-primary" /> So sánh thời gian phản hồi (Latency)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockLatencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="rag" name="RAG Mode (ms)" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="ft" name="Fine-tuning (ms)" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h3 className="font-semibold mb-4 text-sm">Tỉ lệ thắng (Win-rate từ Blind Test)</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockWinRateData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} hide />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} />
                      <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <Bar dataKey="rag" name="RAG" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="ft" name="Fine-tuning" stackId="a" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
                <h3 className="font-semibold mb-2 text-sm flex items-center gap-2"><Database size={16} /> Kết xuất dữ liệu huấn luyện</h3>
                <p className="text-xs text-muted-foreground mb-4">Trích xuất các cặp hội thoại đạt 5 sao để làm tập dữ liệu huấn luyện mới.</p>
                <button 
                  onClick={analyticsService.exportJsonl}
                  className="w-full py-2 bg-secondary text-secondary-foreground border border-border rounded-md font-medium text-sm hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={16} /> Xuất file .jsonl
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
            <h3 className="font-semibold">Data Management Table</h3>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Tìm kiếm tài liệu..." className="pl-9 pr-4 py-1.5 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Subject</th>
                  <th className="px-6 py-3 font-medium">Type / Size</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                    <FileText size={16} className="text-blue-400" /> Java_OOP_Concepts_Ch1.pdf
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-secondary rounded text-xs font-medium">JAVA_OOP</span></td>
                  <td className="px-6 py-4 text-muted-foreground">PDF • 2.4 MB</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-medium">Ready</span></td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-2">
                    <FileText size={16} className="text-gray-400" /> dsa_algorithms_cheatsheet.txt
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-secondary rounded text-xs font-medium">DSA</span></td>
                  <td className="px-6 py-4 text-muted-foreground">TXT • 150 KB</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-xs font-medium animate-pulse">Processing</span></td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-border flex justify-between items-center bg-muted/10 text-xs text-muted-foreground">
            <span>Hiển thị 1-2 trên tổng số 24 tài liệu</span>
            <div className="flex gap-1">
              <button className="px-2 py-1 border border-border rounded hover:bg-muted disabled:opacity-50">Trước</button>
              <button className="px-2 py-1 border border-border rounded hover:bg-muted">Sau</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

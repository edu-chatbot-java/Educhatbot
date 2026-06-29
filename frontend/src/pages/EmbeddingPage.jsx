import React, { useState } from 'react';
import { Database, UploadCloud } from 'lucide-react';
import { documentService } from '../services/document.service';

export default function EmbeddingPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    // documentService.uploadDocument(...) giả lập progress
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsUploading(false), 500);
          return 100;
        }
        return p + 5;
      });
    }, 300);
  };

  return (
    <div className="flex-1 flex flex-col bg-muted/10 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Embedding & Vectorization (TV3)</h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý việc nhúng dữ liệu vào Qdrant</p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2">
              <Database size={18} className="text-primary" /> Document Upload Center
            </h3>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Gắn môn học (Subject Assignment) <span className="text-destructive">*</span>
                </label>
                <select className="w-full p-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                  <option value="">-- Chọn môn học --</option>
                  <option value="JAVA_OOP">JAVA_OOP</option>
                  <option value="DSA">DSA</option>
                </select>
              </div>
              
              <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={24} />
                </div>
                <p className="text-sm font-medium mb-1">Kéo thả file vào đây hoặc click để chọn</p>
                <p className="text-xs text-muted-foreground">Hỗ trợ định dạng .pdf, .txt (Tối đa 10MB)</p>
              </div>
              
              {isUploading ? (
                <div className="space-y-2 mt-4 animate-in fade-in">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Đang xử lý Embeddings...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center animate-pulse">
                    Vui lòng không đóng trình duyệt trong quá trình đồng bộ (5-15s)
                  </p>
                </div>
              ) : (
                <button 
                  onClick={handleUpload} 
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-md font-medium text-sm mt-4 hover:bg-primary/90 transition-colors"
                >
                  Tải lên & Nhúng Vector
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

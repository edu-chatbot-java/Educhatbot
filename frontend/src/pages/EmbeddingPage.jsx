import React, { useState, useEffect, useRef } from 'react';
import { Database, UploadCloud, FileText, CheckCircle, Plus, X, Save, RefreshCw } from 'lucide-react';
import { documentService } from '../services/document.service';

export default function EmbeddingPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Subject Management
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');
  
  // Document Management State
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const fileInputRef = useRef(null);

  // Helper to load subjects
  const loadSubjects = async () => {
    try {
      const data = await documentService.getSubjects();
      if (data && data.length > 0) {
        setSubjects(data);
        const exists = data.some(s => s.code === selectedSubjectCode);
        if (!exists) {
          setSelectedSubjectCode(data[0].code);
          fetchDocuments(data[0].id);
        } else {
          const currentSubject = data.find(s => s.code === selectedSubjectCode);
          fetchDocuments(currentSubject.id);
        }
      }
    } catch (err) {
      console.error("Error loading subjects:", err);
    }
  };

  // Helper to load documents
  const fetchDocuments = async (subjectId) => {
    try {
      const res = await documentService.getDocuments(subjectId);
      if (res && res.content) {
        setDocuments(res.content);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      setDocuments([]);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleSubjectChange = (code) => {
    setSelectedSubjectCode(code);
    const subj = subjects.find(s => s.code === code);
    if (subj && subj.id) {
      fetchDocuments(subj.id);
    } else {
      setDocuments([]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setDocumentTitle(fileNameWithoutExt);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này không?')) {
      return;
    }
    try {
      await documentService.deleteDocument(id);
      const currentSubject = subjects.find(s => s.code === selectedSubjectCode);
      if (currentSubject && currentSubject.id) {
        fetchDocuments(currentSubject.id);
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      alert('Có lỗi xảy ra khi xóa tài liệu!');
    }
  };

  const handleReprocess = async (id) => {
    try {
      await documentService.reprocessDocument(id);
      alert('Đã gửi yêu cầu xử lý lại tài liệu vào hàng đợi!');
      const currentSubject = subjects.find(s => s.code === selectedSubjectCode);
      if (currentSubject && currentSubject.id) {
        fetchDocuments(currentSubject.id);
      }
    } catch (err) {
      console.error("Error reprocessing document:", err);
      alert('Có lỗi xảy ra khi yêu cầu xử lý lại!');
    }
  };

  const getFileSizeFormatted = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const currentSubject = subjects.find(s => s.code === selectedSubjectCode);

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Vui lòng chọn tài liệu để tải lên!');
      return;
    }
    if (!documentTitle.trim()) {
      alert('Vui lòng nhập tiêu đề tài liệu!');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      const currentSubject = subjects.find(s => s.code === selectedSubjectCode);
      if (!currentSubject || !currentSubject.id) {
        alert('Môn học không hợp lệ!');
        setIsUploading(false);
        return;
      }

      // Call real backend upload API
      const result = await documentService.uploadDocument(
        selectedFile,
        documentTitle.trim(),
        currentSubject.id,
        'Admin' // Default uploadedBy for admin
      );

      if (!result || !result.documentId) {
        throw new Error('Máy chủ không trả về ID tài liệu hợp lệ!');
      }

      const documentId = result.documentId;
      let progress = 20;
      setUploadProgress(progress);

      // Poll status endpoint
      const pollInterval = setInterval(async () => {
        try {
          const statusData = await documentService.getDocumentStatus(documentId);
          const currentStatus = statusData.status;

          if (currentStatus === 'READY') {
            clearInterval(pollInterval);
            setUploadProgress(100);
            setTimeout(() => {
              setIsUploading(false);
              setSelectedFile(null);
              setDocumentTitle('');
              fetchDocuments(currentSubject.id);
            }, 500);
          } else if (currentStatus === 'ERROR') {
            clearInterval(pollInterval);
            setIsUploading(false);
            alert('Lỗi: Hệ thống không thể xử lý tài liệu này!');
            fetchDocuments(currentSubject.id);
          } else {
            progress = Math.min(95, progress + 10);
            setUploadProgress(progress);
          }
        } catch (err) {
          console.error("Error polling document status:", err);
        }
      }, 1500);

      setTimeout(() => {
        clearInterval(pollInterval);
        setIsUploading(false);
        fetchDocuments(currentSubject.id);
      }, 45000);

    } catch (error) {
      console.error("Upload error:", error);
      alert(`Lỗi khi tải lên: ${error.message || error}`);
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-muted/10 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Embedding Center (Admin)</h1>
            <p className="text-muted-foreground text-sm mt-1">Quản lý kho tài liệu chung và quá trình nhúng dữ liệu vào Qdrant</p>
          </div>
          <button 
            onClick={() => currentSubject && fetchDocuments(currentSubject.id)} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border hover:bg-muted text-xs font-medium rounded-lg shadow-sm transition-colors"
          >
            <RefreshCw size={14} /> Làm mới danh sách
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cột trái: Upload */}
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
                <select 
                  value={selectedSubjectCode}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full p-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  {subjects.length > 0 ? (
                    subjects.map(subj => (
                      <option key={subj.code} value={subj.code}>
                        [{subj.code}] {subj.name}
                      </option>
                    ))
                  ) : (
                    <option value="">-- Không có môn học --</option>
                  )}
                </select>
              </div>
              
              <div 
                onClick={() => !isUploading && fileInputRef.current.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                  accept=".pdf,.txt"
                  disabled={isUploading}
                />
                
                {selectedFile ? (
                  <div className="space-y-1">
                    <FileText size={32} className="text-primary mx-auto mb-2" />
                    <p className="text-sm font-semibold truncate max-w-[220px] mx-auto">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{getFileSizeFormatted(selectedFile.size)}</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud size={24} />
                    </div>
                    <p className="text-sm font-medium mb-1">Click để chọn tài liệu tải lên</p>
                    <p className="text-xs text-muted-foreground">PDF, TXT (Tối đa 50MB)</p>
                  </>
                )}
              </div>
              
              {selectedFile && !isUploading && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <label className="text-sm font-medium">Tiêu đề hiển thị <span className="text-destructive">*</span></label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Nhập tiêu đề hiển thị" 
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      className="flex-1 p-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                    <button 
                      onClick={() => { setSelectedFile(null); setDocumentTitle(''); }}
                      className="px-3 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
              
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

          {/* Cột phải: Danh sách tài liệu */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col max-h-[600px] overflow-hidden">
            <h3 className="font-semibold mb-4 flex items-center gap-2 flex-shrink-0">
              <Database size={18} className="text-emerald-500" /> Tất cả tài liệu trong hệ thống
            </h3>
            
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {documents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Chưa có tài liệu nào trong môn học này.
                </div>
              ) : (
                documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg gap-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText size={16} className={`${
                        doc.status === 'READY' ? 'text-emerald-500' :
                        doc.status === 'PROCESSING' ? 'text-blue-500 animate-pulse' :
                        'text-destructive'
                      }`} />
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate max-w-[200px]" title={doc.title}>{doc.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Upload bởi: <span className="font-medium text-foreground">{doc.uploadedBy}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {getFileSizeFormatted(doc.fileSize)} • {doc.fileType}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {doc.status === 'PROCESSING' && (
                        <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded font-medium animate-pulse">
                          Đang xử lý
                        </span>
                      )}
                      {doc.status === 'READY' && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-medium">
                          Sẵn sàng
                        </span>
                      )}
                      {doc.status === 'ERROR' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded font-medium">Lỗi</span>
                          <button onClick={() => handleReprocess(doc.id)} className="text-[10px] text-yellow-600 hover:underline">Thử lại</button>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-[10px] mt-1 text-destructive hover:underline"
                      >
                        Xóa tài liệu
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

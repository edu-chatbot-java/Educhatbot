import React, { useState } from 'react';
import { UploadCloud, FileText, Database, CheckCircle, Plus, X, Save } from 'lucide-react';
import { documentService } from '../services/document.service';

export default function TeacherDashboard() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Subject Management State
  const [subjects, setSubjects] = useState([
    { code: 'JAVA_OOP', name: 'Lập trình Hướng đối tượng Java' },
    { code: 'DSA', name: 'Cấu trúc dữ liệu và giải thuật' },
    { code: 'CSHARP_BASIC', name: 'Lập trình C# cơ bản' }
  ]);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('JAVA_OOP');
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  const handleAddSubject = () => {
    if (!newSubjectCode.trim() || !newSubjectName.trim()) {
      alert('Vui lòng nhập đầy đủ Mã môn học và Tên môn học!');
      return;
    }
    const code = newSubjectCode.trim().toUpperCase();
    if (subjects.find(s => s.code === code)) {
      alert('Mã môn học này đã tồn tại!');
      return;
    }
    setSubjects([...subjects, { code, name: newSubjectName.trim() }]);
    setSelectedSubjectCode(code);
    setIsAddingSubject(false);
    setNewSubjectCode('');
    setNewSubjectName('');
  };

  const handleUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsUploading(false), 500);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  return (
    <div className="flex-1 flex flex-col bg-muted/10 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Giao diện dành riêng cho Giảng viên tải lên tài liệu môn học</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <UploadCloud size={18} className="text-primary" /> Tải tài liệu môn học
            </h3>
            
            <div className="space-y-4 flex-1">
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center justify-between">
                  <span>Môn học phụ trách <span className="text-destructive">*</span></span>
                  {!isAddingSubject && (
                    <button 
                      onClick={() => setIsAddingSubject(true)}
                      className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2 py-1 rounded"
                    >
                      <Plus size={14} /> Thêm môn mới
                    </button>
                  )}
                </label>

                {isAddingSubject ? (
                  <div className="bg-muted/30 p-3 rounded-lg border border-border space-y-3 animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold">Tạo môn học mới</span>
                      <button onClick={() => setIsAddingSubject(false)} className="text-muted-foreground hover:text-destructive">
                        <X size={14} />
                      </button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Mã môn (VD: JAVA_OOP)" 
                      value={newSubjectCode}
                      onChange={(e) => setNewSubjectCode(e.target.value)}
                      className="w-full p-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none uppercase"
                    />
                    <input 
                      type="text" 
                      placeholder="Tên môn học (VD: Lập trình Java)" 
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      className="w-full p-2 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                    <button 
                      onClick={handleAddSubject}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                      <Save size={16} /> Lưu môn học
                    </button>
                  </div>
                ) : (
                  <select 
                    value={selectedSubjectCode}
                    onChange={(e) => setSelectedSubjectCode(e.target.value)}
                    className="w-full p-2.5 bg-background border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    {subjects.map(subj => (
                      <option key={subj.code} value={subj.code}>
                        [{subj.code}] {subj.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <p className="text-sm font-medium mb-1">Click để tải lên Slide / Bài giảng</p>
                <p className="text-xs text-muted-foreground">PDF, TXT, DOCX (Tối đa 15MB)</p>
              </div>
              
              {isUploading ? (
                <div className="space-y-2 mt-4 animate-in fade-in">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Đang tải lên hệ thống...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleUpload} 
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-md font-medium text-sm mt-4 hover:bg-primary/90 transition-colors"
                >
                  Tải lên tài liệu
                </button>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Database size={18} className="text-emerald-500" /> Tài liệu đã duyệt
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Slide_Chuong1_JAVA.pdf</p>
                    <p className="text-xs text-muted-foreground">JAVA_OOP • 2MB</p>
                  </div>
                </div>
                <CheckCircle size={16} className="text-emerald-500" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Baitap_Thuchanh_DSA.txt</p>
                    <p className="text-xs text-muted-foreground">DSA • 450KB</p>
                  </div>
                </div>
                <CheckCircle size={16} className="text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

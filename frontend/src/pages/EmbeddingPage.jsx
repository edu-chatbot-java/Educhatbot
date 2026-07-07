import React, { useState, useEffect, useRef } from 'react';
import { Database, UploadCloud, FileText, CheckCircle, RefreshCw, Trash2, AlertCircle, ChevronDown } from 'lucide-react';
import { documentService } from '../services/document.service';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Custom Dropdown State & Ref
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        'Admin'
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
    <div className="flex-1 w-full bg-zinc-50 h-full overflow-hidden text-zinc-900 font-sans flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full px-6 py-6 md:py-8 flex flex-col flex-1 overflow-hidden">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 shrink-0"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-zinc-950">
              Data Embeddings
            </h1>
            <p className="text-zinc-500 text-sm mt-2 max-w-xl leading-relaxed">
              Upload documents, manage vector conversions, and monitor embedding status in real-time.
            </p>
          </div>
          <button
            onClick={() => currentSubject && fetchDocuments(currentSubject.id)}
            className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-full hover:border-zinc-300 hover:text-zinc-900 hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 focus:ring-offset-zinc-50"
          >
            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
            <span>Sync Index</span>
          </button>
        </motion.div>

        {/* Two Column Layout (Asymmetric) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden items-stretch">

          {/* Left Column: Upload Center (col-span-5) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col h-full overflow-hidden"
          >
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-4 md:p-5 flex flex-col h-full overflow-hidden">
              <h3 className="font-medium text-base text-zinc-900 mb-3 shrink-0 flex items-center gap-2">
                <UploadCloud size={16} className="text-zinc-400" />
                Upload Center
              </h3>

              <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                <div className="flex flex-col space-y-1.5 shrink-0 relative" ref={dropdownRef}>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Target Subject Space
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className=" flex items-center justify-between ml-1 mr-1 p-3.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 font-semibold focus:ring-2 focus:ring-zinc-900 focus:bg-white outline-none transition-all text-left shadow-sm hover:bg-zinc-100/50"
                  >
                    <span>
                      {subjects.find(s => s.code === selectedSubjectCode)
                        ? `[${selectedSubjectCode}] ${subjects.find(s => s.code === selectedSubjectCode).name}`
                        : 'Select a subject'}
                    </span>
                    <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-20 w-full top-full mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden py-1 max-h-48 overflow-y-auto"
                      >
                        {subjects.length > 0 ? (
                          subjects.map(subj => (
                            <button
                              key={subj.code}
                              type="button"
                              onClick={() => {
                                handleSubjectChange(subj.code);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs hover:bg-zinc-50 transition-colors flex flex-col gap-0.5 ${
                                selectedSubjectCode === subj.code ? 'bg-zinc-50 font-bold text-zinc-950' : 'text-zinc-600'
                              }`}
                            >
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{subj.code}</span>
                              <span className="truncate w-full">{subj.name}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-xs text-zinc-500 text-center">-- No subjects available --</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col space-y-1.5 flex-1 overflow-hidden">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Document Source
                  </label>
                  <div
                    onClick={() => !isUploading && fileInputRef.current.click()}
                    className={`
                      relative flex-1 min-h-[90px] border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-200
                      ${isUploading ? 'border-zinc-200 bg-zinc-50/50 cursor-not-allowed opacity-60' : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100/50 cursor-pointer group'}
                    `}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      accept=".pdf,.txt"
                      disabled={isUploading}
                    />

                    <AnimatePresence mode="wait">
                      {selectedFile ? (
                        <motion.div
                          key="file-selected"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="space-y-2 w-full"
                        >
                          <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center mx-auto shadow-sm">
                            <FileText size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-zinc-900 truncate max-w-[200px] mx-auto px-4">{selectedFile.name}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">{getFileSizeFormatted(selectedFile.size)}</p>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="no-file"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex flex-col items-center"
                        >
                          <div className="w-9 h-9 rounded-full bg-white border border-zinc-200 text-zinc-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                            <UploadCloud size={16} />
                          </div>
                          <p className="text-xs font-medium text-zinc-900 mb-0.5">Click to browse files</p>
                          <p className="text-[10px] text-zinc-500">Supports PDF and TXT up to 50MB</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
            <AnimatePresence>
              {selectedFile && !isUploading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Document Label <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Title for index display"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      className="flex-1 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:bg-white outline-none transition-all placeholder:text-zinc-400"
                    />
                    <button
                      onClick={() => { setSelectedFile(null); setDocumentTitle(''); }}
                      className="px-3 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-xl text-xs hover:bg-zinc-50 hover:border-zinc-300 transition-all focus:outline-none"
                    >
                      Clear
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isUploading ? (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-xs font-medium text-zinc-700">
                  <span className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin"></div>
                    Vectorizing...
                  </span>
                  <span className="tabular-nums">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={handleUpload}
                disabled={!selectedFile}
                className={`w-full py-2.5 rounded-xl font-medium text-xs mt-1 transition-all focus:outline-none flex items-center justify-center gap-2 ${
                  selectedFile
                    ? 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98] focus:ring-2 focus:ring-zinc-900'
                    : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                }`}
              >
                {selectedFile ? <><UploadCloud size={14} /> Upload & Process</> : 'Upload Document'}
              </button>
            )}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Documents List (col-span-7) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col h-full overflow-hidden"
          >
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
              <div className="p-6 md:px-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
                <h3 className="font-medium text-base text-zinc-900 flex items-center gap-2">
                  <Database size={16} className="text-zinc-400" />
                  Indexed Documents
                </h3>
                <div className="text-xs font-medium text-zinc-500 bg-white border border-zinc-200 px-2.5 py-1 rounded-full shadow-sm">
                  {documents.length} items
                </div>
              </div>

              {documents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-zinc-500">
                  <FileText size={48} className="text-zinc-300 mb-4 stroke-[1.5]" />
                  <p className="text-base font-medium text-zinc-900">Empty index</p>
                  <p className="text-sm mt-1 max-w-[200px]">No documents have been embedded in this subject space yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100 overflow-y-auto flex-1 bg-white">
                  {documents.map((doc, i) => (
                    <motion.li
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 + 0.3, duration: 0.3 }}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors group"
                    >
                      <div className="flex items-start gap-4 overflow-hidden">
                        <div className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          doc.status === 'READY' ? 'bg-emerald-50 text-emerald-600' :
                          doc.status === 'PROCESSING' ? 'bg-blue-50 text-blue-600 animate-pulse' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {doc.status === 'READY' ? <CheckCircle size={20} /> :
                           doc.status === 'PROCESSING' ? <RefreshCw size={20} className="animate-spin" /> :
                           <AlertCircle size={20} />}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-base font-medium text-zinc-900 truncate" title={doc.title}>
                            {doc.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-sm text-zinc-500">
                            <span className="flex items-center gap-1.5">
                              {getFileSizeFormatted(doc.fileSize)}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                            <span className="uppercase tracking-wider text-[10px] font-semibold">{doc.fileType}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                            <span>by {doc.uploadedBy}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 sm:gap-4 ml-14 sm:ml-0 flex-shrink-0">
                        {doc.status === 'PROCESSING' && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            Vectorizing...
                          </span>
                        )}
                        {doc.status === 'READY' && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            Active
                          </span>
                        )}
                        {doc.status === 'ERROR' && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                              Failed
                            </span>
                            <button
                              onClick={() => handleReprocess(doc.id)}
                              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:underline transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        )}

                        <div className="w-px h-6 bg-zinc-200 hidden sm:block"></div>

                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="text-zinc-400 hover:text-red-600 transition-colors focus:outline-none p-1 sm:opacity-0 sm:group-hover:opacity-100"
                          title="Delete Document"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


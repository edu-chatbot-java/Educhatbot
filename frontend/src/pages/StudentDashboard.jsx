import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Plus, Send, ThumbsUp, ThumbsDown, Star, ChevronDown,
  FileText, Monitor, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';
import { chatService } from '../services/chat.service';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';

const markdownComponents = {
  pre: ({ children }) => <>{children}</>,
  code({node, inline, className, children, ...props}) {
    const match = /language-(\w+)/.exec(className || '')
    const lang = match ? match[1] : '';
    return !inline ? (
      <SyntaxHighlighter
        {...props}
        style={oneLight}
        customStyle={{ backgroundColor: '#f3f3f3', padding: '1rem' }}
        codeTagProps={{ style: { backgroundColor: 'transparent' } }}
        language={lang}
        PreTag="div"
        className="not-prose rounded-xl my-4 text-[13px] border border-zinc-200 shadow-sm overflow-hidden"
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code {...props} className={`${className || ''} bg-[#f3f3f3] text-zinc-900 px-1.5 py-0.5 rounded-md text-[13px] font-mono before:content-none after:content-none`}>
        {children}
      </code>
    )
  }
};

const TypewriterMessage = ({ content, isNew, onType, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');

  const onTypeRef = useRef(onType);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onTypeRef.current = onType;
    onCompleteRef.current = onComplete;
  }, [onType, onComplete]);

  useEffect(() => {
    if (!isNew) {
      setDisplayedText(content);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(content.slice(0, i + 1));
      i++;
      if (i % 5 === 0 && onTypeRef.current) onTypeRef.current(); // Scroll less aggressively
      if (i >= content.length) {
        clearInterval(interval);
        if (onCompleteRef.current) onCompleteRef.current();
      }
    }, 15);

    return () => clearInterval(interval);
  }, [content, isNew]);

  return (
    <div className="text-sm leading-relaxed prose prose-zinc prose-p:text-zinc-900 prose-li:text-zinc-900 prose-headings:text-zinc-900 max-w-none w-full break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {displayedText}
      </ReactMarkdown>
    </div>
  );
};

const SUBJECT_OPTIONS = [
  { code: 'JAVA_OOP', name: 'Java OOP' },
  { code: 'DSA', name: 'Data Structures & Algorithms' },
  { code: 'CSHARP_BASIC', name: 'C# Basic' }
];

export default function StudentDashboard() {
  const [activeSubject, setActiveSubject] = useState('JAVA_OOP');
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  const scrollToBottom = useCallback((smooth = true) => {
    if (isAutoScrollEnabled && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, [isAutoScrollEnabled]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    // Load sessions on mount
    chatService.getSessions().then(data => {
      setSessions(data || []);
      if (data && data.length > 0) {
        handleSelectSession(data[0]);
      }
    }).catch(err => console.error(err));
  }, []);

  const handleSelectSession = (session) => {
    setActiveSession(session);
    setActiveSubject(session.subjectId === 1 ? 'JAVA_OOP' : session.subjectId === 2 ? 'DSA' : 'CSHARP_BASIC');
    chatService.getSessionHistory(session.id).then(data => {
      // Map API messages (USER/BOT) to UI role ('user'/'bot')
      const formatted = (data || []).map(m => ({
        role: m.sender === 'USER' ? 'user' : 'bot',
        content: m.content,
        id: m.id,
        mode: m.approach,
        sources: m.sources
      })).reverse();
      setMessages(formatted);
    }).catch(console.error);
  };

  const handleCreateSession = async () => {
    try {
      const subjectIdNumber = activeSubject === 'JAVA_OOP' ? 1 : activeSubject === 'DSA' ? 2 : 3;
      const newSession = await chatService.createSession(subjectIdNumber);
      setSessions([newSession, ...sessions]);
      handleSelectSession(newSession);
      setShowNewChatModal(false);
    } catch (error) {
      console.error(error);
      alert('Không thể tạo phiên chat');
    }
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAutoScrollEnabled(isNearBottom);
  };

  const handleSend = async () => {
    if (!chatInput.trim() || !activeSession) return;
    const newMsg = { role: 'user', content: chatInput, id: Date.now() };
    setMessages(prev => [...prev, newMsg]);
    const input = chatInput;
    setChatInput('');
    setIsTyping(true);
    setIsAutoScrollEnabled(true); // Force auto-scroll to bottom when sending

    try {
      const chatResponse = await chatService.sendMessage(activeSession.id, input, "RAG");
      setIsTyping(false);
      if (chatResponse.isBlindTest || chatResponse.blindTest) {
        setMessages(prev => [...prev, {
          role: 'bot',
          isABTest: true,
          id: chatResponse.messageId,
          answerA: chatResponse.answerA,
          answerB: chatResponse.answerB
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: chatResponse.message.content,
          mode: chatResponse.message.approach,
          id: chatResponse.message.id,
          sources: chatResponse.message.sources,
          isNew: true
        }]);
      }
    } catch (error) {
      setIsTyping(false);
      alert('Lỗi khi gửi tin nhắn');
    }
  };

  const handleRate = async (id, rating) => {
    try {
      await chatService.rateMessage(id, rating, "NONE");
      alert(`Đã gửi đánh giá ${rating} sao cho tin nhắn`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFeedback = async (id, type) => {
    try {
      const rating = type === 'THUMBS_UP' ? 5 : 1;
      await chatService.rateMessage(id, rating, type);
      alert(`Đã gửi phản hồi: ${type === 'THUMBS_UP' ? 'Thích' : 'Không thích'}`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleABTestSubmit = async (id, choice) => {
    try {
      // Backend validates rating between 1 and 5. We use 1 for BOTH_BAD, and 5 for a positive choice (A or B).
      const rating = choice === 'BOTH_BAD' ? 1 : 5;
      await chatService.rateMessage(id, rating, choice);
      alert(`Đã gửi lựa chọn: ${choice === 'CHOOSE_A' ? 'Chọn A' : choice === 'CHOOSE_B' ? 'Chọn B' : 'Cả hai đều tệ'}`);
    } catch (error) {
      console.error(error);
      alert('Lỗi khi gửi đánh giá');
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden relative w-full h-full bg-zinc-50 text-zinc-900 font-sans">

      {/* Sidebar */}
      <div className="w-[280px] border-r border-zinc-200 bg-zinc-50/50 hidden md:flex flex-col flex-shrink-0">
        <div className="p-5">
          <button
            onClick={() => setShowNewChatModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-zinc-900 border border-zinc-200 hover:border-zinc-300 hover:shadow-sm rounded-xl transition-all font-medium text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <Plus size={16} /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-8">
          {[1, 2, 3].map(subjectId => {
            const subjectName = subjectId === 1 ? 'JAVA_OOP' : subjectId === 2 ? 'DSA' : 'CSHARP_BASIC';
            const subjectSessions = sessions.filter(s => s.subjectId === subjectId);
            if (subjectSessions.length === 0) return null;
            return (
              <div key={subjectId}>
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-3">
                  {subjectName.replace('_', ' ')}
                </h3>
                <div className="space-y-0.5">
                  {subjectSessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => handleSelectSession(session)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-colors focus:outline-none flex items-center gap-2.5 ${
                        activeSession?.id === session.id
                          ? 'bg-zinc-200/50 text-zinc-900 font-medium'
                          : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                      }`}
                    >
                      <MessageSquare size={14} className={activeSession?.id === session.id ? 'text-zinc-700' : 'text-zinc-400'} />
                      <span className="truncate">{session.title || 'Session ' + session.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white h-full overflow-hidden relative shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">

        {/* Top Nav */}
        <div className="h-16 border-b border-zinc-100 flex items-center px-6 justify-between bg-white/80 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">Current Subject:</span>
            <span className="text-xs font-semibold text-zinc-700 px-2.5 py-1 bg-zinc-100 rounded-md tracking-wide">
              {activeSubject}
            </span>
          </div>
        </div>

        {/* Chat Content */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] md:max-w-[75%] px-5 py-4 ${
                  msg.role === 'user'
                    ? 'bg-[#e8f3fe] text-zinc-900 rounded-2xl rounded-tr-sm shadow-sm'
                    : 'bg-white border border-zinc-200 text-zinc-900 rounded-2xl rounded-tl-sm shadow-sm'
                }`}>
                  {msg.role === 'bot' && !msg.isABTest && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center">
                        <Monitor size={10} className="text-zinc-600" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-50 px-2 py-0.5 rounded-full border border-zinc-200">
                        {msg.mode} Mode
                      </span>
                    </div>
                  )}

                  {msg.isABTest ? (
                    <div className="space-y-5">
                      <div className="text-xs font-bold text-zinc-400 flex items-center gap-2 tracking-wide uppercase">
                        <AlertCircle size={14} className="text-amber-500" />
                        Model Blind Test
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-zinc-200 rounded-xl p-5 bg-zinc-50/50">
                          <div className="text-[10px] font-bold text-zinc-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-white border border-zinc-200 text-zinc-900 flex items-center justify-center shadow-sm">A</span> Response
                          </div>
                          <div className="text-sm prose prose-zinc prose-p:text-zinc-900 prose-li:text-zinc-900 max-w-none">
                             <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{msg.answerA}</ReactMarkdown>
                          </div>
                        </div>
                        <div className="border border-zinc-200 rounded-xl p-5 bg-zinc-50/50">
                          <div className="text-[10px] font-bold text-zinc-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-white border border-zinc-200 text-zinc-900 flex items-center justify-center shadow-sm">B</span> Response
                          </div>
                          <div className="text-sm prose prose-zinc prose-p:text-zinc-900 prose-li:text-zinc-900 max-w-none">
                             <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{msg.answerB}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center mt-6 p-5 bg-zinc-50 rounded-xl border border-zinc-100">
                        <span className="text-sm font-medium mb-4 text-zinc-700">Which response is better?</span>
                        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full justify-center">
                          <button onClick={() => handleABTestSubmit(msg.id, 'CHOOSE_A')} className="flex-1 py-2.5 bg-white border border-zinc-200 hover:border-zinc-900 hover:shadow-sm rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-700">
                            Choose A
                          </button>
                          <button onClick={() => handleABTestSubmit(msg.id, 'CHOOSE_B')} className="flex-1 py-2.5 bg-white border border-zinc-200 hover:border-zinc-900 hover:shadow-sm rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-zinc-700">
                            Choose B
                          </button>
                          <button onClick={() => handleABTestSubmit(msg.id, 'BOTH_BAD')} className="flex-1 py-2.5 bg-white border border-zinc-200 hover:border-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-zinc-700">
                            Both Poor
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <TypewriterMessage
                      content={msg.content}
                      isNew={msg.isNew}
                      onType={() => scrollToBottom(false)}
                      onComplete={() => {
                        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isNew: false } : m));
                      }}
                    />
                  )}

                  {msg.role === 'bot' && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-zinc-100">
                      <details className="group">
                        <summary className="flex items-center gap-2 text-xs font-medium text-zinc-500 cursor-pointer list-none select-none hover:text-zinc-900 transition-colors">
                          <FileText size={12} /> View Sources
                          <ChevronDown size={12} className="transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="mt-3 space-y-1.5 pl-1">
                          {msg.sources.map((src, idx) => (
                            <div key={idx} className="text-[11px] text-zinc-500 flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-zinc-300 mt-1.5 shrink-0"></span>
                              <span className="break-all">{src}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}

                  {msg.role === 'bot' && !msg.isABTest && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(star => (
                          <button key={star} onClick={() => handleRate(msg.id, star)} className="p-1 text-zinc-300 hover:text-zinc-900 transition-colors focus:outline-none">
                            <Star size={14} className="fill-current hover:fill-zinc-900" />
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleFeedback(msg.id, 'THUMBS_UP')} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors focus:outline-none"><ThumbsUp size={14} /></button>
                        <button onClick={() => handleFeedback(msg.id, 'THUMBS_DOWN')} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors focus:outline-none"><ThumbsDown size={14} /></button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-1.5 h-12">
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="shrink-0  p-1 ">
          <div className="max-w-3xl mx-auto relative flex items-center bg-zinc-50 border border-zinc-200/80 rounded-[28px] p-1.5 pr-2 pl-4 focus-within:bg-white focus-within:border-zinc-900/30 focus-within:ring-4 focus-within:ring-zinc-900/5 shadow-sm transition-all duration-300">

            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything about the subject..."
              className="flex-1 max-h-32 min-h-[38px] py-2 px-2.5 bg-transparent text-zinc-900 placeholder:text-zinc-400/80 focus:outline-none resize-none text-sm leading-relaxed"
              rows={1}
            />

            <div className="flex items-center gap-1.5 shrink-0">
              {chatInput.trim().length > 0 && (
                <button
                  onClick={() => setChatInput('')}
                  className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-wider px-2 py-1.5 rounded-lg hover:bg-zinc-200/20"
                >
                  Clear
                </button>
              )}

              <button
                onClick={handleSend}
                disabled={!chatInput.trim() || isTyping}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 outline-none ${
                  chatInput.trim() && !isTyping
                    ? 'bg-zinc-950 text-white hover:bg-zinc-900 hover:scale-[1.05] active:scale-95 shadow-sm'
                    : 'bg-transparent text-zinc-300 cursor-not-allowed'
                }`}
              >
                <Send size={13} className={chatInput.trim() && !isTyping ? 'stroke-[2.5] ml-0.5' : 'ml-0.5'} />
              </button>
            </div>
          </div>
          <div className="text-center mt-3 text-[10px] text-zinc-400 font-semibold tracking-wide select-none uppercase">
            AI can make mistakes. Always verify important information.
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-zinc-200 rounded-2xl shadow-2xl w-full max-w-sm"
            >
              <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 rounded-t-2xl">
                <h3 className="font-medium text-zinc-900">New Session</h3>
                <button onClick={() => setShowNewChatModal(false)} className="text-zinc-400 hover:text-zinc-900 focus:outline-none">✕</button>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2 relative" ref={dropdownRef}>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Subject</label>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 font-semibold focus:ring-2 focus:ring-zinc-900 focus:bg-white outline-none transition-all text-left shadow-sm hover:bg-zinc-100/50"
                  >
                    <span>
                      {activeSubject === 'JAVA_OOP' ? 'Java OOP' : activeSubject === 'DSA' ? 'Data Structures & Algorithms' : 'C# Basic'}
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
                        className="absolute z-20 w-full mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden py-1 max-h-48 overflow-y-auto"
                      >
                        {SUBJECT_OPTIONS.map(subj => (
                          <button
                            key={subj.code}
                            type="button"
                            onClick={() => {
                              setActiveSubject(subj.code);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs hover:bg-zinc-50 transition-colors flex flex-col gap-0.5 ${
                              activeSubject === subj.code ? 'bg-zinc-50 font-bold text-zinc-950' : 'text-zinc-600'
                            }`}
                          >
                            <span className="truncate w-full">{subj.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={handleCreateSession}
                  className="w-full py-3 bg-zinc-900 text-white rounded-xl font-medium text-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 transition-all"
                >
                  Start Chat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

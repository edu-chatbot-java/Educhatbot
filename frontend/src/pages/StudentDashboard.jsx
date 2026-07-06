import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Plus, Send, ThumbsUp, ThumbsDown, Star, ChevronDown,
  FileText, Monitor, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';
import { chatService } from '../services/chat.service';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

const TypewriterMessage = ({ content, isNew, onType, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!isNew) {
      setDisplayedText(content);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(content.slice(0, i + 1));
      i++;
      if (i % 5 === 0 && onType) onType(); // Scroll less aggressively
      if (i >= content.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 15);

    return () => clearInterval(interval);
  }, [content, isNew, onType, onComplete]);

  return (
    <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none w-full break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                {...props}
                style={materialLight}
                language={match[1]}
                PreTag="div"
                className="rounded-md my-2 text-[13px] border border-border/50 shadow-sm"
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code {...props} className={`${className} bg-muted px-1.5 py-0.5 rounded text-[13px] font-mono text-primary`}>
                {children}
              </code>
            )
          }
        }}
      >
        {displayedText}
      </ReactMarkdown>
    </div>
  );
};

export default function StudentDashboard() {
  const [activeSubject, setActiveSubject] = useState('JAVA_OOP');
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (isAutoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAutoScrollEnabled]);

  useEffect(() => {
    scrollToBottom();
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
    <div className="flex-1 flex overflow-hidden relative w-full h-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card/50 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-border">
          <button
            onClick={() => setShowNewChatModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-md transition-colors font-medium"
          >
            <Plus size={18} /> Chat mới
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {[1, 2, 3].map(subjectId => {
            const subjectName = subjectId === 1 ? 'JAVA_OOP' : subjectId === 2 ? 'DSA' : 'CSHARP_BASIC';
            const subjectSessions = sessions.filter(s => s.subjectId === subjectId);
            if (subjectSessions.length === 0) return null;
            return (
              <div key={subjectId}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">{subjectName}</h3>
                <div className="space-y-1">
                  {subjectSessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => handleSelectSession(session)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted truncate transition-colors ${activeSession?.id === session.id ? 'bg-muted text-primary' : 'text-foreground/80'}`}
                    >
                      <MessageSquare size={14} className="inline mr-2 opacity-50" />
                      {session.title || 'Phiên hỏi đáp ' + session.id}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
        {/* Top Nav */}
        <div className="h-14 border-b border-border flex items-center px-4 justify-between bg-background shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Môn học hiện tại:</span>
            <span className="text-sm font-semibold text-primary px-2 py-1 bg-primary/10 rounded-md">{activeSubject}</span>
          </div>
        </div>

        {/* Chat Content */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-6"
        >
          {messages.map((msg, i) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-card border border-border text-card-foreground rounded-tl-sm'
              }`}>
                {msg.role === 'bot' && !msg.isABTest && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Monitor size={12} className="text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      {msg.mode} Mode
                    </span>
                  </div>
                )}

                {msg.isABTest ? (
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <AlertCircle size={16} className="text-accent-foreground" />
                      BLIND TEST: Đánh giá mô hình
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-border rounded-xl p-5 bg-background shadow-sm hover:border-primary/50 transition-colors">
                        <div className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center">A</span> Câu trả lời
                        </div>
                        <div className="text-sm prose prose-sm dark:prose-invert">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.answerA}</ReactMarkdown>
                        </div>
                      </div>
                      <div className="border border-border rounded-xl p-5 bg-background shadow-sm hover:border-primary/50 transition-colors">
                        <div className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center">B</span> Câu trả lời
                        </div>
                        <div className="text-sm prose prose-sm dark:prose-invert">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.answerB}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center mt-6 p-4 bg-muted/50 rounded-xl border border-border/50">
                      <span className="text-sm font-semibold mb-4 text-foreground/80">Bạn thấy câu trả lời nào tốt hơn?</span>
                      <div className="flex gap-3 w-full">
                        <button onClick={() => handleABTestSubmit(msg.id, 'CHOOSE_A')} className="flex-1 py-2.5 bg-background border-2 border-border hover:border-primary hover:text-primary rounded-lg transition-all text-sm font-semibold shadow-sm flex items-center justify-center gap-2">
                          <CheckCircle2 size={16} /> Chọn A
                        </button>
                        <button onClick={() => handleABTestSubmit(msg.id, 'CHOOSE_B')} className="flex-1 py-2.5 bg-background border-2 border-border hover:border-primary hover:text-primary rounded-lg transition-all text-sm font-semibold shadow-sm flex items-center justify-center gap-2">
                          <CheckCircle2 size={16} /> Chọn B
                        </button>
                        <button onClick={() => handleABTestSubmit(msg.id, 'BOTH_BAD')} className="flex-1 py-2.5 bg-background border-2 border-border hover:border-destructive hover:text-destructive rounded-lg transition-all text-sm font-semibold shadow-sm flex items-center justify-center gap-2">
                          <XCircle size={16} /> Cả hai đều tệ
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <TypewriterMessage
                    content={msg.content}
                    isNew={msg.isNew}
                    onType={scrollToBottom}
                    onComplete={() => {
                      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isNew: false } : m));
                    }}
                  />
                )}

                {msg.role === 'bot' && msg.sources && (
                  <div className="mt-4 border border-border/50 rounded-lg overflow-hidden">
                    <div className="bg-muted/30 px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <FileText size={14} /> Nguồn trích dẫn (Sources)
                      </div>
                      <ChevronDown size={14} className="text-muted-foreground" />
                    </div>
                    <div className="p-2 space-y-1 bg-background/50">
                      {msg.sources.map((src, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2 p-1 hover:bg-muted rounded transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                          {src}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {msg.role === 'bot' && !msg.isABTest && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} onClick={() => handleRate(msg.id, star)} className="text-muted-foreground hover:text-yellow-400 transition-colors">
                          <Star size={16} />
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleFeedback(msg.id, 'THUMBS_UP')} className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"><ThumbsUp size={16} /></button>
                      <button onClick={() => handleFeedback(msg.id, 'THUMBS_DOWN')} className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"><ThumbsDown size={16} /></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="shrink-0 bg-background border-t border-border/50 p-4 pb-6">
          <div className="max-w-3xl mx-auto relative flex items-center">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi bất cứ điều gì về môn học..."
              className="w-full pl-4 pr-12 py-3 bg-muted text-foreground border border-border rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!chatInput.trim() || isTyping}
              className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="text-center mt-2 text-[10px] text-muted-foreground">
            EduBot AI có thể mắc lỗi. Vui lòng kiểm tra lại thông tin quan trọng.
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-semibold">Tạo phiên Chat mới</h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Chọn môn học (Subject)</label>
                <select
                  className="w-full p-2 bg-background border border-input rounded-md focus:ring-2 focus:ring-primary outline-none"
                  value={activeSubject}
                  onChange={(e) => setActiveSubject(e.target.value)}
                >
                  <option value="JAVA_OOP">JAVA_OOP</option>
                  <option value="DSA">DSA</option>
                  <option value="CSHARP_BASIC">CSHARP_BASIC</option>
                </select>
              </div>
              <button
                onClick={handleCreateSession}
                className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium mt-2 hover:bg-primary/90"
              >
                Bắt đầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

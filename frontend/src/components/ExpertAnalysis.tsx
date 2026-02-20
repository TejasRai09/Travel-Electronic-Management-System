import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles } from 'lucide-react';
import { TravelRequest } from '../types';

interface ExpertAnalysisProps {
  requests: TravelRequest[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function formatExpertReply(content: string): string {
  return String(content || '')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, '• ')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const ExpertAnalysis: React.FC<ExpertAnalysisProps> = ({ requests }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am the Zuari Travel Expert. I can answer questions about the Travel Policy and help you with your travel history. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('travelDeskToken');
      const response = await fetch('/api/expert/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();
      if (data.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the server.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 flex items-center gap-3 shadow-md z-10">
        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shadow-inner">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Travel Expert Center</h3>
          <p className="text-blue-100 text-xs font-medium">Powered by Gemini & Zuari Travel Policy</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`
              max-w-[85%] rounded-2xl p-4 shadow-sm
              ${msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none shadow-blue-200' 
                : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-slate-200'}
            `}>
              <div className="flex items-center gap-2 mb-1 opacity-70 text-[10px] font-bold uppercase tracking-wider">
                {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                {msg.role === 'user' ? 'You' : 'Expert'}
              </div>
              {msg.role === 'assistant' ? (
                <div className="leading-relaxed whitespace-pre-line text-sm md:text-base">
                  {formatExpertReply(msg.content)}
                </div>
              ) : (
                <div className="leading-relaxed whitespace-pre-line text-sm md:text-base">
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
           <div className="flex justify-start animate-in fade-in duration-300">
             <div className="bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-blue-500" />
                <span className="text-sm text-slate-500 font-medium">Thinking...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about travel policy or your recent trips..."
            className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400 shadow-sm text-slate-700"
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 bottom-2 w-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl flex items-center justify-center transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExpertAnalysis;

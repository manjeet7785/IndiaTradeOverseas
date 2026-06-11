import React, { useState, useEffect, useRef } from 'react';
import { FiMessageCircle, FiX, FiSend, FiCornerDownLeft } from 'react-icons/fi';
import { chatApi } from '../../api/chat';
import { leadsApi } from '../../api/leads';
import toast from 'react-hot-toast';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Check if session exists in sessionStorage
  useEffect(() => {
    const savedSessionId = sessionStorage.getItem('chatSessionId');
    if (savedSessionId) {
      loadSessionData(savedSessionId);
    }
  }, []);

  // Poll for messages every 4 seconds when widget is open and session exists
  useEffect(() => {
    let intervalId;
    if (isOpen && session?.sessionId) {
      fetchMessages();
      intervalId = setInterval(fetchMessages, 4000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, session]);

  // Scroll to bottom whenever messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessionData = async (sessionId) => {
    try {
      const response = await chatApi.getMessages(sessionId);
      if (response.success) {
        setSession(response.data.session);
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
      sessionStorage.removeItem('chatSessionId');
    }
  };

  const fetchMessages = async () => {
    if (!session?.sessionId) return;
    try {
      const response = await chatApi.getMessages(session.sessionId);
      if (response.success) {
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error('Error polling chat messages:', error);
    }
  };

  const handleStartChat = async (e) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    setLoading(true);
    try {
      const response = await chatApi.initSession(clientName, clientEmail);
      if (response.success) {
        setSession(response.data.session);
        sessionStorage.setItem('chatSessionId', response.data.session.sessionId);
        setMessages(response.data.messages || []);
        toast.success('Chat session started');
      }
    } catch (error) {
      console.error('Error starting chat session:', error);
      toast.error('Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.sessionId) return;
    const msgText = newMessage;
    setNewMessage('');

    // Optimistically update UI
    const tempMsg = {
      _id: 'temp_' + Date.now(),
      sessionId: session.sessionId,
      sender: 'CLIENT',
      senderName: session.clientName,
      message: msgText,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const response = await chatApi.sendMessage(session.sessionId, msgText);
      if (response.success) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Message delivery failed');
    }
  };

  const handleQuickOptionClick = async (messageText) => {
    if (!session?.sessionId) return;
    try {
      const response = await chatApi.sendMessage(session.sessionId, messageText);
      if (response.success) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending quick option message:', error);
    }
  };

  const handleCreateCrmLeadFromChat = async () => {
    if (!session) return;
    try {
      const chatLogsText = messages.map(m => `${m.senderName}: ${m.message}`).join("\n");
      const response = await leadsApi.createLead({
        customerName: session.clientName,
        email: session.clientEmail || 'chat@example.com',
        phone: '9876543210',
        productCategory: 'STONE',
        quantity: '500 MT',
        destination: 'Kishanganj, Bihar',
        chatSummary: chatLogsText || 'Lead created from support chat widget.'
      });
      if (response.success) {
        toast.success('CRM Lead generated successfully from this chat!', {
          icon: '🚀',
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        });
      }
    } catch (error) {
      console.error('Error creating lead from chat:', error);
      toast.error('Failed to create lead.');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl hover:scale-105 transition-all duration-200"
        >
          <FiMessageCircle size={26} />
        </button>
      )}

      {/* Floating Chat Container */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <h4 className="font-bold text-sm">ITO Trade Support</h4>
                <p className="text-[10px] text-blue-100 font-medium">Typically replies in a minute</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col space-y-4">
            {!session ? (
              /* Onboarding Form */
              <form onSubmit={handleStartChat} className="space-y-4 my-auto">
                <div className="text-center mb-4">
                  <h5 className="font-bold text-slate-800 text-base">Let's start our conversation!</h5>
                  <p className="text-slate-500 text-xs mt-1">Please introduce yourself to chat with a support agent.</p>
                </div>
                <div>
                  <label className="label text-xs">Name *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="input text-sm"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="label text-xs">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="input text-sm"
                    placeholder="name@company.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2.5 rounded-xl text-sm shadow hover:from-blue-700 hover:to-indigo-700 transition"
                >
                  {loading ? 'Initializing...' : 'Start Chat'}
                </button>
              </form>
            ) : (
              /* Message logs list */
              <>
                {messages.map((msg) => {
                  const isClient = msg.sender === 'CLIENT';
                  const isSystem = msg.sender === 'SYSTEM';

                  if (isSystem) {
                    return (
                      <div key={msg._id} className="text-center px-4 py-1">
                        <span className="inline-block bg-slate-200/80 text-[11px] text-slate-600 px-3 py-1 rounded-full font-medium leading-relaxed">
                          {msg.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isClient ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-slate-400 font-medium mb-1 px-1">
                        {isClient ? 'You' : msg.senderName}
                      </span>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${isClient
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                          }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Predefined Quick Options */}
          {session && (
            <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 space-y-1.5 select-none">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Quick Actions</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickOptionClick("I want to inquire about Stone Aggregates delivery.")}
                  className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 transition"
                >
                  🪨 Stone
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickOptionClick("I need Coal bulk pricing.")}
                  className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 transition"
                >
                  🔥 Coal
                </button>
                <button
                  type="button"
                  onClick={handleCreateCrmLeadFromChat}
                  className="px-2 py-0.5 text-[10px] bg-blue-50 border border-blue-200 rounded text-blue-700 hover:bg-blue-100 font-semibold transition"
                >
                  🚀 Create CRM Lead
                </button>
              </div>
            </div>
          )}

          {/* Footer input */}
          {session && (
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <FiSend size={16} />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

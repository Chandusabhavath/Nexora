import React, { useState, useEffect, useRef } from 'react';
import { apiGetConversation, apiSendMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { X, Send, User } from 'lucide-react';

export const ChatDrawer = ({ isOpen, onClose, booking }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !booking) return;

    const fetchChat = async () => {
      try {
        const res = await apiGetConversation(booking._id);
        if (res.success && res.conversation?.messages) {
          setMessages(res.conversation.messages);
        }
      } catch (err) {
        console.error('Failed to load chat:', err);
      }
    };

    fetchChat();
    const interval = setInterval(fetchChat, 4000);
    return () => clearInterval(interval);
  }, [isOpen, booking]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !booking) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      const res = await apiSendMessage(booking._id, newMessage.trim());
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        
        {/* Chat Header */}
        <div className="p-4 bg-forest-900 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] text-forest-300 font-bold uppercase tracking-wider">
              Booking Chat • #{booking.bookingReference}
            </span>
            <h4 className="text-sm font-bold truncate max-w-xs">{booking.service?.title}</h4>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-300 hover:text-white hover:bg-forest-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-surface-50">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-400">
              No messages yet. Send a greeting or ask about arrival time and equipment.
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId?.toString() === user?.id?.toString() || msg.senderId === user?._id;
              return (
                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-gray-400 mb-0.5 px-1 capitalize">
                    {isMe ? 'You' : msg.senderRole}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                      isMe
                        ? 'bg-forest-800 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 border border-surface-200 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-0.5 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-surface-200 flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

//
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import api from '../../services/axios';
import ConversationList from '../../components/admin/Chat/ConversationList';
import MessageList from '../../components/admin/Chat/MessageList';
import MessageInput from '../../components/admin/Chat/MessageInput';
import '../../assets/style/chat-admin.css';

const BACKEND_URL = 'http://localhost:5000';

const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?._id) setCurrentUserId(user._id);
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      auth: { token: localStorage.getItem('token') },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('join', 'admins');
    });

    newSocket.on('message:new', ({ conversationId, message }) => {
      if (selectedConv?._id === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [selectedConv]);

  useEffect(() => {
    const fetchConvs = async () => {
      try {
        setError('');
        setLoading(true);
        const { data } = await api.get('/admin/chat/conversations');
        setConversations(data.conversations || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi tải danh sách chat');
      } finally {
        setLoading(false);
      }
    };
    fetchConvs();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      const fetchMessages = async () => {
        try {
          const { data } = await api.get('/admin/chat/messages', {
            params: { conversationId: selectedConv._id },
          });
          setMessages(data.messages || []);
          if (socket) socket.emit('join', selectedConv._id);
        } catch (err) {
          console.error('Lỗi tải tin nhắn:', err);
        }
      };
      fetchMessages();
    }
  }, [selectedConv, socket]);

  const handleSendMessage = async (content) => {
    try {
      await api.post('/admin/chat/send', {
        conversationId: selectedConv._id,
        type: 'text',
        content,
      });
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err);
    }
  };

  if (loading) return <p>Đang tải chat...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="chat-page">
      {/* Sidebar: danh sách chat */}
      <div className="conversation-list">
        <ConversationList
          conversations={conversations}
          onSelect={setSelectedConv}
          selectedId={selectedConv?._id}
        />
      </div>

      {/* Main chat */}
      <div className="message-area">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="chat-header">
              <img
                src={selectedConv.participants[0]?.avatar || '/default-avatar.png'}
                alt="user"
              />
              <div>
                <p className="font-semibold">
                  {selectedConv.participants[0]?.name || 'Khách'}
                </p>
                <p className="text-sm opacity-80">Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="messages">
              <MessageList messages={messages} currentUserId={currentUserId} />
            </div>

            {/* Input */}
            <MessageInput onSend={handleSendMessage} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Chọn cuộc trò chuyện để bắt đầu
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;

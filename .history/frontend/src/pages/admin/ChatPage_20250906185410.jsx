// frontend/src/pages/admin/ChatPage.jsx
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import api from '../../services/axios';
import ConversationList from '../../components/admin/Chat/ConversationList';
import MessageList from '../../components/admin/Chat/MessageList';
import MessageInput from '../../components/admin/Chat/MessageInput';
import '../../assets/style/chat-admin.css';

const BACKEND_URL = 'http://localhost:5000'; // Thay bằng config nếu có

const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  // Giả sử bạn lưu user vào localStorage sau khi login
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?._id) setCurrentUserId(user._id);
    } catch {
      // fallback
      setCurrentUserId(null);
    }
  }, []);

  // Khởi tạo socket
  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      auth: { token: localStorage.getItem('token') },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('join', 'admins'); // Join room admins
    });

    newSocket.on('conversation:updated', (payload) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === payload.conversationId ? { ...conv, ...payload } : conv
        )
      );
    });

    newSocket.on('message:new', ({ conversationId, message }) => {
      if (selectedConv?._id === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId
            ? { ...conv, lastMessage: message, unread: (conv.unread || 0) + 1 }
            : conv
        )
      );
    });

    newSocket.on('message:read', ({ conversationId, messageId, readerId }) => {
      if (selectedConv?._id === conversationId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? { ...msg, readBy: [...(msg.readBy || []), readerId] }
              : msg
          )
        );
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [selectedConv]);

  // Fetch conversations
  useEffect(() => {
    const fetchConvs = async () => {
      try {
        setError('');
        setLoading(true);
        const { data } = await api.get('/admin/chat/conversations');
        setConversations(data.conversations || []);
      } catch (err) {
        console.error('Lỗi tải danh sách chat:', err);
        setError(err.response?.data?.message || 'Lỗi tải danh sách chat');
      } finally {
        setLoading(false);
      }
    };
    fetchConvs();
  }, []);

  // Fetch messages khi chọn conv
  useEffect(() => {
    if (selectedConv) {
      const fetchMessages = async () => {
        try {
          const { data } = await api.get('/admin/chat/messages', {
            params: { conversationId: selectedConv._id },
          });
          setMessages(data.messages || []);
          if (socket) {
            socket.emit('join', selectedConv._id);
          }
          // Có thể gọi API mark read tại đây nếu muốn
          // await api.post(`/admin/chat/${selectedConv._id}/read`);
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
      // Socket sẽ emit message mới, không cần set state thủ công
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err);
    }
  };

  if (loading) return <p>Đang tải chat...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="chat-page flex h-screen flex">
      {/* Left: Conversation List */}
      <div className="conversation-list w-1/4 border-r border-gray-300 overflow-y-auto">
        <ConversationList
          conversations={conversations}
          onSelect={setSelectedConv}
          selectedId={selectedConv?._id}
        />
      </div>

      {/* Right: Messages + Input */}
      <div className="message-area flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="chat-header p-4 border-b border-gray-300 flex items-center gap-3 bg-blue-50">
              <img
                src={
                  selectedConv.participants[0]?.avatar || '/default-avatar.png'
                }
                alt="user"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-semibold">
                  {selectedConv.participants[0]?.name || 'Khách'}
                </p>
                <p className="text-sm text-gray-500">Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="messages flex-1 overflow-y-auto p-4 bg-gray-100">
              <MessageList
                messages={messages}
                currentUserId={currentUserId}
              />
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

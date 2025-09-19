import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import api from '../../services/axios';
import ConversationList from '../../components/user/ConversationList';
import ChatBox from '../../components/user/ChatBox';
import '../../assets/style/user-messages.css';

const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') },
});

const UserMessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConversations();

    socket.on('connect', () => console.log('🔌 Socket connected (user)'));
    socket.on('message:new', handleNewMessage);
    socket.on('conversation:updated', handleConvUpdated);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('conversation:updated', handleConvUpdated);
    };
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/user/chat'); // ✅ endpoint chuẩn
      const sorted = data.conversations.sort((a, b) => {
        const aHasAdmin = a.participants.some(p => p.role === 'admin');
        const bHasAdmin = b.participants.some(p => p.role === 'admin');
        if (aHasAdmin && !bHasAdmin) return -1;
        if (!aHasAdmin && bHasAdmin) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
      setConversations(sorted);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConv = (conv) => {
    setSelectedConv(conv);
    socket.emit('join', conv._id);
  };

  const handleNewMessage = (data) => {
    if (selectedConv && data.conversationId === selectedConv._id) {
      setSelectedConv(prev => ({
        ...prev,
        messages: [...(prev.messages || []), data.message],
      }));
    }
    fetchConversations();
  };

  const handleConvUpdated = () => {
    fetchConversations();
  };

  return (
    <div className="user-messages-page">
      <div className="layout">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConv?._id}
          onSelect={handleSelectConv}
          loading={loading}
        />
        <div className="chat-area">
          {selectedConv ? (
            <ChatBox
              conversation={selectedConv}
              socket={socket}
              onMessagesUpdated={fetchConversations}
            />
          ) : (
            <div className="chat-placeholder">
              <p>💬 Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserMessagesPage;

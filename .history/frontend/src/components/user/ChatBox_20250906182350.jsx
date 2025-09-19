import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/axios';

const ChatBox = ({ conversation, socket, onMessagesUpdated }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();

    socket.on('message:new', handleNewMessage);
    socket.on('message:read', handleMessageRead);

    return () => {
      socket.off('message:new');
      socket.off('message:read');
    };
  }, [conversation._id]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/user/chat/messages', {
        params: { conversationId: conversation._id },
      });
      setMessages(data.messages);

      // Mark all as read
      data.messages.forEach((msg) => {
        if (!msg.readBy.includes('currentUserId')) {
          api.post(`/api/user/chat/message/${msg._id}/read`);
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (data) => {
    if (data.conversationId === conversation._id) {
      setMessages((prev) => [...prev, data.message]);

      if (data.message.sender !== 'currentUserId') {
        socket.emit('message:read', {
          conversationId: conversation._id,
          messageId: data.message._id,
        });
      }
    }
  };

  const handleMessageRead = (data) => {
    if (data.conversationId === conversation._id) {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId
            ? { ...m, readBy: [...m.readBy, data.readerId] }
            : m
        )
      );
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      const payload = {
        conversationId: conversation._id,
        content: newMessage,
        type: 'text',
      };
      const { data } = await api.post('/api/user/chat/send', payload);
      setMessages((prev) => [...prev, data.message]);
      setNewMessage('');
      onMessagesUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-box">
      <h2>{conversation.title || 'Chat'}</h2>
      <div className="messages">
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`message ${
                msg.sender === 'currentUserId' ? 'sent' : 'received'
              }`}
            >
              <p>{msg.content}</p>
              <span>
                {msg.readBy.length > 1 ? 'Đã đọc' : ''}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}>Gửi</button>
      </div>
    </div>
  );
};

export default ChatBox;

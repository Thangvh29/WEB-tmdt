import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import vi from 'date-fns/locale/vi';

const MessageList = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="space-y-2">
      {messages.map((msg) => {
        const senderId =
          typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
        const isSentByMe = senderId === currentUserId;

        return (
          <div
            key={msg._id}
            className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
          >
            {!isSentByMe && (
              <img
                src={msg.sender?.avatar || '/default-avatar.png'}
                alt="avatar"
                className="w-7 h-7 rounded-full object-cover mr-2"
              />
            )}
            <div className={`message-bubble ${isSentByMe ? 'sent' : 'received'}`}>
              <p>{msg.content}</p>
              <div className="message-meta">
                {msg.createdAt
                  ? format(new Date(msg.createdAt), 'HH:mm', { locale: vi })
                  : ''}
                {msg.readBy?.length > 0 && isSentByMe && ' • Đã đọc'}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

// frontend/src/components/admin/Chat/MessageList.jsx
import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns'; // date-fns để format time

const MessageList = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const isSentByMe = msg.sender === currentUserId; // Admin là 'me'
        return (
          <div
            key={msg._id}
            className={`message flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${isSentByMe ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              <p>{msg.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {format(new Date(msg.createdAt), 'HH:mm')}
              </p>
              {msg.readBy?.length > 0 && <p className="text-xs opacity-50">Đã đọc</p>}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
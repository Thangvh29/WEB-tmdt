// frontend/src/components/admin/Chat/MessageList.jsx
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
            className={`flex items-end ${
              isSentByMe ? 'justify-end' : 'justify-start'
            }`}
          >
            {!isSentByMe && (
              <img
                src={msg.sender?.avatar || '/default-avatar.png'}
                alt="avatar"
                className="w-7 h-7 rounded-full object-cover mr-2"
              />
            )}
            <div
              className={`max-w-[65%] px-3 py-2 rounded-2xl text-sm shadow ${
                isSentByMe
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              <p>{msg.content}</p>
              <p className="text-[10px] mt-1 opacity-70 text-right">
                {msg.createdAt
                  ? format(new Date(msg.createdAt), 'HH:mm', { locale: vi })
                  : ''}
              </p>
              {msg.readBy?.length > 0 && isSentByMe && (
                <p className="text-[10px] opacity-50 text-right">Đã đọc</p>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

// frontend/src/components/admin/Chat/MessageInput.jsx
import React, { useState } from 'react';
import { Send } from 'lucide-react';

const MessageInput = ({ onSend }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-300 flex items-center gap-2 bg-white">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nhập tin nhắn..."
        className="flex-1 p-2 border border-gray-300 rounded-full outline-none"
      />
      <button type="submit" className="bg-blue-500 text-white p-2 rounded-full">
        <Send size={20} />
      </button>
    </form>
  );
};

export default MessageInput;
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
    <form onSubmit={handleSubmit} className="input-area">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Nhập tin nhắn..."
      />
      <button type="submit">
        <Send size={18} />
      </button>
    </form>
  );
};

export default MessageInput;

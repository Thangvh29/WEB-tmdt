// frontend/src/components/admin/Chat/ConversationList.jsx
import React from 'react';

const ConversationList = ({ conversations, onSelect, selectedId }) => {
  return (
    <div className="conversation-list">
      {conversations.map((conv) => (
        <div
          key={conv._id}
          onClick={() => onSelect(conv)}
          className={`conversation-item flex items-center gap-3 px-4 py-3 cursor-pointer 
            ${selectedId === conv._id ? 'bg-[#e6f2ff]' : 'hover:bg-gray-100'}`}
        >
          <img
            src={conv.participants[0]?.avatar || '/default-avatar.png'}
            alt="user"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0 border-b border-gray-200 pb-2">
            <p
              className={`font-medium text-sm truncate ${
                selectedId === conv._id ? 'text-blue-600' : 'text-gray-900'
              }`}
            >
              {conv.participants[0]?.name || 'Khách'}
            </p>
            <p
              className={`text-xs truncate ${
                selectedId === conv._id ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              {conv.lastMessage?.preview || 'Không có tin nhắn'}
            </p>
          </div>
          {conv.unread > 0 && (
            <span className="bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-full">
              {conv.unread}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConversationList;

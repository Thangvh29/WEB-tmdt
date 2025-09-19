// frontend/src/components/admin/Chat/ConversationList.jsx
import React from 'react';

const ConversationList = ({ conversations, onSelect, selectedId }) => {
  return (
    <div className="space-y-1 p-2">
      {conversations.map((conv) => (
        <div
          key={conv._id}
          onClick={() => onSelect(conv)}
          className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-all ${
            selectedId === conv._id
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          <img
            src={conv.participants[0]?.avatar || '/default-avatar.png'}
            alt="user"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {conv.participants[0]?.name || 'Khách'}
            </p>
            <p
              className={`text-xs truncate ${
                selectedId === conv._id ? 'text-white/80' : 'text-gray-500'
              }`}
            >
              {conv.lastMessage?.preview || 'Không có tin nhắn'}
            </p>
          </div>
          {conv.unread > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
              {conv.unread}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConversationList;

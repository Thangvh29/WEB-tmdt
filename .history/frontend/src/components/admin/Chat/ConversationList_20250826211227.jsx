// frontend/src/components/admin/Chat/ConversationList.jsx
import React from 'react';

const ConversationList = ({ conversations, onSelect, selectedId }) => {
  return (
    <div className="space-y-2 p-4">
      {conversations.map((conv) => (
        <div
          key={conv._id}
          onClick={() => onSelect(conv)}
          className={`conversation-item flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-blue-50 ${selectedId === conv._id ? 'bg-blue-100' : ''}`}
        >
          <img
            src={conv.participants[0]?.avatar || '/default-avatar.png'} // Giả sử participant[0] là user
            alt="user"
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1">
            <p className="font-semibold">{conv.participants[0]?.name || 'Khách'}</p>
            <p className="text-sm text-gray-500 truncate">{conv.lastMessage?.preview || 'Không có tin nhắn'}</p>
          </div>
          {conv.unread > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{conv.unread}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
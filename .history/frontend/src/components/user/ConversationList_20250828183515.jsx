// frontend/src/components/user/ConversationList.jsx
import React from 'react';

const ConversationList = ({ conversations, selectedId, onSelect, loading }) => {
  if (loading) return <p>Đang tải...</p>;

  return (
    <div className="conversation-list">
      {conversations.map(conv => (
        <div
          key={conv._id}
          className={`conv-item ${conv._id === selectedId ? 'active' : ''}`}
          onClick={() => onSelect(conv)}
        >
          <img src={conv.avatar || '/default-avatar.png'} alt="avatar" className="conv-avatar" />
          <div className="conv-info">
            <h3>{conv.title || conv.participants.map(p => p.name).join(', ')}</h3>
            <p>{conv.lastMessage?.preview || 'No messages yet'}</p>
          </div>
          {conv.unreadCount > 0 && <span className="unread-badge">{conv.unreadCount}</span>}
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
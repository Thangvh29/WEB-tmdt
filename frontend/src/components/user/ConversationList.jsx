import React from 'react';

const ConversationList = ({ conversations, selectedId, onSelect, loading }) => {
  if (loading) return <div className="conversation-list"><p>Đang tải...</p></div>;

  return (
    <div className="conversation-list">
      {conversations.length === 0 ? (
        <p className="empty-msg">Chưa có cuộc trò chuyện nào</p>
      ) : (
        conversations.map(conv => (
          <div
            key={conv._id}
            className={`conv-item ${conv._id === selectedId ? 'active' : ''}`}
            onClick={() => onSelect(conv)}
          >
            <img
              src={conv.avatar || '/default-avatar.png'}
              alt="avatar"
              className="conv-avatar"
            />
            <div className="conv-info">
              <h3>{conv.title || conv.participants.map(p => p.name).join(', ')}</h3>
              <p>{conv.lastMessage?.preview || 'Chưa có tin nhắn'}</p>
            </div>
            {conv.unreadCount > 0 && (
              <span className="unread-badge">{conv.unreadCount}</span>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ConversationList;

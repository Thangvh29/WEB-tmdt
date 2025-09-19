// frontend/src/components/user/AvatarMenu.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/axios';

const AvatarMenu = ({ postId, authorId, onClose }) => {
  const navigate = useNavigate();

  const handleMessage = async () => {
    try {
      const { data } = await api.post(`/user/posts/${postId}/message`);
      // Chuyển đến messenger với conversationId
      navigate(`/user/messages/${data.conversationId}`);
    } catch (err) {
      console.error(err);
    }
    onClose();
  };

  return (
    <div className="avatar-menu">
      <button onClick={handleMessage}>Nhắn tin</button>
      <button onClick={onClose}>Đóng</button>
    </div>
  );
};

export default AvatarMenu;
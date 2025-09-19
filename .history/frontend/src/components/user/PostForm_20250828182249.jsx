// frontend/src/components/user/PostForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/axios';

const PostForm = ({ postToEdit, onPostCreated, onPostUpdated }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (postToEdit) {
      setContent(postToEdit.content || '');
      setImages(postToEdit.images || []);
    }
  }, [postToEdit]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 6) {
      setError('Tối đa 6 ảnh');
      return;
    }
    // Giả định upload images và lấy URLs; ở đây chỉ lưu files tạm
    setImages(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (images.length > 6) return setError('Tối đa 6 ảnh');

    try {
      // Giả định upload images trước và lấy URLs; ở đây dùng placeholder
      const imageUrls = images; // Thay bằng real upload

      const payload = { content, images: imageUrls };
      let response;
      if (postToEdit) {
        response = await api.put(`/user/posts/${postToEdit._id}`, payload);
        onPostUpdated(response.data.post);
      } else {
        response = await api.post('/user/posts', payload);
        onPostCreated(response.data.post);
      }
      setContent('');
      setImages([]);
    } catch (err) {
      setError('Lỗi khi đăng bài');
      console.error(err);
    }
  };

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Viết trạng thái..."
        maxLength={2000}
      />
      <input type="file" multiple accept="image/*" onChange={handleImageChange} />
      <div className="image-preview">
        {images.map((img, i) => <img key={i} src={img} alt="preview" />)}
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit">{postToEdit ? 'Cập nhật' : 'Đăng bài'}</button>
    </form>
  );
};

export default PostForm;
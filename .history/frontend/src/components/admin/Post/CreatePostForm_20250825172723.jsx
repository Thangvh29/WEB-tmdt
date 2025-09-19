// src/components/admin/CreatePostForm.jsx
import { useState, useEffect } from 'react';
import api from '../../services/axios';

const CreatePostForm = ({ post = null, onPostCreated }) => {
  const [content, setContent] = useState(post?.content || '');
  const [images, setImages] = useState(post?.images || []);
  const [product, setProduct] = useState(post?.product || '');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 6 - images.length);
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      const { data } = await api.post('/admin/posts/upload-images', formData, { // Giả sử có endpoint upload multiple
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImages([...images, ...data.urls]);
    } catch (err) {
      alert('Lỗi upload ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length < 1 || images.length > 6) return alert('Ảnh từ 1-6');
    try {
      const payload = { content, images, product };
      let res;
      if (post) {
        res = await api.put(`/admin/posts/${post._id}`, payload);
      } else {
        res = await api.post('/admin/posts/', payload);
      }
      onPostCreated(res.data.post);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-post-form">
      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Nội dung" maxLength={2000} />
      <input type="text" value={product} onChange={e => setProduct(e.target.value)} placeholder="Product ID (optional)" />
      <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={uploading || images.length >= 6} />
      <div className="image-preview">
        {images.map((img, i) => <img key={i} src={img} alt={`preview-${i}`} width="100" />)}
      </div>
      <button type="submit" disabled={uploading}>{post ? 'Cập nhật' : 'Đăng bài'}</button>
    </form>
  );
};

export default CreatePostForm;
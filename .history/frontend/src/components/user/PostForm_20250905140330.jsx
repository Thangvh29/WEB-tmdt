// frontend/src/components/user/PostForm.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/axios";
import { Image as ImageIcon, Send } from "lucide-react";
import "../../assets/style/post-form.css";

const PostForm = ({ postToEdit, onPostCreated, onPostUpdated }) => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (postToEdit) {
      setContent(postToEdit.content || "");
      setImages(postToEdit.images || []);
    }
  }, [postToEdit]);

  const handleImageChange = async (e) => {
  const files = Array.from(e.target.files);
  if (files.length + images.length > 6) {
    setError("Tối đa 6 ảnh");
    return;
  }

  try {
    const uploadedUrls = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("image", file);

      const { data } = await api.post("/user/posts/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      uploadedUrls.push(data.file.url);
    }

    setImages((prev) => [...prev, ...uploadedUrls]);
  } catch (err) {
    console.error("Upload ảnh lỗi:", err);
    setError("Upload ảnh thất bại");
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (images.length > 6) return setError("Tối đa 6 ảnh");

    try {
      const imageUrls = images; // TODO: upload thật
      const payload = { content, images: imageUrls };
      let response;
      if (postToEdit) {
        response = await api.put(`/user/posts/${postToEdit._id}`, payload);
        onPostUpdated(response.data.post);
      } else {
        response = await api.post("/user/posts", payload);
        onPostCreated(response.data.post);
      }
      setContent("");
      setImages([]);
    } catch (err) {
      setError("Lỗi khi đăng bài");
      console.error(err);
    }
  };

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      {/* Ô nhập nội dung */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Bạn đang nghĩ gì?"
        maxLength={2000}
      />

      {/* Upload + nút submit */}
      <div className="post-form-actions">
        <label className="add-image-btn">
          <ImageIcon size={18} />
          <span>Thêm ảnh</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            hidden
          />
        </label>

        <button type="submit" className="submit-btn">
          <Send size={16} />
          {postToEdit ? "Cập nhật" : "Đăng"}
        </button>
      </div>

      {/* Hiển thị lỗi */}
      {error && <p className="error">{error}</p>}

      {/* Preview ảnh */}
      {images.length > 0 && (
        <div className="image-preview">
          {images.map((img, i) => (
            <div key={i} className="preview-item">
              <img src={img} alt="preview" />
              <button
                type="button"
                onClick={() =>
                  setImages((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="remove-btn"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </form>
  );
};

export default PostForm;

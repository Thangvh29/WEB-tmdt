// frontend/src/components/user/PostForm.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/axios";
import { Image as ImageIcon, Send } from "lucide-react";

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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 6) {
      setError("Tối đa 6 ảnh");
      return;
    }
    setImages((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
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
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow rounded-2xl p-4 w-full max-w-xl mx-auto"
    >
      {/* Ô nhập nội dung */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Bạn đang nghĩ gì..."
        maxLength={2000}
        className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none"
        rows={3}
      />

      {/* Upload ảnh */}
      <div className="flex items-center justify-between mt-3">
        <label className="flex items-center gap-2 cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
          <ImageIcon size={20} />
          <span>Thêm ảnh</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        <button
          type="submit"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
        >
          <Send size={18} />
          {postToEdit ? "Cập nhật" : "Đăng bài"}
        </button>
      </div>

      {/* Hiển thị lỗi */}
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

      {/* Preview ảnh */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={img}
                alt="preview"
                className="w-full h-28 object-cover rounded-lg shadow"
              />
              {/* nút xóa */}
              <button
                type="button"
                onClick={() =>
                  setImages((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
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

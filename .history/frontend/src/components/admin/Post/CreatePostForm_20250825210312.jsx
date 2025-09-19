import { useState, useRef, useEffect, useCallback } from "react";
import api from "../../../services/axios";

const CreatePostForm = ({ post, onPostCreated }) => {
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [images, setImages] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const contentRef = useRef(null);
  const debounceTimer = useRef(null);

  // Auto-resize cho content div
  const resizeContent = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    resizeContent();
  }, [content, resizeContent]);

  // Xử lý nhập liệu với debounce
  const handleContentChange = useCallback((e) => {
    const text = e.target.innerText.replace(/\n{2,}/g, '\n'); // Chuẩn hóa line breaks
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setContent(text);
      resizeContent();
    }, 500); // Tăng lên 500ms để xử lý nhập nhanh
  }, [resizeContent]);

  // Xử lý keydown để ngăn Enter chèn thẻ <div>
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertText', false, '\n');
      resizeContent();
    }
  };

  // Xử lý focus và blur
  const handleContentFocus = () => {
    if (contentRef.current.innerText === "Bạn đang nghĩ gì?") {
      contentRef.current.innerText = "";
    }
  };

  const handleContentBlur = () => {
    if (!contentRef.current.innerText.trim()) {
      contentRef.current.innerText = "Bạn đang nghĩ gì?";
    }
  };

  // Khởi tạo placeholder và đồng bộ content
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerText = content || "Bạn đang nghĩ gì?";
    }
  }, [content]);

  const handleFileChange = (files) => {
    setImages(files);
    if (files) {
      const urls = Array.from(files).map((file) => URL.createObjectURL(file));
      setPreviewUrls(urls);
    } else {
      setPreviewUrls([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    // Chỉ gửi content nếu không phải placeholder
    formData.append("content", content.trim() === "Bạn đang nghĩ gì?" ? "" : content);

    if (images) {
      Array.from(images).forEach((file) => {
        formData.append("images", file);
      });
    }

    try {
      const res = post
        ? await api.put(`/admin/posts/${post._id}`, formData)
        : await api.post("/admin/posts", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      onPostCreated(res.data);
      setTitle("");
      setContent("");
      setImages(null);
      setPreviewUrls([]);
      if (contentRef.current) {
        contentRef.current.innerText = "Bạn đang nghĩ gì?";
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <form className="create-post-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Tiêu đề (tùy chọn)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="title-input"
      />
      <div
        ref={contentRef}
        contentEditable="true"
        onInput={handleContentChange}
        onKeyDown={handleKeyDown}
        onFocus={handleContentFocus}
        onBlur={handleContentBlur}
        className="content-input"
        data-placeholder="Bạn đang nghĩ gì?"
      />
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileChange(e.target.files)}
        className="file-input"
      />
      {previewUrls.length > 0 && (
        <div
          className={`preview-grid ${previewUrls.length === 1 ? "single" : "multi"}`}
        >
          {previewUrls.map((url, i) => (
            <img key={i} src={url} alt={`preview-${i}`} />
          ))}
        </div>
      )}
      <button type="submit" className="submit-btn">
        {post ? "Cập nhật bài viết" : "Đăng bài"}
      </button>
    </form>
  );
};

export default CreatePostForm;
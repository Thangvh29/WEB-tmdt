import { useState, useRef, useEffect, useCallback } from "react";
import api from "../../../services/axios";

const CreatePostForm = ({ post, onPostCreated }) => {
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [images, setImages] = useState(null); // file ảnh
  const [imageUrls, setImageUrls] = useState([]); // url ảnh nhập vào
  const [previewUrls, setPreviewUrls] = useState([]); // preview tất cả ảnh
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
  const handleContentChange = useCallback(
    (e) => {
      const text = e.target.innerText.replace(/\n{2,}/g, "\n"); // Chuẩn hóa line breaks
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        setContent(text);
        resizeContent();
      }, 500);
    },
    [resizeContent]
  );

  // Xử lý keydown để ngăn Enter chèn thẻ <div>
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertText", false, "\n");
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

  // Upload file
  const handleFileChange = (files) => {
    setImages(files);
    if (files) {
      const urls = Array.from(files).map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...urls]);
    }
  };

  // Nhập URL ảnh
  const handleAddUrl = (e) => {
    e.preventDefault();
    const url = e.target.url.value.trim();
    if (url) {
      setImageUrls((prev) => [...prev, url]);
      setPreviewUrls((prev) => [...prev, url]);
      e.target.reset();
    }
  };

  // Xóa ảnh khỏi preview
  const handleRemoveImage = (url) => {
    setPreviewUrls((prev) => prev.filter((u) => u !== url));
    setImageUrls((prev) => prev.filter((u) => u !== url));
    if (images) {
      const remainingFiles = Array.from(images).filter(
        (file) => URL.createObjectURL(file) !== url
      );
      setImages(remainingFiles.length > 0 ? remainingFiles : null);
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append(
      "content",
      content.trim() === "Bạn đang nghĩ gì?" ? "" : content
    );

    // file ảnh
    if (images) {
      Array.from(images).forEach((file) => {
        formData.append("images", file);
      });
    }

    // url ảnh
    if (imageUrls.length > 0) {
      imageUrls.forEach((url) => {
        formData.append("imageUrls", url);
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
      setImageUrls([]);
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

      {/* Upload file */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileChange(e.target.files)}
        className="file-input"
      />

      {/* Nhập URL ảnh */}
      <form onSubmit={handleAddUrl} className="url-input-form">
        <input
          type="text"
          name="url"
          placeholder="Dán link ảnh (https://...)"
          className="url-input"
        />
        <button type="submit" className="add-url-btn">
          Thêm ảnh
        </button>
      </form>

      {/* Preview ảnh */}
      {previewUrls.length > 0 && (
        <div
          className={`preview-grid ${
            previewUrls.length === 1 ? "single" : "multi"
          }`}
        >
          {previewUrls.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt={`preview-${i}`} />
              <button
                type="button"
                className="remove-btn"
                onClick={() => handleRemoveImage(url)}
              >
                ✕
              </button>
            </div>
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

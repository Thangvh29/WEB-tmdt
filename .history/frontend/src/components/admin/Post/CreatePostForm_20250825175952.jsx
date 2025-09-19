import { useState } from "react";
import api from "../../../services/axios";

const CreatePostForm = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleFileChange = (files: FileList | null) => {
    setImages(files);
    if (files) {
      const urls = Array.from(files).map((file) =>
        URL.createObjectURL(file)
      );
      setPreviewUrls(urls);
    } else {
      setPreviewUrls([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);

    if (images) {
      Array.from(images).forEach((file) => {
        formData.append("images", file);
      });
    }

    try {
      const res = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Post created:", res.data);

      // reset form sau khi tạo thành công
      setTitle("");
      setContent("");
      setImages(null);
      setPreviewUrls([]);
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 w-full"
      />
      <textarea
        placeholder="Post content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileChange(e.target.files)}
      />

      {/* Preview ảnh */}
      {previewUrls.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {previewUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt="preview"
              className="w-24 h-24 object-cover rounded"
            />
          ))}
        </div>
      )}

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Create Post
      </button>
    </form>
  );
};

export default CreatePostForm;

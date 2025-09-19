import { useState, useEffect } from "react";
import api from "../../services/axios"; 
import { Button } from "../ui/button";

const ProfileForm = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    avatar: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error"); // "success" or "error"

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log("🔍 ProfileForm - Fetching admin profile...");
        
        const { data } = await api.get("/admin/profile/me");
        console.log("✅ ProfileForm - Profile data:", data);
        
        setForm({
          name: data.profile.name || "",
          email: data.profile.email || "",
          phone: data.profile.phone || "",
          address: data.profile.address || "",
          avatar: data.profile.avatar || "",
        });
        
        setMessage("");
      } catch (err) {
        console.error("❌ ProfileForm - Cannot fetch admin profile:", err);
        console.error("❌ ProfileForm - Error response:", err.response?.data);
        console.error("❌ ProfileForm - Error status:", err.response?.status);
        
        if (err.response?.status === 404) {
          setMessage("Route admin profile không tồn tại. Kiểm tra backend routes.");
        } else if (err.response?.status === 403) {
          setMessage("Không có quyền truy cập. Chỉ admin mới có thể xem profile này.");
        } else if (err.response?.status === 401) {
          setMessage("Chưa đăng nhập hoặc token hết hạn. Vui lòng đăng nhập lại.");
        } else {
          setMessage("Không thể load profile. Vui lòng thử lại.");
        }
        setMessageType("error");
      }
    };
    
    fetchProfile();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  
  const handleAvatarChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      // Tạo preview URL
      const previewUrl = URL.createObjectURL(file);
      setForm({ ...form, avatar: previewUrl });
      console.log("📸 Selected avatar file:", file.name, file.type, file.size);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      console.log("🔄 ProfileForm - Updating profile...");
      console.log("🔄 ProfileForm - Form data:", form);
      console.log("🔄 ProfileForm - Avatar file:", avatarFile ? avatarFile.name : 'No file');
      
      // Luôn sử dụng FormData để khớp với backend route expect multer
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("address", form.address);
      
      // Chỉ append file nếu có file mới
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      // Log FormData content
      console.log("📦 Sending FormData with keys:", Array.from(formData.keys()));

      const { data } = await api.put("/admin/profile/me", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
        },
      });
      
      console.log("✅ ProfileForm - Update response:", data);
      
      setMessage(data.message || "Cập nhật thành công");
      setMessageType("success");
      
      // Reset avatar file và update form với avatar mới từ server
      setAvatarFile(null);
      if (data.profile?.avatar) {
        setForm(prev => ({ ...prev, avatar: data.profile.avatar }));
      }
      
    } catch (err) {
      console.error("❌ ProfileForm - Update error:", err);
      console.error("❌ ProfileForm - Error response:", err.response?.data);
      console.error("❌ ProfileForm - Error status:", err.response?.status);
      
      let errorMsg = "Cập nhật thất bại";
      
      if (err.response?.status === 400) {
        // Validation errors
        const errors = err.response.data.errors;
        if (errors && errors.length > 0) {
          errorMsg = errors.map(e => e.msg).join(', ');
        } else {
          errorMsg = err.response.data.message || errorMsg;
        }
      } else if (err.response?.status === 413) {
        errorMsg = "File quá lớn. Tối đa 5MB.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      setMessage(errorMsg);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">🔧 Quản lý profile admin</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${
          messageType === "success" 
            ? "bg-green-100 border border-green-400 text-green-700" 
            : "bg-red-100 border border-red-400 text-red-700"
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative">
            <img
              src={form.avatar || "/default-avatar.png"}
              alt="Admin Avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
            {avatarFile && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
          <label className="mt-2 cursor-pointer bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
            📸 Chọn ảnh mới
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange} 
              className="hidden"
            />
          </label>
          {avatarFile && (
            <p className="text-xs text-gray-600 mt-1">
              File: {avatarFile.name} ({(avatarFile.size / 1024 / 1024).toFixed(2)}MB)
            </p>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên admin:</label>
            <input 
              type="text" 
              name="name" 
              placeholder="Nhập tên admin" 
              value={form.name} 
              onChange={handleChange} 
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-blue-500" 
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email:</label>
            <input 
              type="email" 
              name="email" 
              placeholder="admin@example.com" 
              value={form.email} 
              onChange={handleChange} 
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-blue-500" 
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Số điện thoại:</label>
            <input 
              type="text" 
              name="phone" 
              placeholder="0123456789" 
              value={form.phone} 
              onChange={handleChange} 
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-blue-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Địa chỉ:</label>
            <textarea 
              name="address" 
              placeholder="Nhập địa chỉ" 
              value={form.address} 
              onChange={handleChange} 
              className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:border-blue-500" 
              rows={3}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full mt-4"
        >
          {loading ? "⏳ Đang cập nhật..." : "💾 Cập nhật profile"}
        </Button>
      </form>
    </div>
  );
};

export default ProfileForm;
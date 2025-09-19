# Web Thương Mại Điện Tử

Dự án web bán đồ điện tử gồm 2 phần: **Frontend** (React + Vite + Tailwind) và **Backend** (Node.js + Express + MongoDB).

---

## 🚀 Cài đặt & Chạy dự án

### 1. Clone repository
```bash
git clone https://github.com/Thangvh29/WEB-tmdt.git
cd WEB-tmdt
cd frontend

# Cài đặt dependencies
npm install

# Chạy ở chế độ dev
npm run dev
cd backend

# Cài đặt dependencies
npm install

# Chạy server ở chế độ dev
npm run dev
PORT=3000
MONGO_URI=mongodb://localhost:27017/tmdt
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_fb_client_id
FACEBOOK_CLIENT_SECRET=your_fb_client_secret

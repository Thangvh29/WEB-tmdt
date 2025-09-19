// src/pages/admin/SocialManagementPage.jsx
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs'; // Giả sử dùng Radix UI cho tabs, hoặc dùng Ant Design/MUI
import AdminPostsPage from './AdminPostsPage';
import UserPostsManagementPage from './UserPostsManagementPage';
import '../../assets/style/social-admin.css'; // Style cho tabs và layout

const SocialManagementPage = () => {
  const [activeTab, setActiveTab] = useState('admin-posts');

  return (
    <div className="social-management-page">
      <h1>Quản lý mạng xã hội</h1>
      <Tabs defaultValue="admin-posts" onValueChange={setActiveTab}>
        <TabsList className="social-tabs-list">
          <TabsTrigger value="admin-posts">Đăng bài</TabsTrigger>
          <TabsTrigger value="user-posts">Quản lý bài viết</TabsTrigger>
        </TabsList>
        <TabsContent value="admin-posts">
          <AdminPostsPage />
        </TabsContent>
        <TabsContent value="user-posts">
          <UserPostsManagementPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialManagementPage;
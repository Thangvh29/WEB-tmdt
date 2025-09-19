// src/pages/admin/SocialManagementPage.jsx
import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import AdminPostsPage from "./AdminPostsPage";
import UserPostsManagementPage from "./UserPostsManagementPage";
import "../../assets/style/social-admin.css";


const SocialManagementPage = () => {
  const [activeTab, setActiveTab] = useState("admin-posts");

  return (
    <div className="social-management-page space-y-4">
      <h1 className="text-2xl font-semibold">Quản lý mạng xã hội</h1>
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="social-tabs-list">
          <Tabs.Trigger value="admin-posts">Đăng bài</Tabs.Trigger>
          <Tabs.Trigger value="user-posts">Quản lý bài viết</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="admin-posts">
          <AdminPostsPage />
        </Tabs.Content>
        <Tabs.Content value="user-posts">
          <UserPostsManagementPage />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default SocialManagementPage;

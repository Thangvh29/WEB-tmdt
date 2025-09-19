// src/pages/admin/SocialManagementPage.jsx
import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import AdminPostsPage from "./AdminPostsPage";
import UserPostsManagementPage from "./UserPostsManagementPage";
import "../../assets/style/social-admin.css";
import "../../assets/style/admin-products.css";
import "../../assets/style/product-list.css";
import "../../assets/style/inventory-admin.css";

const SocialManagementPage = () => {
  const [activeTab, setActiveTab] = useState("admin-posts");

  return (
    <div className="social-management-page space-y-4">
      <h1 className="text-2xl font-semibold text-[#1877f2]">Quản lý mạng xã hội</h1> {/* Màu blue FB */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="social-tabs-list border-b border-gray-200">
          <Tabs.Trigger value="admin-posts" className="tab px-4 py-2 text-[#1877f2] font-medium">Đăng bài</Tabs.Trigger> {/* Style giống tab FB */}
          <Tabs.Trigger value="user-posts" className="tab px-4 py-2 text-[#1877f2] font-medium">Quản lý bài viết</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="admin-posts" className="pt-4">
          <AdminPostsPage />
        </Tabs.Content>
        <Tabs.Content value="user-posts" className="pt-4">
          <UserPostsManagementPage />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default SocialManagementPage;
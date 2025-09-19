// src/pages/admin/UserManagement.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import UserTable from "../../components";
import UserForm from "../components/admin/UserForm";

const API_URL = "http://localhost:5000/api/admin/users";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (data) => {
    try {
      await axios.patch(`${API_URL}/${editingUser._id}`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setShowForm(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await axios.post(`${API_URL}/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Quản lý người dùng</h1>
      <UserTable
        users={users}
        onEdit={(u) => {
          setEditingUser(u);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        onRestore={handleRestore}
      />

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <UserForm
            user={editingUser}
            onSubmit={handleUpdate}
            onClose={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
};

export default UserManagement;

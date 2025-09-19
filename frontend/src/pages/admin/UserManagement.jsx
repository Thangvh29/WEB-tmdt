// src/pages/admin/UserManagement.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import UserTable from "../../components/admin/UserTable";
import UserForm from "../../components/admin/UserForm";

const API_URL = "http://localhost:5000/api/admin/users";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (data) => {
    try {
      setLoading(true);
      if (editingUser) {
        await axios.patch(`${API_URL}/${editingUser._id}`, data, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      } else {
        await axios.post(API_URL, data, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      }
      closeForm();
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
      await axios.post(
        `${API_URL}/${id}/restore`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEdit = (u) => {
    setEditingUser(u);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingUser(null);
    setShowForm(false);
  };

  return (
    <div className="container py-3">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h1 className="h5 mb-0">Quản lý người dùng</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingUser(null);
            setShowForm(true);
          }}
        >
          Thêm người dùng
        </button>
      </div>

      {/* User table */}
      <div className="table-responsive">
        <UserTable
          users={users}
          onEdit={openEdit}
          onDelete={handleDelete}
          onRestore={handleRestore}
        />
      </div>

      {/* Modal Bootstrap */}
      {showForm && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-body">
                <UserForm
                  user={editingUser}
                  onSubmit={handleUpdate}
                  onClose={closeForm}
                  submitting={loading}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

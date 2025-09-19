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
      if (editingUser) {
        await axios.patch(`${API_URL}/${editingUser._id}`, data, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      } else {
        await axios.post(API_URL, data, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="d-flex justify-content-between align-items-center mb-3">
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

      <UserTable users={users} onEdit={openEdit} onDelete={handleDelete} onRestore={handleRestore} />

      {showForm && (
        <>
          <div className="modal-backdrop-custom" onClick={closeForm}></div>

          <div className="modal-custom" role="dialog" aria-modal="true">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-body p-3">
                  <UserForm user={editingUser} onSubmit={handleUpdate} onClose={closeForm} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;

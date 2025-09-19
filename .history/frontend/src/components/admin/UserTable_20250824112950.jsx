// src/components/admin/UserTable.jsx
import { Pencil, Trash2, RotateCcw } from "lucide-react";

const UserTable = ({ users = [], onEdit, onDelete, onRestore }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th style={{ width: 72 }}>Avatar</th>
            <th>Tên</th>
            <th>Email</th>
            <th>SĐT</th>
            <th>Địa chỉ</th>
            <th>Trạng thái</th>
            <th style={{ width: 160 }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((u) => (
              <tr key={u._id}>
                <td>
                  <img
                    src={u.avatar || "/default-avatar.png"}
                    alt="avatar"
                    className="rounded-circle avatar-sm"
                  />
                </td>
                <td style={{ minWidth: 140 }}>{u.name}</td>
                <td style={{ minWidth: 180 }}>{u.email}</td>
                <td>{u.phone}</td>
                <td>{u.address}</td>
                <td>
                  {u.isActive ? (
                    <span className="badge bg-success">Hoạt động</span>
                  ) : (
                    <span className="badge bg-danger">Bị khóa</span>
                  )}
                </td>
                <td>
                  <div className="actions-group">
                    <button
                      onClick={() => onEdit(u)}
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                      title="Sửa"
                    >
                      <Pencil size={14} />
                      <span className="d-none d-sm-inline">Sửa</span>
                    </button>

                    {u.isActive ? (
                      <button
                        onClick={() => onDelete(u._id)}
                        className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                        <span className="d-none d-sm-inline">Xóa</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onRestore(u._id)}
                        className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                        title="Khôi phục"
                      >
                        <RotateCcw size={14} />
                        <span className="d-none d-sm-inline">Khôi phục</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-muted text-center py-4">
                Không có người dùng nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;

// src/components/admin/UserTable.jsx
import { useEffect, useState } from "react";
import { Pencil, Trash2, RotateCcw } from "lucide-react";

/**
 * Responsive UserTable:
 * - >= 576px: show table inside .table-responsive, hide some columns on xs
 * - < 576px: render card list for better mobile UX
 */
const UserTable = ({ users = [], onEdit, onDelete, onRestore }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 575.98px)");
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Card view for mobile
  if (isMobile) {
    return (
      <div className="d-flex flex-column gap-2">
        {users.length > 0 ? (
          users.map((u) => (
            <div key={u._id} className="card shadow-sm">
              <div className="card-body d-flex gap-3 align-items-start">
                <img
                  src={u.avatar || "/default-avatar.png"}
                  alt="avatar"
                  style={{ width: 56, height: 56, objectFit: "cover", borderRadius: '50%' }}
                />

                <div style={{ flex: 1 }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-semibold">{u.name}</div>
                      <div className="text-muted small text-truncate" style={{ maxWidth: 220 }}>
                        {u.email}
                      </div>
                    </div>

                    <div className="text-end">
                      {u.isActive ? (
                        <span className="badge bg-success">Hoạt động</span>
                      ) : (
                        <span className="badge bg-danger">Bị khóa</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 d-flex gap-2">
                    <button
                      onClick={() => onEdit(u)}
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    >
                      <Pencil size={14} />
                      Sửa
                    </button>

                    {u.isActive ? (
                      <button
                        onClick={() => onDelete(u._id)}
                        className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                      >
                        <Trash2 size={14} />
                        Xóa
                      </button>
                    ) : (
                      <button
                        onClick={() => onRestore(u._id)}
                        className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                      >
                        <RotateCcw size={14} />
                        Khôi phục
                      </button>
                    )}
                  </div>

                  {/* Optional: show phone/address under actions on mobile */}
                  <div className="mt-2 small text-muted">
                    {u.phone && <div>SĐT: {u.phone}</div>}
                    {u.address && <div>Địa chỉ: {u.address}</div>}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted py-4">Không có người dùng nào</div>
        )}
      </div>
    );
  }

  // Table view for >= sm
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th style={{ width: 72 }}>Avatar</th>
            <th>Tên</th>
            <th className="d-none d-sm-table-cell">Email</th> {/* hide on xs */}
            <th className="d-none d-md-table-cell">SĐT</th>    {/* hide on sm/md */}
            <th className="d-none d-lg-table-cell">Địa chỉ</th> {/* hide until lg */}
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
                    className="rounded-circle"
                    style={{ width: 48, height: 48, objectFit: "cover" }}
                  />
                </td>

                <td style={{ minWidth: 140 }}>{u.name}</td>

                {/* Use text-truncate wrapper to avoid overflowing */}
                <td className="d-none d-sm-table-cell" style={{ maxWidth: 220 }}>
                  <div className="text-truncate" style={{ maxWidth: 220 }}>{u.email}</div>
                </td>

                <td className="d-none d-md-table-cell" style={{ maxWidth: 130 }}>
                  <div className="text-truncate" style={{ maxWidth: 130 }}>{u.phone}</div>
                </td>

                <td className="d-none d-lg-table-cell" style={{ maxWidth: 220 }}>
                  <div className="text-truncate" style={{ maxWidth: 220 }}>{u.address}</div>
                </td>

                <td>
                  {u.isActive ? (
                    <span className="badge bg-success">Hoạt động</span>
                  ) : (
                    <span className="badge bg-danger">Bị khóa</span>
                  )}
                </td>

                <td>
                  <div className="d-flex gap-2">
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

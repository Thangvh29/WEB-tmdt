// src/components/admin/UserTable.jsx
import { Pencil, Trash2, RotateCcw } from "lucide-react";

const UserTable = ({ users, onEdit, onDelete, onRestore }) => {
  return (
    <div className="overflow-x-auto">
      <table className="table-auto w-full border-collapse border border-gray-200 bg-white shadow-sm rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Avatar</th>
            <th className="border p-2">Tên</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">SĐT</th>
            <th className="border p-2">Địa chỉ</th>
            <th className="border p-2">Trạng thái</th>
            <th className="border p-2">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((u) => (
              <tr key={u._id} className="text-center">
                <td className="border p-2">
                  <img
                    src={u.avatar || "/default-avatar.png"}
                    alt="avatar"
                    className="w-10 h-10 rounded-full mx-auto"
                  />
                </td>
                <td className="border p-2">{u.name}</td>
                <td className="border p-2">{u.email}</td>
                <td className="border p-2">{u.phone}</td>
                <td className="border p-2">{u.address}</td>
                <td className="border p-2">
                  {u.isActive ? (
                    <span className="text-green-600 font-medium">Hoạt động</span>
                  ) : (
                    <span className="text-red-600 font-medium">Bị khóa</span>
                  )}
                </td>
                <td className="border p-2 flex justify-center gap-2">
                  {/* Nút sửa */}
                  <button
                    onClick={() => onEdit(u)}
                    className="p-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                  >
                    <Pencil size={16} />
                  </button>

                  {/* Nếu user đang hoạt động thì có nút xóa, ngược lại thì nút khôi phục */}
                  {u.isActive ? (
                    <button
                      onClick={() => onDelete(u._id)}
                      className="p-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => onRestore(u._id)}
                      className="p-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="p-4 text-gray-500">
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

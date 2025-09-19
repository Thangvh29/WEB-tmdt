// src/pages/admin/PaymentHistoryPage.jsx
import { useEffect, useState } from "react";
import api from "../../services/axios";
import dayjs from "dayjs";

const PaymentHistoryPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchPayments = async (pageNum = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/payments/history/list", {
        params: { page: pageNum, limit },
      });
      setPayments(data.payments);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      console.error("Lỗi khi lấy lịch sử thanh toán:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handlePrev = () => {
    if (page > 1) fetchPayments(page - 1);
  };

  const handleNext = () => {
    if (page * limit < total) fetchPayments(page + 1);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Lịch sử thanh toán</h2>

      {loading ? (
        <p>Đang tải...</p>
      ) : payments.length === 0 ? (
        <p>Không có giao dịch nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Ảnh sản phẩm</th>
                <th className="px-4 py-2 border">Tên sản phẩm</th>
                <th className="px-4 py-2 border">Người mua</th>
                <th className="px-4 py-2 border">Email / SĐT</th>
                <th className="px-4 py-2 border">Địa chỉ</th>
                <th className="px-4 py-2 border">Số lượng</th>
                <th className="px-4 py-2 border">Đơn giá</th>
                <th className="px-4 py-2 border">Thành tiền</th>
                <th className="px-4 py-2 border">Thời gian</th>
                <th className="px-4 py-2 border">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={`${p.paymentId}-${p.product._id}`} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">
                    {p.product.image ? (
                      <img
                        src={p.product.image}
                        alt={p.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm">
                        No Image
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 border">{p.product.name}</td>
                  <td className="px-4 py-2 border flex items-center gap-2">
                    {p.user.avatar && (
                      <img
                        src={p.user.avatar}
                        alt={p.user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <span>{p.user.name}</span>
                  </td>
                  <td className="px-4 py-2 border">
                    <div>{p.user.email}</div>
                    <div>{p.user.phone || "-"}</div>
                  </td>
                  <td className="px-4 py-2 border">{p.user.address || "-"}</td>
                  <td className="px-4 py-2 border text-center">{p.quantity}</td>
                  <td className="px-4 py-2 border text-right">{p.unitPrice.toLocaleString()} đ</td>
                  <td className="px-4 py-2 border text-right">{p.amount.toLocaleString()} đ</td>
                  <td className="px-4 py-2 border">{dayjs(p.paidAt).format("DD/MM/YYYY HH:mm")}</td>
                  <td className="px-4 py-2 border capitalize">{p.paymentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > limit && (
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={handlePrev}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-2 py-1">
            {page} / {Math.ceil(total / limit)}
          </span>
          <button
            onClick={handleNext}
            disabled={page * limit >= total}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryPage;

import { useState, useEffect } from "react";
import api from "../../../services/axios";

const PaymentHistoryTab = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get("/user/payments");
        setPayments(data.data || []);
      } catch (err) {
        console.error("Lỗi khi lấy lịch sử thanh toán:", err);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div>
      {payments.map((p) => (
        <div key={p.id} className="border p-3 mb-2 rounded">
          <div className="flex justify-between">
            <div>
              <div className="font-semibold">{p.method}</div>
              <div className="text-sm text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{p.amount.toLocaleString()} đ</div>
              <div className={`text-sm ${p.status === "success" ? "text-green-600" : "text-red-600"}`}>
                {p.status}
              </div>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {p.items.map((i) => i.name).join(", ")}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentHistoryTab;

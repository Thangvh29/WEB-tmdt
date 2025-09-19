import { useState } from "react";
import PaymentTab from "../../components/user/payment/PaymentTab";
import PaymentHistoryTab from "../../components/use";

const PaymentPage = () => {
  const [activeTab, setActiveTab] = useState("payment");

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex gap-4 border-b mb-4">
        <button
          onClick={() => setActiveTab("payment")}
          className={`pb-2 ${activeTab === "payment" ? "border-b-2 border-blue-500 font-semibold" : ""}`}
        >
          Thanh toán
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-2 ${activeTab === "history" ? "border-b-2 border-blue-500 font-semibold" : ""}`}
        >
          Lịch sử
        </button>
      </div>

      {/* Nội dung tab */}
      {activeTab === "payment" ? <PaymentTab /> : <PaymentHistoryTab />}
    </div>
  );
};

export default PaymentPage;

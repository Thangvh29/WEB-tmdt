// src/pages/user/Cart.jsx
import { useEffect, useState, useMemo } from "react";
import api, { backendURL } from "../../services/axios";
import { toImageURL } from "../../utils/image";

const Cart = () => {
  const [cart, setCart] = useState({ items: [], totalQty: 0, totalEstimated: 0 });
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/user/cart");
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const handleQtyChange = async (item, qty) => {
    if (qty < 1) return;
    await api.patch(`/user/cart/${item.product}`, {
      variant: item.variant,
      quantity: qty,
    });
    loadCart();
  };

  const handleRemove = async (item) => {
    await api.delete(`/user/cart/${item.product}`, {
      data: { variant: item.variant },
    });
    loadCart();
  };

  const totalSelected = useMemo(() => {
    return cart.items
      .filter((it) => selected[it.product])
      .reduce((sum, it) => sum + it.total, 0);
  }, [cart, selected]);

  const handleCheckout = async () => {
    const items = cart.items.filter((it) => selected[it.product]);
    if (!items.length) return alert("Vui lòng chọn sản phẩm trước khi mua");

    try {
      await api.post("/user/cart/checkout", {
        shippingAddress: "Địa chỉ mặc định",
        phone: "0123456789",
        email: "user@example.com",
        paymentMethod: "cod",
      });
      alert("Đặt hàng thành công!");
      loadCart();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi đặt hàng");
    }
  };

  return (
    <div className="p-4 pb-28 bg-gray-50 min-h-screen">
  <h1 className="text-xl font-bold mb-4">🛒 Giỏ hàng của bạn</h1>

  {loading ? (
    <div className="text-gray-500">Đang tải giỏ hàng...</div>
  ) : cart.items.length === 0 ? (
    <div className="text-center py-10 text-gray-500">
      Giỏ hàng trống
    </div>
  ) : (
    <div className="space-y-3">
      {cart.items.map((it) => (
        <div
          key={it.product + (it.variant || "")}
          className="flex items-center gap-3 bg-white border rounded-lg shadow-sm p-3"
        >
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={!!selected[it.product]}
            onChange={() => toggleSelect(it.product)}
            disabled={!it.available}
            className="w-4 h-4 accent-red-600"
          />

          {/* Image */}
          <img
            src={toImageURL(it.image)}
            alt={it.name}
            className="w-20 h-20 object-cover rounded-md border"
          />

          {/* Info */}
          <div className="flex-1">
            <div className="font-semibold text-sm line-clamp-2">
              {it.name}
            </div>
            <div className="mt-1 text-red-600 font-bold">
              {it.available
                ? `${it.unitPrice?.toLocaleString("vi-VN")} đ`
                : <span className="text-gray-400">Hết hàng</span>}
            </div>

            {/* Quantity */}
            {it.available && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  className="px-2 py-1 border rounded text-gray-600 hover:bg-gray-100"
                  onClick={() => handleQtyChange(it, it.quantity - 1)}
                  disabled={it.quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  value={it.quantity}
                  onChange={(e) =>
                    handleQtyChange(it, Number(e.target.value))
                  }
                  className="w-14 text-center border rounded"
                />
                <button
                  className="px-2 py-1 border rounded text-gray-600 hover:bg-gray-100"
                  onClick={() => handleQtyChange(it, it.quantity + 1)}
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Remove */}
          <button
            className="text-sm text-red-500 hover:underline"
            onClick={() => handleRemove(it)}
          >
            Xóa
          </button>
        </div>
      ))}
    </div>
  )}

  {/* Bottom Bar */}
  <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4 flex items-center justify-between">
    <div>
      <div className="text-sm">
        Tổng tiền:{" "}
        <span className="text-red-600 font-bold text-lg">
          {totalSelected.toLocaleString("vi-VN")} đ
        </span>
      </div>
    </div>
    <button
      className="bg-red-600 hover:bg-red-700 transition text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
      disabled={!totalSelected}
      onClick={handleCheckout}
    >
      Mua hàng
    </button>
  </div>
</div>

  );
};

export default Cart;

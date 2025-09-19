// src/pages/user/Cart.jsx
import { useEffect, useState, useMemo } from "react";
import api, { backendURL } from "../../services/axios";
import { toImageURL } from "../../utils/imageUrl";

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
    await api.put("/user/cart/${item.product}", {
      productId: item.product,
      variant: item.variant,
      quantity: qty,
    });
    loadCart();
  };

  const handleRemove = async (item) => {
    await api.delete("/user/cart/${item.product}", {
      data: {
        productId: item.product,
        variant: item.variant,
      },
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
    <div className="p-4 pb-24">
      <h1 className="text-lg font-semibold mb-4">Giỏ hàng của bạn</h1>

      {loading ? (
        <div>Đang tải giỏ hàng...</div>
      ) : cart.items.length === 0 ? (
        <div>Giỏ hàng trống</div>
      ) : (
        <div className="space-y-3">
          {cart.items.map((it) => (
            <div
              key={it.product + (it.variant || "")}
              className="flex items-center gap-3 border p-3 rounded-md relative"
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={!!selected[it.product]}
                onChange={() => toggleSelect(it.product)}
                disabled={!it.available}
              />

              {/* Image */}
              <img
                src={toImageURL(it.image)}
                alt={it.name}
                className="w-16 h-16 object-cover rounded"
              />

              {/* Info */}
              <div className="flex-1">
                <div className="font-medium text-sm">{it.name}</div>
                <div className="text-xs text-gray-500">
                  {it.available ? (
                    <span>{it.unitPrice?.toLocaleString("vi-VN")} đ</span>
                  ) : (
                    <span className="text-red-500">Hết hàng</span>
                  )}
                </div>

                {/* Quantity */}
                {it.available && (
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      className="px-2 border rounded"
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
                      className="px-2 border rounded"
                      onClick={() => handleQtyChange(it, it.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* Remove */}
              <button
                className="text-red-500 text-sm"
                onClick={() => handleRemove(it)}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow p-4 flex items-center justify-between">
        <div>
          <div className="text-sm">
            Tổng tiền:{" "}
            <span className="text-red-600 font-semibold">
              {totalSelected.toLocaleString("vi-VN")} đ
            </span>
          </div>
        </div>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
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

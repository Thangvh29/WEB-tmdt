// src/pages/user/Cart.jsx
import { useEffect, useState, useMemo } from "react";
import api from "../../services/axios";
import { toImageURL } from "../../utils/image";
import "../../assets/style/cart.css"; // ✅ thêm dòng này

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
      // đồng bộ select (mặc định: chọn tất cả hàng còn hàng)
      const init = {};
      data.items.forEach(it => { init[it.product] = !!it.available; });
      setSelected(init);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const allSelectableIds = cart.items.filter(it => it.available).map(it => it.product);
  const allSelected = allSelectableIds.length > 0 && allSelectableIds.every(id => selected[id]);
  const toggleSelectAll = () => {
    const next = { ...selected };
    const target = !allSelected;
    allSelectableIds.forEach(id => { next[id] = target; });
    setSelected(next);
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

  const selectedCount = useMemo(() => {
    return cart.items.filter((it) => selected[it.product]).length;
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
    <div className="cart-page">
      <h1 className="cart-title">Giỏ hàng của bạn</h1>

      {loading ? (
        <div className="cart-loading">Đang tải giỏ hàng...</div>
      ) : cart.items.length === 0 ? (
        <div className="cart-empty">Giỏ hàng trống</div>
      ) : (
        <>
          {/* Header columns */}
          <div className="cart-header row">
            <div className="col chk">
              <label className="chk-all">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
                <span>Chọn tất cả</span>
              </label>
            </div>
            <div className="col product">Sản phẩm</div>
            <div className="col price">Đơn giá</div>
            <div className="col qty">Số lượng</div>
            <div className="col subtotal">Tạm tính</div>
            <div className="col action">Thao tác</div>
          </div>

          {/* Items */}
          <div className="cart-list">
            {cart.items.map((it) => {
              const isChecked = !!selected[it.product];
              return (
                <div
                  key={it.product + (it.variant || "")}
                  className={`cart-item ${!it.available ? "disabled" : ""}`}
                >
                  <div className="col chk">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(it.product)}
                      disabled={!it.available}
                    />
                  </div>

                  <div className="col product">
                    <img
                      src={toImageURL(it.image)}
                      alt={it.name}
                      className="thumb"
                    />
                    <div className="info">
                      <div className="name">{it.name}</div>
                      {it.variantName ? (
                        <div className="variant">{it.variantName}</div>
                      ) : null}
                      {!it.available && <div className="badge-out">Hết hàng</div>}
                    </div>
                  </div>

                  <div className="col price">
                    {it.available ? (
                      <span className="price-value">
                        {it.unitPrice?.toLocaleString("vi-VN")} đ
                      </span>
                    ) : (
                      <span className="price-disabled">—</span>
                    )}
                  </div>

                  <div className="col qty">
                    {it.available ? (
                      <div className="qty-control">
                        <button
                          className="btn-qty"
                          onClick={() => handleQtyChange(it, it.quantity - 1)}
                          disabled={it.quantity <= 1}
                          aria-label="Giảm"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={it.quantity}
                          onChange={(e) => handleQtyChange(it, Number(e.target.value))}
                          className="qty-input"
                          min={1}
                        />
                        <button
                          className="btn-qty"
                          onClick={() => handleQtyChange(it, it.quantity + 1)}
                          aria-label="Tăng"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="price-disabled">—</span>
                    )}
                  </div>

                  <div className="col subtotal">
                    <span className="subtotal-value">
                      {it.total?.toLocaleString("vi-VN")} đ
                    </span>
                  </div>

                  <div className="col action">
                    <button className="btn-remove" onClick={() => handleRemove(it)}>
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom bar */}
          <div className="cart-bottom">
            <div className="left">
              <label className="chk-all">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
                <span>Chọn tất cả ({selectedCount})</span>
              </label>
            </div>
            <div className="right">
              <div className="summary">
                Tổng tiền:
                <span className="total">
                  {totalSelected.toLocaleString("vi-VN")} đ
                </span>
              </div>
              <button
                className="btn-checkout"
                disabled={!totalSelected}
                onClick={handleCheckout}
              >
                Mua hàng
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;

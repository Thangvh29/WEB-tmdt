// src/pages/user/ProductDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/axios";
import Reviews from "../../components/user/Reviews";
import { getImageUrl } from "../../utils/image";
import "../../assets/style/product-detail.css";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [attributes, setAttributes] = useState({});
  const [canBuy, setCanBuy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/user/products/${id}`);
      setProduct(data.product);
      setCanBuy(data.canBuy);

      if (data.product?.images?.length > 0) {
        setActiveImage(getImageUrl(data.product.images[0]));
      }

      if (data.product?.variants?.length > 0) {
        const def = data.product.variants.find((v) => v.isDefault);
        setSelectedVariant(def || data.product.variants[0]);
      }
    } catch (err) {
      setError("Không tìm thấy sản phẩm");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAttributeChange = async (name, value) => {
    const newAttrs = { ...attributes, [name]: value };
    setAttributes(newAttrs);

    try {
      const { data } = await api.post(`/user/products/${id}/check-variant`, {
        attributes: newAttrs,
      });
      setSelectedVariant(data.found ? data.variant : null);
    } catch (err) {
      console.error("Error checking variant:", err);
    }
  };

  const handleAddToCart = async () => {
    if (!canBuy || !selectedVariant?._id || !selectedVariant?.stock) return;
    try {
      await api.post("/user/cart", {
        productId: id,
        variantId: selectedVariant._id,
        quantity: 1,
      });
      alert("Đã thêm vào giỏ hàng");
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuyNow = () => {
    if (!canBuy || !selectedVariant?._id || !selectedVariant?.stock) return;
    navigate("/user/payment", {
      state: { productId: id, variantId: selectedVariant._id },
    });
  };

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>{error}</p>;
  if (!product) return null;

  const inStock = (selectedVariant?.stock || product.stock) > 0;
  const price = selectedVariant?.price || product.price;

  return (
    <div className="product-detail-page">
      <h1>{product.name}</h1>

      {/* Gallery */}
      <div className="product-gallery">
        {activeImage && (
          <img src={activeImage} alt={product.name} className="main-image" />
        )}
        <div className="thumbnails">
          {product.images?.map((img, idx) => (
            <img
              key={idx}
              src={getImageUrl(img)}
              alt={`${product.name} ${idx}`}
              className={`thumb ${activeImage === getImageUrl(img) ? "active" : ""}`}
              onClick={() => setActiveImage(getImageUrl(img))}
            />
          ))}
        </div>
      </div>

      {/* Info */}
      <p>{product.description}</p>
      <p className="price">Giá: {Number(price).toLocaleString()} VND</p>
      <p>
        Trạng thái:{" "}
        <span className={inStock ? "text-success" : "text-danger"}>
          {inStock ? "Còn hàng" : "Hết hàng"}
        </span>
      </p>

      {/* Variants */}
      {product.variants?.length > 0 && (
        <div className="variants">
          {[...new Set(product.variants.flatMap((v) =>
            v.attributes.map((a) => a.name)
          ))].map((name) => (
            <div key={name}>
              <label>{name}:</label>
              <select
                value={attributes[name] || ""}
                onChange={(e) => handleAttributeChange(name, e.target.value)}
              >
                <option value="">Chọn</option>
                {[...new Set(
                  product.variants
                    .flatMap((v) =>
                      v.attributes.filter((a) => a.name === name).map((a) => a.value)
                    )
                )].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="actions" style={{ position: "fixed", bottom: 0 }}>
        {inStock && canBuy ? (
          <>
            <button onClick={handleBuyNow}>Mua ngay / Trả góp</button>
            <button onClick={handleAddToCart}>Thêm vào giỏ hàng</button>
          </>
        ) : (
          <p>Hết hàng</p>
        )}
      </div>

      {/* Reviews */}
      <Reviews productId={id} />
    </div>
  );
};

export default ProductDetailPage;

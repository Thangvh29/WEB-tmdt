// src/pages/admin/InventoryPage.jsx
import { useState, useEffect } from 'react';
import api from '../../services/axios'; // Giả sử bạn có axios instance với auth
import ProductInventoryCard from '../../components/admin/ProductInventoryCard';
import '../../assets/style/inventory-admin.css'; // Style riêng nếu cần

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Có thể thêm filter/search sau

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data } = await api.get('/admin/inventory/list', {
          params: { page, limit, stockStatus: '' }, // Có thể thêm name, brand, stockStatus
        });
        setProducts(data.products || []);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải danh sách kho hàng');
        setLoading(false);
        if (err.response?.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = '/login';
        }
      }
    };
    fetchInventory();
  }, [page]);

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>Lỗi: {error}</p>;

  return (
    <div className="inventory-page">
      <h1>Quản lý kho hàng</h1>
      <div className="inventory-grid"> {/* Grid layout, ví dụ Tailwind: grid grid-cols-3 gap-4 */}
        {products.map((product) => (
          <ProductInventoryCard key={product._id} product={product} onUpdate={fetchInventory} />
        ))}
      </div>
      {/* Pagination simple */}
      <div className="pagination">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</button>
        <span>Trang {page}</span>
        <button onClick={() => setPage((p) => p + 1)}>Sau</button>
      </div>
    </div>
  );
};

export default InventoryPage;
import React, { useEffect, useState } from "react";
import ProductCard from "../../components/auth/ProductCard";
import Filters from "../../components/auth/Filters";
import api from "../../services/axios";
import Navbar from "./Navbar";
import Footer from "../../components/public/Footer";
import "../../assets/style/home.css";

const Home = () => {
  const [filters, setFilters] = useState({
    q: "",
    isNew: "",
    brand: "",
    type: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    sort: "newest",
    page: 1,
    limit: 12,
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products", { params: filters });
      setProducts(data.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  return (
    <>
      <Navbar />
      <div className="home-page container my-4">
        <Filters filters={filters} onFilterChange={setFilters} />

        {loading ? (
          <p>Đang tải sản phẩm...</p>
        ) : (
          <div className="products-grid row">
            {products.map((p) => (
              <div key={p._id} className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Home;

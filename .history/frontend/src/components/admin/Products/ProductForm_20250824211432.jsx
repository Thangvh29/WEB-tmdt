// src/components/admin/products/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/axios';
import ProductSpecsInput from './ProductSpecsInput';
import ProductCommitmentInput from './ProductCommitmentInput';
import ProductImageUpload from './ProductImageUpload';

const ProductForm = ({ productId = null, onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    type: 'laptop',
    category: '',
    images: [],
    price: 0,
    sellPrice: [],
    specifications: [],
    commitments: [],
    description: '',
    isNewProduct: true,
    stock: 0,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState([]);

  // Fetch categories và product khi component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data);
      } catch (err) {
        console.error('Lỗi tải categories:', err);
        setMessage('⚠️ Lỗi tải danh mục, vui lòng thêm danh mục thủ công hoặc kiểm tra server');
        setCategories([]);
      }
    };
    fetchCategories();
    if (productId) fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/admin/products/${productId}`);
      setFormData({
        name: data.name || '',
        brand: data.brand || '',
        type: data.type || 'laptop',
        category: data.category?._id || '',
        images: data.images || [],
        price: data.price || 0,
        sellPrice: data.variants || [],
        specifications: data.specs || [],
        commitments: data.commitments || [],
        description: data.description || '',
        isNewProduct: data.isNewProduct ?? true,
        stock: data.stock || 0,
      });
    } catch (err) {
      console.error('Lỗi tải sản phẩm:', err);
      setMessage('⚠️ Lỗi tải sản phẩm');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'number' ? Number(value) : type === 'checkbox' ? checked : value 
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...formData.sellPrice];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, sellPrice: updated }));
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      sellPrice: [...prev.sellPrice, { version: '', color: '', price: 0, stock: 0, images: [] }],
    }));
  };

  const removeVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      sellPrice: prev.sellPrice.filter((_, i) => i !== index),
    }));
  };

  const handleSubm
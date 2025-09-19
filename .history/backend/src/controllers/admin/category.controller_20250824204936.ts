// src/controllers/category.controller.ts
import type { Request, Response, NextFunction } from 'express';
import Category from '../../models/'; // Tạo model này

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find().select('_id name'); // Chỉ lấy _id và name
    res.json(categories);
  } catch (err) {
    next(err);
  }
};
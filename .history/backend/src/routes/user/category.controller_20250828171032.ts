// src/controllers/user/category.controller.ts
import type  { Request, Response } from "express";
import Category from "../../models/category.model.js";

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ active: true }).lean();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error fetching categories" });
  }
};

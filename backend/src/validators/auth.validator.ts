import { body } from 'express-validator';

// Validation cho đăng ký
export const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Tên phải từ 2 đến 80 ký tự'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu phải ít nhất 8 ký tự'),
  body('phone')
    .optional()
    .matches(/^\d{10,11}$/)
    .withMessage('Số điện thoại phải có 10-11 chữ số'),
];

// Validation cho đăng nhập
export const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Email hoặc tên là bắt buộc'),
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu là bắt buộc'),
];
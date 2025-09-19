// src/routes/comment.routes.ts
import { Router } from "express";
import { body, param } from "express-validator";
import { createComment, updateComment, deleteComment, getCommentsByPost } from "../controllers/comment.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import validateRequest from "../middlewares/validateRequest.js";

const router = Router();

/**
 * @route   POST /api/comments/:postId
 * @desc    Create a new comment for a post
 * @access  Private (logged in users only)
 */
router.post(
  "/:postId",
  isAuthenticated,
  [
    param("postId").isMongoId().withMessage("Invalid post ID"),
    body("content").notEmpty().withMessage("Content is required"),
  ],
  validateRequest,
  createComment
);

/**
 * @route   GET /api/comments/:postId
 * @desc    Get all comments for a post
 * @access  Public
 */
router.get(
  "/:postId",
  [param("postId").isMongoId().withMessage("Invalid post ID")],
  validateRequest,
  getCommentsByPost
);

/**
 * @route   PUT /api/comments/:commentId
 * @desc    Update a comment (only author or admin)
 * @access  Private
 */
router.put(
  "/:commentId",
  isAuthenticated,
  [
    param("commentId").isMongoId().withMessage("Invalid comment ID"),
    body("content").notEmpty().withMessage("Content is required"),
  ],
  validateRequest,
  updateComment
);

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete a comment (only author or admin)
 * @access  Private
 */
router.delete(
  "/:commentId",
  isAuthenticated,
  [param("commentId").isMongoId().withMessage("Invalid comment ID")],
  validateRequest,
  deleteComment
);

export default router;

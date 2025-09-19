// src/components/ui/button.jsx
import React from "react";
import clsx from "clsx";

/**
 * Button component
 * Props:
 *  - variant: "primary" | "secondary" | "ghost" | "danger" (default: primary)
 *  - size: "sm" | "md" | "lg" | "icon" (default: md)
 *  - fullWidth: boolean (stretch to parent's width)
 *  - rounded: "none" | "sm" | "md" | "full" (default: "md")
 *  - ...props forwarded to <button>
 */
const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  rounded = "md",
  className,
  ...props
}) => {
  const base = "inline-flex items-center justify-center font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 focus:ring-gray-300",
    ghost: "bg-transparent text-gray-800 hover:bg-gray-100 focus:ring-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  }[variant];

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base",
    icon: "p-2",
  }[size];

  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    full: "rounded-full",
  }[rounded];

  const fullWidthClass = fullWidth ? "w-full" : "";

  const classes = clsx(base, variantClasses, sizeClasses, roundedClasses, fullWidthClass, className);

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export { Button };
export default Button;

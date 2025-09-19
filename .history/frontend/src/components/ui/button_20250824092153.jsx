// src/components/ui/button.jsx
import React from "react";
import clsx from "clsx";

const Button = ({ children, variant = "default", size = "default", ...props }) => {
  const baseStyle =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantStyle = clsx({
    "bg-blue-600 text-white hover:bg-blue-700": variant === "default",
    "border border-gray-300 text-gray-700 hover:bg-gray-100": variant === "outline",
    "bg-red-600 text-white hover:bg-red-700": variant === "destructive",
  });

  const sizeStyle = clsx({
    "px-4 py-2 text-sm": size === "default",
    "p-2 text-sm": size === "icon",
  });

  return (
    <button className={`${baseStyle} ${variantStyle} ${sizeStyle}`} {...props}>
      {children}
    </button>
  );
};

export { Button };

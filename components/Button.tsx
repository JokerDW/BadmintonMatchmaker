import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    // Primary: Dark brand color in light mode, Light accent in dark mode
    primary: "bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500 dark:bg-brand-300 dark:text-brand-900 dark:hover:bg-brand-200 dark:focus:ring-brand-300",
    
    // Secondary: Bordered
    secondary: "bg-white text-brand-700 border border-brand-200 hover:bg-brand-50 focus:ring-brand-500 dark:bg-brand-800 dark:text-brand-100 dark:border-brand-600 dark:hover:bg-brand-700",
    
    // Danger: Keep red, but adjust for dark mode
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-600",
    
    // Ghost
    ghost: "bg-transparent text-brand-600 hover:bg-brand-100 focus:ring-brand-500 dark:text-brand-200 dark:hover:bg-brand-800",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-6 text-lg",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};
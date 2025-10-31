import React from 'react';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  size?: ButtonSize;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', children, className, ...props }) => {
  const baseClasses = "flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed border";

  const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-green-500 border-green-500 text-white hover:bg-green-600 hover:border-green-600 focus:ring-green-500 disabled:bg-green-500/50",
    secondary: "bg-transparent border-green-500 text-green-500 hover:bg-green-500 hover:text-white focus:ring-green-500",
  };
  
  const sizeClasses: Record<ButtonSize, string> = {
      md: "px-4 py-2.5 text-base",
      sm: "px-3 py-1.5 text-sm",
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'solid';
  children: React.ReactNode;
}

export function Button({ variant = 'outline', children, className = '', ...props }: ButtonProps) {
  const baseStyles = "px-4 py-2 transition-colors rounded-lg";
  const variantStyles = {
    outline: "border border-black hover:bg-black hover:text-white",
    solid: "bg-black text-white hover:bg-gray-800"
  };

  return (
    <button 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
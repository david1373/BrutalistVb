interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function IconButton({ children, className = '', ...props }: IconButtonProps) {
  return (
    <button 
      className={`hover:bg-gray-100 p-2 rounded-sm ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
import { Link } from 'react-router-dom';

interface NavigationItem {
  label: string;
  href: string;
}

interface NavigationMenuProps {
  items: NavigationItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationMenu({ items, isOpen, onClose }: NavigationMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg z-50 p-6">
        <nav className="space-y-4">
          {items.map(item => (
            <Link
              key={item.href}
              to={item.href}
              className="block text-lg hover:text-gray-600"
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
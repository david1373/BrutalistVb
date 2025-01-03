import { useState } from 'react';
import { Menu, Settings } from 'lucide-react';
import { IconButton } from './ui/IconButton';
import { NavigationMenu } from './navigation/NavigationMenu';
import { Link } from 'react-router-dom';

const navigationItems = [
  { label: 'Home', href: '/' },
  { label: 'Admin', href: '/admin' }
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b border-black">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-3xl font-bold tracking-tight">
            BRUALIST
          </Link>
          <div className="flex items-center gap-4">
            <IconButton onClick={() => setIsMenuOpen(true)}>
              <Menu size={24} />
            </IconButton>
            <IconButton>
              <Settings size={24} />
            </IconButton>
          </div>
        </div>
      </div>
      
      <NavigationMenu 
        items={navigationItems}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </header>
  );
}
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, ClockIcon, UserIcon, PlusIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;

  const NavButton = ({ path, icon: Icon, label }: { path: string; icon: typeof HomeIcon; label: string }) => (
    <div className="relative">
      <button
        onClick={() => navigate(path)}
        onMouseEnter={() => setHoveredIcon(label)}
        onMouseLeave={() => setHoveredIcon(null)}
        className={`p-2 rounded-lg ${
          isActive(path) ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <Icon className="w-5 h-5" />
      </button>
      {hoveredIcon === label && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
          {label}
        </div>
      )}
    </div>
  );

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-black">Detoxifyr</h1>
        <nav className="flex items-center space-x-4">
          <NavButton path="/" icon={HomeIcon} label="Home" />
          <NavButton path="/new-session" icon={PlusIcon} label="New Session" />
          <NavButton path="/history" icon={ClockIcon} label="History" />
          <NavButton path="/settings" icon={UserIcon} label="Settings" />
        </nav>
      </div>
    </header>
  );
};

export default Header;
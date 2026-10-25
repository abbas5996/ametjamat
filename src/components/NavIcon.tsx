import React from 'react';
import {
  LayoutDashboard,
  Users,
  Coins,
  UtensilsCrossed,
  LineChart,
  Sliders,
  Calendar,
  Receipt,
  FolderOpen
} from 'lucide-react';

interface NavIconProps {
  name: string;
  className?: string;
}

export const NavIcon: React.FC<NavIconProps> = ({ name, className = 'w-4 h-4' }) => {
  switch (name) {
    case 'LayoutDashboard':
      return <LayoutDashboard className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'Coins':
      return <Coins className={className} />;
    case 'UtensilsCrossed':
      return <UtensilsCrossed className={className} />;
    case 'LineChart':
      return <LineChart className={className} />;
    case 'Calendar':
      return <Calendar className={className} />;
    case 'Receipt':
      return <Receipt className={className} />;
    case 'Sliders':
      return <Sliders className={className} />;
    default:
      return <FolderOpen className={className} />;
  }
};

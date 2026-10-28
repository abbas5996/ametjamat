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
  FolderOpen,
  MapPin,
  UserCheck,
  ChefHat,
  Boxes,
  Truck,
  Wallet,
  HeartHandshake,
  Scale,
  Building2,
  Layers,
  Key,
  Landmark,
  Calculator,
  GraduationCap,
  Sparkles,
  Briefcase,
  Compass,
  Plane,
  CalendarCheck,
  MessageSquare,
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
    case 'UserCheck':
      return <UserCheck className={className} />;
    case 'Coins':
      return <Coins className={className} />;
    case 'Wallet':
      return <Wallet className={className} />;
    case 'UtensilsCrossed':
      return <UtensilsCrossed className={className} />;
    case 'ChefHat':
      return <ChefHat className={className} />;
    case 'Boxes':
      return <Boxes className={className} />;
    case 'Truck':
      return <Truck className={className} />;
    case 'HeartHandshake':
      return <HeartHandshake className={className} />;
    case 'Scale':
      return <Scale className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'Key':
      return <Key className={className} />;
    case 'Landmark':
      return <Landmark className={className} />;
    case 'Calculator':
      return <Calculator className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Plane':
      return <Plane className={className} />;
    case 'CalendarCheck':
      return <CalendarCheck className={className} />;
    case 'MessageSquare':
      return <MessageSquare className={className} />;
    case 'LineChart':
      return <LineChart className={className} />;
    case 'Calendar':
      return <Calendar className={className} />;
    case 'Receipt':
      return <Receipt className={className} />;
    case 'Sliders':
      return <Sliders className={className} />;
    case 'MapPin':
      return <MapPin className={className} />;
    default:
      return <FolderOpen className={className} />;
  }
};

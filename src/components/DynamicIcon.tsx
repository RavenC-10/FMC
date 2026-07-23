import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function DynamicIcon({ name, className = 'h-5 w-5', size }: DynamicIconProps) {
  // Safe lookup for lucide icons
  const IconComponent = (Icons as any)[name];

  if (!IconComponent) {
    // Return a default icon if not found
    const HelpIcon = Icons.HelpCircle;
    return <HelpIcon className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
}

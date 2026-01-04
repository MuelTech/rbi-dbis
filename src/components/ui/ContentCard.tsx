import React, { ReactNode } from 'react';

interface ContentCardProps {
  children: ReactNode;
  className?: string;
}

const ContentCard: React.FC<ContentCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export default ContentCard;
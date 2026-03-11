import React, { ReactNode } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = '', title, ...rest }: CardProps) {
  return (
    <div className={`bg-surface rounded-2xl p-5 shadow-sm border border-border ${className}`} {...rest}>
      {title && <h3 className="text-lg font-semibold text-text-main mb-4">{title}</h3>}
      {children}
    </div>
  );
}

import type { ReactNode } from 'react';
import React from 'react';
import './SummaryStats.css';

interface StatCardProps {
  value: ReactNode;
  label: string;
  icon?: ReactNode;
  accent?: string; // CSS color for the top bar
  className?: string;
}

export function StatCard({ value, label, icon, accent, className = '' }: StatCardProps) {
  return (
    <div className={`stat-card ${className}`} style={accent ? { '--stat-accent': accent } as React.CSSProperties : undefined}>
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">
        {icon} {label}
      </span>
    </div>
  );
}


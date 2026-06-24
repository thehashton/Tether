'use client';

import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function MetricCard({ label, children, footer }: MetricCardProps) {
  const hasFooter = footer !== null && footer !== undefined && footer !== false;
  return (
    <div className="metric-card">
      <p className="metric-card-label">{label}</p>
      <div className="metric-card-body">{children}</div>
      {hasFooter ? <div className="metric-card-footer">{footer}</div> : null}
    </div>
  );
}

interface MetricStatProps {
  value: ReactNode;
  hint: string;
  title?: string;
  valueClassName?: string;
}

export function MetricStat({ value, hint, title, valueClassName = '' }: MetricStatProps) {
  return (
    <div className="metric-stat" title={title}>
      <p className={`metric-stat-value ${valueClassName}`}>{value}</p>
      <p className="metric-stat-hint">{hint}</p>
    </div>
  );
}

export function MetricStatGrid({ children }: { children: ReactNode }) {
  return <div className="metric-stat-grid">{children}</div>;
}

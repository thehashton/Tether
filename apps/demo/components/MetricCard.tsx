'use client';

import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function MetricCard({ label, children, footer }: MetricCardProps) {
  return (
    <div className="metric-card">
      <p className="metric-card-label">{label}</p>
      <div className="metric-card-body">{children}</div>
      {footer ? <div className="metric-card-footer">{footer}</div> : null}
    </div>
  );
}

interface MetricStatProps {
  value: ReactNode;
  hint: string;
  valueClassName?: string;
}

export function MetricStat({ value, hint, valueClassName = '' }: MetricStatProps) {
  return (
    <div className="metric-stat">
      <p className={`metric-stat-value ${valueClassName}`}>{value}</p>
      <p className="metric-stat-hint">{hint}</p>
    </div>
  );
}

export function MetricStatGrid({ children }: { children: ReactNode }) {
  return <div className="metric-stat-grid">{children}</div>;
}

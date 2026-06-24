'use client';

import type { ReactNode } from 'react';
import { InfoTooltip } from '@/components/InfoTooltip';

interface MetricCardProps {
  label: string;
  tooltip?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function MetricCard({ label, tooltip, children, footer }: MetricCardProps) {
  const hasFooter = footer !== null && footer !== undefined && footer !== false;
  return (
    <div className="metric-card">
      <div className="metric-card-label-row">
        <p className="metric-card-label">{label}</p>
        {tooltip ? <InfoTooltip text={tooltip} size="xs" /> : null}
      </div>
      <div className="metric-card-body">{children}</div>
      {hasFooter ? <div className="metric-card-footer">{footer}</div> : null}
    </div>
  );
}

interface MetricStatProps {
  value: ReactNode;
  hint: string;
  tooltip?: string;
  valueClassName?: string;
}

export function MetricStat({ value, hint, tooltip, valueClassName = '' }: MetricStatProps) {
  return (
    <div className="metric-stat">
      <p className={`metric-stat-value ${valueClassName}`}>{value}</p>
      <p className="metric-stat-hint">
        {hint}
        {tooltip ? <InfoTooltip text={tooltip} size="xs" /> : null}
      </p>
    </div>
  );
}

export function MetricStatGrid({ children }: { children: ReactNode }) {
  return <div className="metric-stat-grid">{children}</div>;
}

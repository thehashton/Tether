'use client';

import type { ReactNode } from 'react';
import { TooltipLabel } from '@/components/InfoTooltip';

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
      <div className="metric-card-header">
        {tooltip ? (
          <TooltipLabel text={tooltip} placement="below">
            <p className="metric-card-label">{label}</p>
          </TooltipLabel>
        ) : (
          <p className="metric-card-label">{label}</p>
        )}
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
        {tooltip ? (
          <TooltipLabel text={tooltip} placement="above">
            {hint}
          </TooltipLabel>
        ) : (
          hint
        )}
      </p>
    </div>
  );
}

export function MetricStatGrid({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`metric-stat-grid ${className}`.trim()}>{children}</div>;
}

'use client';

import { TooltipBubble } from '@/components/InfoTooltip';

interface FeaturePillProps {
  label: string;
  tooltip: string;
}

export function FeaturePill({ label, tooltip }: FeaturePillProps) {
  return (
    <li className="feature-pill-wrap">
      <span className="feature-pill" tabIndex={0} aria-label={`${label}: ${tooltip}`}>
        <span className="feature-pill-dot" aria-hidden />
        {label}
      </span>
      <TooltipBubble text={tooltip} placement="above" />
    </li>
  );
}

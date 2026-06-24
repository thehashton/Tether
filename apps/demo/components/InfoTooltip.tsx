'use client';

interface InfoTooltipProps {
  text: string;
  className?: string;
  size?: 'sm' | 'xs';
  placement?: 'above' | 'below';
}

export function InfoTooltip({
  text,
  className = '',
  size = 'sm',
  placement = 'above',
}: InfoTooltipProps) {
  return (
    <span
      className={`info-tooltip ${size === 'xs' ? 'info-tooltip-xs' : ''} info-tooltip-${placement} ${className}`}
    >
      <button type="button" className="info-tooltip-trigger" aria-label={text} tabIndex={0}>
        <span aria-hidden>i</span>
      </button>
      <span className="info-tooltip-content" role="tooltip">
        {text}
      </span>
    </span>
  );
}

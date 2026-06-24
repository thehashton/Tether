'use client';

import type { ReactNode } from 'react';

export type TooltipPlacement = 'above' | 'below';

interface TooltipBubbleProps {
  text: string;
  placement?: TooltipPlacement;
}

export function TooltipBubble({ text, placement = 'above' }: TooltipBubbleProps) {
  return (
    <span className={`tooltip-bubble tooltip-bubble-${placement}`} role="tooltip">
      {text}
    </span>
  );
}

interface InfoTooltipProps {
  text: string;
  className?: string;
  size?: 'sm' | 'xs';
  placement?: TooltipPlacement;
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
      <TooltipBubble text={text} placement={placement} />
    </span>
  );
}

interface TooltipLabelProps {
  text: string;
  children: ReactNode;
  placement?: TooltipPlacement;
  className?: string;
}

export function TooltipLabel({
  text,
  children,
  placement = 'above',
  className = '',
}: TooltipLabelProps) {
  return (
    <span
      className={`tooltip-anchor tooltip-anchor-${placement} ${className}`.trim()}
      tabIndex={0}
      aria-label={text}
    >
      {children}
      <TooltipBubble text={text} placement={placement} />
    </span>
  );
}

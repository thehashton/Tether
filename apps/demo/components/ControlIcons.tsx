import type { SVGProps } from 'react';

function IconBase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  );
}

export function IconKill(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 4l8 8M12 4 4 12" />
    </IconBase>
  );
}

export function IconSlowNetwork(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 4.5V8l2.5 1.5" />
    </IconBase>
  );
}

export function IconFlood(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M2 11c1.5-2 3-3 6-3s4.5 1 6 3" />
      <path d="M2 8c1.5-2 3-3 6-3s4.5 1 6 3" />
      <path d="M2 5c1.5-2 3-3 6-3s4.5 1 6 3" />
    </IconBase>
  );
}

export function IconQueue(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3 5h10M3 8h10M3 11h10" />
    </IconBase>
  );
}

export function IconRefresh(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M11 2.5A5 5 0 1 0 13 8" />
      <path d="M13 2.5V5.5H10" />
    </IconBase>
  );
}

export function IconLatency(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M8 2.5v5.5" />
      <circle cx="8" cy="10.5" r="0.75" fill="currentColor" stroke="none" />
      <path d="M4 13.5h8" />
    </IconBase>
  );
}

import { cn } from '@/lib/utils';

interface HandshakeLogoProps {
  size?: number;
  className?: string;
}

export function HandshakeIcon({ size = 24, className }: HandshakeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M9 16H23"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M11 12.5C13.7 9.6 18.3 9.6 21 12.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M11 19.5C13.7 22.4 18.3 22.4 21 19.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="8" cy="16" r="4.5" fill="currentColor" />
      <circle cx="24" cy="16" r="4.5" fill="currentColor" />
      <circle cx="8" cy="16" r="1.5" fill="white" opacity="0.5" />
      <circle cx="24" cy="16" r="1.5" fill="white" opacity="0.5" />
    </svg>
  );
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  width?: number;
  height?: number;
  className?: string;
}

export function MeetvoLogo({ size = 'sm', width, height, className }: LogoProps) {
  const resolvedSize = width != null
    ? width >= 120 ? 'lg' : width >= 60 ? 'md' : 'sm'
    : size;
  const textSize = resolvedSize === 'sm' ? 'text-base' : resolvedSize === 'lg' ? 'text-2xl' : 'text-lg';
  const iconBoxSize = resolvedSize === 'sm' ? 'h-8 w-8 rounded-xl' : resolvedSize === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10 rounded-[14px]';
  const iconSize = resolvedSize === 'sm' ? 18 : resolvedSize === 'lg' ? 28 : 22;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center border border-[#00C2A8]/30 bg-[#00C2A8]/10 text-[#00C2A8] shadow-[0_12px_30px_rgba(0,194,168,0.18)]',
          iconBoxSize
        )}
        aria-hidden="true"
      >
        <HandshakeIcon size={iconSize} />
      </span>
      <span className={cn('font-extrabold tracking-tight', textSize)}>
        <span className="text-brand">Meetvo</span>
        <span className="text-text">AI</span>
      </span>
    </div>
  );
}

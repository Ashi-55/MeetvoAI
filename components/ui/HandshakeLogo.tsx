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
      {/* Left hand fingers */}
      <path
        d="M2 14.5C2 14.5 4.5 12 7 13L11.5 16.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 18C2 18 4 16 6.5 16.5L11 19.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left arm */}
      <path
        d="M3 21.5C3 21.5 6 19 9 19.5L14.5 22"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right hand fingers */}
      <path
        d="M30 14.5C30 14.5 27.5 12 25 13L20.5 16.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30 18C30 18 28 16 25.5 16.5L21 19.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right arm */}
      <path
        d="M29 21.5C29 21.5 26 19 23 19.5L17.5 22"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Center handshake clasp */}
      <path
        d="M11 17L14 15.5L16 17L18 15.5L21 17L19 20L16 21.5L13 20L11 17Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Grip lines on clasp */}
      <path
        d="M13.5 16.5L14.5 19.5M16 15.8L16 20M18.5 16.5L17.5 19.5"
        stroke="white"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MeetvoLogo({ size = 'md', className }: LogoProps) {
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 32 : 22;
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-xl flex items-center justify-center bg-gradient-to-br from-brand to-blue shrink-0',
          size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9'
        )}
      >
        <HandshakeIcon size={iconSize} className="text-white" />
      </div>
      <span className={cn('font-extrabold tracking-tight', textSize)}>
        <span className="text-brand">Meetvo</span>
        <span className="text-text">AI</span>
      </span>
    </div>
  );
}

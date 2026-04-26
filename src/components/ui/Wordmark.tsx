import Link from 'next/link';

type Size = 'sm' | 'md' | 'lg';

const sizeClasses: Record<Size, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
};

export default function Wordmark({
  size = 'md',
  href = '/',
  className = '',
}: {
  size?: Size;
  href?: string | null;
  className?: string;
}) {
  const content = (
    <span
      className={`font-display font-semibold tracking-tight text-[color:var(--color-cocoa)] ${sizeClasses[size]} ${className}`}
    >
      annya
    </span>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

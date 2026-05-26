import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { LandingButton } from '@/lib/landingCards';
import type { ReactNode } from 'react';

interface Props {
  button: LandingButton;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  children?: ReactNode; // optional trailing icon
  onClick?: () => void;
}

function isInternal(url: string) {
  return url.startsWith('/') || url.startsWith('#');
}

function variantClasses(variant?: LandingButton['variant']) {
  switch (variant) {
    case 'accent':
    case 'primary':
      return 'bg-accent hover:bg-accent/90 text-accent-foreground';
    case 'secondary':
      return 'bg-primary hover:bg-primary/90 text-primary-foreground';
    case 'outline':
    default:
      return '';
  }
}

export function LandingCtaButton({ button, size = 'lg', className, children, onClick }: Props) {
  const isOutline = button.variant === 'outline';
  const btn = (
    <Button
      size={size}
      variant={isOutline ? 'outline' : 'default'}
      onClick={onClick}
      className={`px-8 h-12 text-base ${variantClasses(button.variant)} ${className || ''}`}
    >
      {button.label}
      {children}
    </Button>
  );

  if (onClick) return btn;

  if (isInternal(button.url)) {
    if (button.url.startsWith('#')) {
      return <a href={button.url}>{btn}</a>;
    }
    return <Link to={button.url}>{btn}</Link>;
  }
  return (
    <a href={button.url} target="_blank" rel="noopener noreferrer">
      {btn}
    </a>
  );
}

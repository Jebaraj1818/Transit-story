import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Editorial Button component for The Transit Story.
 *
 * Strict 5-color palette:
 *  - Warm Ivory: #F5F0E5
 *  - Deep Forest: #173A2D
 *  - Earth Green: #426047
 *  - Muted Gold: #C49A45 (used selectively as accent)
 *  - Charcoal: #20231F
 *
 * Zero RGB/cyan/purple glow or artificial sheen.
 *
 * Variants:
 *  - primary: background #173A2D, text #F5F0E5, border #173A2D, hover #426047
 *  - secondary: background transparent, border #173A2D, text #173A2D, hover background #173A2D, text #F5F0E5
 *  - gold: (Selective CTA accent over dark sections) background #C49A45, text #173A2D, hover #A68031
 *  - outlineLight: (For dark sections) background transparent, border #F5F0E5/60, text #F5F0E5, hover background #F5F0E5, text #173A2D
 *  - text: Understated editorial text CTA with subtle underline
 */
export default function Button({
  children,
  to,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  ...props
}) {
  const baseStyles =
    'group relative inline-flex items-center justify-center font-sans font-medium select-none cursor-pointer rounded-sm text-center leading-none transition-all duration-300 ease-editorial active:scale-[0.97] [@media(hover:hover)]:hover:-translate-y-0.5 overflow-hidden';

  const sizeStyles = {
    sm: 'min-h-[42px] text-[11px] sm:text-xs px-4 py-2.5 uppercase tracking-editorial gap-2',
    md: 'min-h-[46px] text-xs sm:text-sm px-5 sm:px-6 py-3 uppercase tracking-editorial gap-2.5',
    lg: 'min-h-[48px] text-xs sm:text-sm md:text-base px-6 sm:px-8 py-3.5 sm:py-4 uppercase tracking-editorial gap-3',
  };

  const variantStyles = {
    primary:
      'bg-[#173A2D] text-[#F5F0E5] border border-[#173A2D] hover:bg-[#426047] hover:border-[#426047] shadow-sm',
    secondary:
      'bg-transparent text-[#173A2D] border border-[#173A2D] hover:bg-[#173A2D] hover:text-[#F5F0E5] shadow-none',
    gold:
      'bg-[#C49A45] text-[#173A2D] border border-[#C49A45] hover:bg-[#A68031] hover:border-[#A68031] shadow-sm',
    outline:
      'bg-transparent text-[#173A2D] border border-[#173A2D]/50 hover:border-[#173A2D] hover:bg-[#173A2D] hover:text-[#F5F0E5] shadow-none',
    outlineLight:
      'bg-transparent text-[#F5F0E5] border border-[#F5F0E5]/60 hover:border-[#F5F0E5] hover:bg-[#F5F0E5] hover:text-[#173A2D] shadow-none',
    text:
      'bg-transparent text-[#173A2D] hover:text-[#426047] border-0 p-0 shadow-none hover:shadow-none tracking-editorial uppercase text-xs font-semibold hover:-translate-y-0 active:scale-100 overflow-visible relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#173A2D] after:transition-all after:duration-300 hover:after:w-full',
  };

  // Ensure child SVG icons (like Lucide ArrowRight) slide 5-6px to the right on hover without color shifts
  const iconAnimation = '[&_svg]:transition-transform [&_svg]:duration-300 [&_svg]:ease-editorial group-hover:[&_svg]:translate-x-1.5';

  const isTextVariant = variant === 'text';
  const appliedSizeStyle = isTextVariant ? '' : sizeStyles[size] || sizeStyles.md;

  const combinedClasses = `${baseStyles} ${iconAnimation} ${appliedSizeStyle} ${
    variantStyles[variant] || variantStyles.primary
  } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={combinedClasses} {...props}>
        <span className="relative z-10 flex items-center gap-[inherit]">{children}</span>
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={combinedClasses} {...props}>
        <span className="relative z-10 flex items-center gap-[inherit]">{children}</span>
      </a>
    );
  }

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-[inherit]">{children}</span>
    </button>
  );
}

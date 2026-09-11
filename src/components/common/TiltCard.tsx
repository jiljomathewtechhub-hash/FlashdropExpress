import React from 'react';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // Kept for backwards compatibility
  scale?: number; // Kept for backwards compatibility
  glare?: boolean; // Kept for backwards compatibility
  perspective?: number; // Kept for backwards compatibility
}

/**
 * Steady card container used across all website sections.
 * Mouse-tilt rotation, perspective shift, and 3D wobble have been completely removed
 * so that all cards remain steady, stable, and professional.
 */
export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  maxTilt,
  scale,
  glare,
  perspective,
  ...rest
}) => {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      {...rest}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
};


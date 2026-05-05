import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function Tooltip({ content, children, position = 'bottom', className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isVisible || !wrapperRef.current) return;

    const updatePosition = () => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      const gap = 10;
      const viewportPadding = 12;
      const maxLeft = window.innerWidth - viewportPadding;
      const minLeft = viewportPadding;

      if (position === 'top') {
        setStyle({
          left: Math.min(maxLeft, Math.max(minLeft, rect.left + rect.width / 2)),
          top: rect.top - gap,
          transform: 'translate(-50%, -100%)',
        });
        return;
      }

      if (position === 'left') {
        setStyle({
          left: Math.max(minLeft, rect.left - gap),
          top: rect.top + rect.height / 2,
          transform: 'translate(-100%, -50%)',
        });
        return;
      }

      if (position === 'right') {
        setStyle({
          left: Math.min(maxLeft, rect.right + gap),
          top: rect.top + rect.height / 2,
          transform: 'translate(0, -50%)',
        });
        return;
      }

      setStyle({
        left: Math.min(maxLeft, Math.max(minLeft, rect.left + rect.width / 2)),
        top: rect.bottom + gap,
        transform: 'translate(-50%, 0)',
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, position]);

  const tooltip =
    isVisible && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed z-[9999] w-max max-w-[260px] px-3 py-2 bg-ink text-white text-xs font-medium rounded-lg whitespace-normal leading-relaxed shadow-2xl pointer-events-none normal-case tracking-normal text-left"
            style={style}
          >
            {content}
          </div>,
          document.body
        )
      : null;

  return (
    <div 
      ref={wrapperRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {tooltip}
    </div>
  );
}

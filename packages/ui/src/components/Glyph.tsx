import clsx from 'clsx';

/**
 * Геометрические примитивы вместо иконочного шрифта.
 *
 * Макеты рисуют навигацию кругами, ромбами и треугольниками — по правилу
 * системы «формы геометричные: круг, ромб, треугольник, без перспективы и 3D».
 * Сетка 24, штрих 1.75px, цвет наследуется от текста.
 */
export type GlyphShape = 'triangle' | 'circle' | 'diamond' | 'square' | 'ring' | 'dot';

export interface GlyphProps {
  shape: GlyphShape;
  size?: number;
  /** Залитая форма вместо контурной — так помечается активный пункт. */
  filled?: boolean;
  className?: string;
}

export function Glyph({ shape, size = 16, filled = false, className }: GlyphProps) {
  const stroke = 1.75;
  const common = { className: clsx('kb-glyph', className), 'aria-hidden': true };

  if (shape === 'triangle') {
    return (
      <span
        {...common}
        style={{
          width: size,
          height: size * 0.88,
          background: 'currentColor',
          clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
        }}
      />
    );
  }

  if (shape === 'dot') {
    return (
      <span
        {...common}
        style={{ width: size, height: size, borderRadius: 999, background: 'currentColor' }}
      />
    );
  }

  const radius = shape === 'circle' || shape === 'ring' ? 999 : shape === 'diamond' ? 3 : 5;

  return (
    <span
      {...common}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        border: filled ? 'none' : `${stroke}px solid currentColor`,
        background: filled ? 'currentColor' : 'none',
        transform: shape === 'diamond' ? 'rotate(45deg)' : undefined,
      }}
    />
  );
}

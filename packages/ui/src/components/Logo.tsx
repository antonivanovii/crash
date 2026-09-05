import clsx from 'clsx';
import { roundedRectPath } from '../lib/rounded-rect.js';

/**
 * Знак: лисья голова из примитивов — два треугольника ушей, скруглённый корпус,
 * вырез морды. Геометрия снята с макета (Style 1.4) на базе 52 px.
 *
 * Нельзя: градиент внутри знака, обводку, тень, знак в mint или rose.
 * Только ember, ink или белый.
 */
const BASE = 52;

// Корпус 44×32 при left 4 / top 16, радиусы 8 8 22 22.
const BODY = roundedRectPath(4, 16, 44, 32, [8, 8, 22, 22]);
// Вырез морды 20×16 при left 16 / top 30, радиусы 4 4 10 10.
const SNOUT = roundedRectPath(16, 30, 20, 16, [4, 4, 10, 10]);

export interface LogoMarkProps {
  size?: number;
  /** Цвет знака. По умолчанию наследуется от текста. */
  color?: string;
  /** Цвет выреза морды — это фон под знаком, а не отдельный цвет. */
  cutout?: string;
  className?: string;
}

export function LogoMark({ size = 26, color = 'currentColor', cutout, className }: LogoMarkProps) {
  // Ниже 16 px вырез морды сливается в грязь — остаётся только силуэт.
  const showSnout = size >= 16;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${BASE} ${BASE}`}
      fill="none"
      role="img"
      aria-label="Kobold"
      className={className}
    >
      <path d="M0,24 L0,8 L16,24 Z" fill={color} />
      <path d="M52,24 L52,8 L36,24 Z" fill={color} />
      <path d={BODY} fill={color} />
      {showSnout ? <path d={SNOUT} fill={cutout ?? 'var(--kb-ink-900)'} /> : null}
    </svg>
  );
}

export interface LogoProps extends LogoMarkProps {
  /** Размер слова KOBOLD. Знак и слово масштабируются вместе. */
  wordSize?: number;
}

export function Logo({ size = 26, wordSize, color, cutout, className }: LogoProps) {
  return (
    <span
      className={clsx('kb-logo', className)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.38 }}
    >
      <LogoMark size={size} color={color} cutout={cutout} />
      <span
        style={{
          fontFamily: 'var(--kb-font-ui)',
          fontSize: wordSize ?? size * 0.6,
          fontWeight: 800,
          fontStretch: 'var(--kb-width-display)',
          // Трекинг задан макетом; растягивать слово вручную нельзя.
          letterSpacing: '0.16em',
          color: color ?? 'var(--kb-text-hi)',
          lineHeight: 1,
        }}
      >
        KOBOLD
      </span>
    </span>
  );
}

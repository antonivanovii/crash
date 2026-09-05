import clsx from 'clsx';
import { roundedRectPath } from '../lib/rounded-rect.js';

/**
 * Фикс — лис-шулер. Макет: layouts/Kobold Mascot.dc.html.
 *
 * Одна геометрия на все размеры: иконка 16 px, пустой экран 96 px, баннер.
 * Собран как SVG-спрайт с одним корпусом и подменяемыми слоями глаз, галстука
 * и предмета — ровно так, как требует раздел 3.3 макета. Никакой растровой
 * анимации: моргание и покачивание делает CSS.
 *
 * Базовая сетка 176×186. Все размеры от неё; при масштабировании радиусы
 * делятся вместе с размером — за это отвечает viewBox.
 *
 * Где появляется: пустой экран, ошибка, восстановление раунда, проверка
 * честности, крупный выигрыш. Никогда — поверх активной игры и никогда рядом
 * с кнопкой ставки: маскот не продаёт ставку.
 */

const W = 176;
const H = 186;

const COLOR = {
  fur: '#FF6B2C',
  furDim: '#E85F26',
  earInner: '#2A1305',
  earDim: '#C6501C',
  snout: '#F7F2EA',
  snoutDim: '#E4DED4',
  ink: '#2A1305',
  suit: '#221E1B',
  collar: '#F7F2EA',
  amber: '#E8B23A',
  mint: '#3FD8A4',
  mintDark: '#2FBB8B',
  mintInk: '#04291D',
  rose: '#F4585B',
  slate: '#6E86FF',
  muted: '#3A342F',
  paper: '#F7F2EA',
  paperLine: '#C6BEB2',
} as const;

/* ── Постоянные части корпуса ───────────────────────────────────────────── */
const HEAD = roundedRectPath(21, 40, 134, 100, [28, 28, 66, 66]);
const SNOUT = roundedRectPath(52, 86, 72, 54, [14, 14, 34, 34]);
const SUIT = roundedRectPath(32, 128, 112, 52, [20, 20, 8, 8]);
const NOSE = roundedRectPath(79, 96, 18, 13, [5, 5, 9, 9]);

export type MascotScenario =
  | 'hello'
  | 'win'
  | 'loss'
  | 'empty'
  | 'verify'
  | 'support'
  | 'level'
  | 'deposit'
  | 'offline'
  | 'limits';

type Eyes = 'open' | 'happy' | 'flat' | 'asleep' | 'wide';
type Mouth = 'smile' | 'grin' | 'frown' | 'gape' | 'open';

interface ScenarioSpec {
  readonly eyes: Eyes;
  readonly mouth: Mouth;
  /** Галстук — единственная деталь, которая меняет цвет по сценарию. */
  readonly tie: string;
  /** Наклон ушей: радость приподнимает, огорчение опускает. */
  readonly earTilt?: number;
  /** Приглушённая шерсть — только проигрыш. Корпус нигде больше не меняет цвет. */
  readonly dim?: boolean;
  /** Наклон головы — дремлющий лис на пустом экране. */
  readonly headTilt?: number;
  readonly prop?: MascotScenario;
  readonly label: string;
}

const SCENARIOS: Record<MascotScenario, ScenarioSpec> = {
  hello: {
    eyes: 'open',
    mouth: 'smile',
    tie: COLOR.amber,
    prop: 'hello',
    label: 'Фикс здоровается',
  },
  win: {
    eyes: 'happy',
    mouth: 'grin',
    tie: COLOR.mint,
    earTilt: 8,
    prop: 'win',
    label: 'Фикс радуется выигрышу',
  },
  loss: {
    eyes: 'flat',
    mouth: 'frown',
    tie: COLOR.rose,
    earTilt: -24,
    dim: true,
    prop: 'loss',
    label: 'Фикс огорчён',
  },
  empty: {
    eyes: 'asleep',
    mouth: 'smile',
    tie: COLOR.muted,
    headTilt: 6,
    prop: 'empty',
    label: 'Фикс дремлет',
  },
  verify: {
    eyes: 'open',
    mouth: 'smile',
    tie: COLOR.amber,
    prop: 'verify',
    label: 'Фикс проверяет раунд',
  },
  support: {
    eyes: 'open',
    mouth: 'open',
    tie: COLOR.slate,
    prop: 'support',
    label: 'Фикс на связи',
  },
  level: { eyes: 'open', mouth: 'smile', tie: COLOR.amber, prop: 'level', label: 'Новый уровень' },
  deposit: {
    eyes: 'open',
    mouth: 'smile',
    tie: COLOR.mint,
    prop: 'deposit',
    label: 'Пополнение прошло',
  },
  offline: {
    eyes: 'wide',
    mouth: 'gape',
    tie: COLOR.rose,
    prop: 'offline',
    label: 'Связь потеряна',
  },
  limits: {
    eyes: 'open',
    mouth: 'smile',
    tie: COLOR.slate,
    prop: 'limits',
    label: 'Лимиты и самоисключение',
  },
};

/* ── Слои ───────────────────────────────────────────────────────────────── */

function Eyes({ variant, blink }: { variant: Eyes; blink: boolean }) {
  const blinkStyle = blink
    ? { animation: 'kb-blink 5s infinite', transformBox: 'fill-box' as const }
    : undefined;

  if (variant === 'happy') {
    // Дуги вверх: глаза-полумесяцы. Только выигрыш.
    return (
      <g fill={COLOR.ink}>
        <path d="M47,73 a10,10 0 0 1 20,0 z" />
        <path d="M109,73 a10,10 0 0 1 20,0 z" />
      </g>
    );
  }

  if (variant === 'flat') {
    return (
      <g fill={COLOR.ink}>
        <rect x="47" y="72" width="20" height="5" rx="2.5" />
        <rect x="109" y="72" width="20" height="5" rx="2.5" />
      </g>
    );
  }

  if (variant === 'asleep') {
    // Спит: обе линии закрыты, моргание выключено.
    return (
      <g fill={COLOR.ink}>
        <rect x="48" y="73" width="20" height="5" rx="2.5" />
        <rect x="110" y="73" width="20" height="5" rx="2.5" />
      </g>
    );
  }

  if (variant === 'wide') {
    // Круглые глаза с белком: испуг при обрыве связи.
    return (
      <g>
        <circle
          cx="57.5"
          cy="73.5"
          r="11"
          fill={COLOR.snout}
          stroke={COLOR.ink}
          strokeWidth="2.7"
        />
        <circle
          cx="118.5"
          cy="73.5"
          r="11"
          fill={COLOR.snout}
          stroke={COLOR.ink}
          strokeWidth="2.7"
        />
        <circle cx="57.5" cy="73.5" r="4.7" fill={COLOR.ink} />
        <circle cx="118.5" cy="73.5" r="4.7" fill={COLOR.ink} />
      </g>
    );
  }

  return (
    <g fill={COLOR.ink} style={blinkStyle}>
      <circle cx="57.5" cy="73.5" r="7.5" />
      <circle cx="118.5" cy="73.5" r="7.5" />
    </g>
  );
}

function Mouth({ variant }: { variant: Mouth }) {
  if (variant === 'grin') {
    return (
      <>
        <path d={roundedRectPath(75, 104, 26, 19, [0, 0, 13, 13])} fill={COLOR.ink} />
      </>
    );
  }

  if (variant === 'frown') {
    return (
      <>
        <path d={NOSE} fill={COLOR.ink} />
        <path d={roundedRectPath(75, 122, 26, 11, [13, 13, 0, 0])} fill={COLOR.ink} />
      </>
    );
  }

  if (variant === 'gape') {
    return (
      <>
        <path d={NOSE} fill={COLOR.ink} />
        <circle cx="88" cy="124" r="12" fill={COLOR.ink} />
      </>
    );
  }

  if (variant === 'open') {
    return (
      <>
        <path d={NOSE} fill={COLOR.ink} />
        <path d={roundedRectPath(75, 117, 26, 12, [0, 0, 16, 16])} fill={COLOR.ink} />
      </>
    );
  }

  return (
    <>
      <path d={NOSE} fill={COLOR.ink} />
      <rect x="66" y="116" width="44" height="3" rx="1.5" fill="rgba(42,19,5,0.25)" />
    </>
  );
}

/** Предмет в кадре. Меняется вместе с глазами и галстуком — остальное неизменно. */
function Prop({ scenario }: { scenario: MascotScenario }) {
  switch (scenario) {
    case 'hello':
      // Две карты веером: лис знает вероятности и не прячет их.
      return (
        <g>
          <rect
            x="128"
            y="53"
            width="35"
            height="45"
            rx="4"
            fill={COLOR.paper}
            stroke={COLOR.paperLine}
            strokeWidth="1.3"
            transform="rotate(14 145.5 75.5)"
          />
          <g transform="rotate(-6 137.5 81)">
            <rect
              x="120"
              y="59"
              width="35"
              height="45"
              rx="4"
              fill={COLOR.paper}
              stroke={COLOR.paperLine}
              strokeWidth="1.3"
            />
            <rect
              x="132"
              y="75"
              width="12"
              height="12"
              fill={COLOR.fur}
              transform="rotate(45 138 81)"
            />
          </g>
        </g>
      );

    case 'win':
      // Искры, а не монеты: маскот не держит деньги в руках как приз.
      return (
        <g>
          <rect
            x="8"
            y="18.7"
            width="16"
            height="16"
            fill={COLOR.mint}
            transform="rotate(45 16 26.7)"
          />
          <rect
            x="154.7"
            y="50.7"
            width="10.7"
            height="10.7"
            fill={COLOR.mint}
            transform="rotate(45 160 56)"
          />
          <rect
            x="133.3"
            y="13.3"
            width="13.3"
            height="13.3"
            fill={COLOR.amber}
            transform="rotate(45 140 20)"
          />
        </g>
      );

    case 'loss':
      // Пара капель. Сдержанно: без насмешки и без утешений.
      return (
        <g fill={COLOR.slate}>
          <circle cx="139" cy="80" r="6" />
          <circle cx="148" cy="97" r="4" />
        </g>
      );

    case 'empty':
      return (
        <g fill={COLOR.muted} fontFamily="var(--kb-font-mono)" fontWeight="700">
          <text x="139" y="34" fontSize="20">
            z
          </text>
          <text x="149" y="14" fontSize="15">
            z
          </text>
        </g>
      );

    case 'verify':
      // Лупа — раздел честности и верификатор.
      return (
        <g>
          <circle
            cx="118.7"
            cy="73.3"
            r="14.7"
            fill="rgba(232,178,58,0.14)"
            stroke={COLOR.amber}
            strokeWidth="3.3"
          />
          <rect
            x="130"
            y="85"
            width="4"
            height="16"
            rx="2"
            fill={COLOR.amber}
            transform="rotate(-20 132 93)"
          />
        </g>
      );

    case 'support':
      // Гарнитура: дужка по лбу (верхняя половина пилюли) и два наушника.
      return (
        <g>
          <path
            d="M13.3,96 V82.6 A13.3,13.3 0 0 1 26.6,69.3 H149.3 A13.3,13.3 0 0 1 162.6,82.6 V96"
            fill="none"
            stroke={COLOR.slate}
            strokeWidth="4"
          />
          <rect x="8" y="88" width="18.7" height="29.3" rx="6.7" fill={COLOR.slate} />
          <rect x="149.3" y="88" width="18.7" height="29.3" rx="6.7" fill={COLOR.slate} />
        </g>
      );

    case 'level':
      // Корона: лояльность и новый ранг.
      return (
        <g fill={COLOR.amber}>
          <path d="M29,35 L45,0 L64,22 L88,0 L112,22 L131,0 L147,35 Z" />
          <rect x="29" y="32" width="118" height="8" rx="2.7" />
        </g>
      );

    case 'deposit':
      // Купюра уходит в приёмник. Успешная оплата, а не обещание выигрыша.
      return (
        <g>
          <rect x="117" y="99" width="43" height="13" rx="6.7" fill={COLOR.mintDark} />
          <rect
            x="109"
            y="109"
            width="59"
            height="43"
            rx="8"
            fill={COLOR.mint}
            stroke={COLOR.mintInk}
            strokeWidth="2.7"
          />
          <text
            x="138.5"
            y="137"
            textAnchor="middle"
            fontFamily="var(--kb-font-mono)"
            fontSize="17"
            fontWeight="700"
            fill={COLOR.mintInk}
          >
            ₽
          </text>
        </g>
      );

    case 'offline':
      // Перечёркнутый сигнал по обе стороны.
      return (
        <g fill={COLOR.rose}>
          <rect x="0" y="69" width="35" height="7" rx="3.5" transform="rotate(-14 17.5 72.5)" />
          <rect x="141" y="69" width="35" height="7" rx="3.5" transform="rotate(14 158.5 72.5)" />
        </g>
      );

    case 'limits':
      // Документ: самоисключение, лимит сессии, KYC.
      return (
        <g>
          <rect
            x="112"
            y="93"
            width="51"
            height="61"
            rx="10.7"
            fill={COLOR.paper}
            stroke={COLOR.ink}
            strokeWidth="2.7"
          />
          <rect x="124" y="114" width="26.7" height="4" rx="2" fill={COLOR.ink} />
          <rect x="124" y="122" width="26.7" height="4" rx="2" fill={COLOR.ink} />
          <rect x="124" y="130" width="16" height="4" rx="2" fill={COLOR.rose} />
        </g>
      );
  }
}

/* ── Компонент ──────────────────────────────────────────────────────────── */
export interface MascotProps {
  scenario?: MascotScenario;
  /** Высота в пикселях. Макет: пусто 96, ошибка 120, онбординг 160, аватар 44. */
  size?: number;
  /** Покачивание. Выключается на аватаре и в плотных списках. */
  bob?: boolean;
  className?: string;
}

export function Mascot({ scenario = 'hello', size = 96, bob = false, className }: MascotProps) {
  const spec = SCENARIOS[scenario];
  const fur = spec.dim ? COLOR.furDim : COLOR.fur;
  const earOuter = spec.dim ? COLOR.earDim : COLOR.fur;
  const snout = spec.dim ? COLOR.snoutDim : COLOR.snout;
  const tilt = spec.earTilt ?? 0;

  return (
    <svg
      width={(size * W) / H}
      height={size}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      role="img"
      aria-label={spec.label}
      className={clsx('kb-mascot', className)}
      style={bob ? { animation: 'kb-bob 4s ease-in-out infinite' } : undefined}
    >
      {/* Костюм и воротник — под головой, всегда одинаковые. */}
      <path d={SUIT} fill={COLOR.suit} stroke="rgba(255,246,235,0.09)" />
      <path d="M86,128 L62,128 L86,158 Z" fill={COLOR.collar} />
      <path d="M90,128 L114,128 L90,158 Z" fill={COLOR.collar} />

      {/* Галстук — единственная деталь, которая меняет цвет по сценарию. */}
      <rect
        x="82"
        y="140"
        width="16"
        height="16"
        rx="2"
        fill={spec.tie}
        transform="rotate(45 90 148)"
      />
      <path d="M90,154 L102,159.7 L90,180 L78,159.7 Z" fill={spec.tie} />

      <g transform={spec.headTilt ? `rotate(${spec.headTilt} 88 90)` : undefined}>
        {/* Уши: наружный треугольник и вставка в ember/900. */}
        <g transform={tilt ? `rotate(${-tilt} 38 28)` : undefined}>
          <path d="M18,48 L18,8 L58,48 Z" fill={earOuter} />
          <path d="M27,42 L27,22 L47,42 Z" fill={COLOR.earInner} />
        </g>
        <g transform={tilt ? `rotate(${tilt} 138 28)` : undefined}>
          <path d="M158,48 L158,8 L118,48 Z" fill={earOuter} />
          <path d="M149,42 L149,22 L129,42 Z" fill={COLOR.earInner} />
        </g>

        <path d={HEAD} fill={fur} />
        {/* Морда — единственное светлое пятно на корпусе. */}
        <path d={SNOUT} fill={snout} />

        <Eyes variant={spec.eyes} blink={spec.eyes === 'open'} />
        <Mouth variant={spec.mouth} />
      </g>

      {spec.prop ? <Prop scenario={spec.prop} /> : null}
    </svg>
  );
}

/**
 * Только голова — аватар по умолчанию, 44 px. Без костюма и без предмета:
 * в этом размере они превращаются в шум.
 */
export function MascotHead({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="10 0 156 156"
      fill="none"
      role="img"
      aria-label="Фикс"
      className={className}
    >
      <path d="M18,48 L18,8 L58,48 Z" fill={COLOR.fur} />
      <path d="M27,42 L27,22 L47,42 Z" fill={COLOR.earInner} />
      <path d="M158,48 L158,8 L118,48 Z" fill={COLOR.fur} />
      <path d="M149,42 L149,22 L129,42 Z" fill={COLOR.earInner} />
      <path d={HEAD} fill={COLOR.fur} />
      <path d={SNOUT} fill={COLOR.snout} />
      <circle cx="57.5" cy="73.5" r="7.5" fill={COLOR.ink} />
      <circle cx="118.5" cy="73.5" r="7.5" fill={COLOR.ink} />
      <path d={NOSE} fill={COLOR.ink} />
    </svg>
  );
}

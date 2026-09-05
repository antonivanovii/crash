import { useEffect, useRef } from 'react';
import './limbo.css';

/**
 * Число Limbo. Анимация — чистый театр: результат уже посчитан сервером и лежит
 * в ответе, число не «выпадает», оно отыгрывается.
 *
 * Roll-up идёт через ref и requestAnimationFrame, БЕЗ setState на кадр.
 * Держать анимируемое значение в React-стейте — шестьдесят ре-рендеров
 * в секунду ради одной строки текста.
 *
 * Цвет переключается ровно в момент остановки: появись он во время прокрутки,
 * исход был бы виден заранее и интрига пропала бы.
 */
export function LimboDisplay({
  multiplier,
  won,
  animate,
}: {
  multiplier: number | null;
  won: boolean | null;
  /** На автобете анимация физически невозможна: 20 ставок в секунду против 1000 мс. */
  animate: boolean;
}) {
  const valueRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const node = valueRef.current;
    if (!node || multiplier === null) return;

    if (!animate) {
      node.textContent = multiplier.toFixed(2);
      return;
    }

    const from = 1;
    const duration = 1000;
    const startedAt = performance.now();

    const tick = (now: number) => {
      // Интерполяция по времени, а не по кадрам: на слабом устройстве
      // анимация обязана занять те же 1000 мс, просто с меньшим числом кадров.
      const t = Math.min(1, (now - startedAt) / duration);
      // ease-out: быстрый старт и долгое доползание последних десятых —
      // именно торможение на финише создаёт напряжение.
      const eased = 1 - (1 - t) ** 3;
      node.textContent = (from + (multiplier - from) * eased).toFixed(2);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [multiplier, animate]);

  const state = multiplier === null ? 'idle' : won ? 'win' : 'loss';

  return (
    <div className={`limbo limbo--${state}`}>
      <div className="limbo__value kb-num" ref={valueRef}>
        {multiplier === null ? '1.00' : multiplier.toFixed(2)}
      </div>
      <div className="limbo__suffix kb-overline">×</div>
    </div>
  );
}

/**
 * Лента истории. Непропорционально влияет на ощущение: даёт непрерывность,
 * видно серию, видно, что игра живая. Без неё каждый раунд ощущается
 * изолированным.
 */
export function LimboHistory({
  items,
}: {
  items: Array<{ id: string; multiplier: string; won: boolean }>;
}) {
  return (
    <div className="limbo-history">
      {items.map((item) => (
        <span
          key={item.id}
          className={`limbo-history__chip kb-num ${item.won ? 'is-win' : 'is-loss'}`}
        >
          {(Number(item.multiplier) / 100).toFixed(2)}
        </span>
      ))}
    </div>
  );
}

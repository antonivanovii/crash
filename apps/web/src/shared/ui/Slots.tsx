import { useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Слоты каркаса.
 *
 * Сайдбар и правая колонка принадлежат оболочке, но наполняет их страница:
 * в лобби это категории игр, в спорте — виды спорта и купон, в маркетах
 * сайдбара нет вовсе.
 *
 * Через портал, а не через контекст, по причине слоёв FSD: страница не может
 * импортировать из `app`, а `app` не должен знать про страницы. Портал
 * развязывает их — оболочка объявляет пустой контейнер, страница в него пишет.
 *
 * Пустой контейнер схлопывается правилом `:empty` в CSS, поэтому оболочке не
 * нужно состояние «есть ли сайдбар».
 */
export const SLOT_ID = {
  sidebar: 'kb-slot-sidebar',
  aside: 'kb-slot-aside',
} as const;

export type SlotId = (typeof SLOT_ID)[keyof typeof SLOT_ID];

/**
 * Регистр контейнеров. DOM здесь — внешняя система, и подписка на неё честнее,
 * чем поиск по id в эффекте: слот получает контейнер ровно тогда, когда
 * оболочка его смонтировала, и переживает её перемонтирование.
 */
const targets = new Map<string, HTMLElement | null>();
const listeners = new Set<() => void>();

function registerSlot(id: SlotId, element: HTMLElement | null): void {
  // Идемпотентность обязательна: React дёргает ref и при каждом ре-рендере
  // оболочки, а лишнее уведомление разбудило бы всех подписчиков впустую.
  if (targets.get(id) === element) return;

  targets.set(id, element);
  for (const listener of listeners) listener();
}

const refs = new Map<SlotId, (element: HTMLElement | null) => void>();

/**
 * Ref-колбэк для оболочки: `<aside ref={slotRef(SLOT_ID.sidebar)} />`.
 *
 * Колбэк мемоизирован по id и живёт вечно. Стрелка прямо в JSX была бы новой
 * функцией на каждый рендер, а React на смену идентичности ref отцепляет старый
 * и цепляет новый — то есть регистрировал бы слот заново без всякой причины.
 */
export function slotRef(id: SlotId): (element: HTMLElement | null) => void {
  let ref = refs.get(id);
  if (!ref) {
    ref = (element) => registerSlot(id, element);
    refs.set(id, ref);
  }
  return ref;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function Slot({ id, children }: { id: SlotId; children: ReactNode }) {
  const target = useSyncExternalStore(
    subscribe,
    () => targets.get(id) ?? null,
    () => null,
  );

  return target ? createPortal(children, target) : null;
}

/** Навигация раздела. Ставится страницей, ниже 1280 уезжает в шторку. */
export function SidebarSlot({ children }: { children: ReactNode }) {
  return <Slot id={SLOT_ID.sidebar}>{children}</Slot>;
}

/** Правая колонка: купон в спорте, панель торговли в маркетах. */
export function AsideSlot({ children }: { children: ReactNode }) {
  return <Slot id={SLOT_ID.aside}>{children}</Slot>;
}

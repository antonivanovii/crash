import { Placeholder } from '@/shared/ui';

/**
 * Страница-заглушка для маршрутов, заведённых заранее. Маршруты из карты
 * фронтенда стоят с самого начала: дерево навигации — решение архитектурное,
 * и перекраивать его на середине проекта дороже, чем поставить заглушку.
 */
export function StubPage({ title, note }: { title: string; note: string }) {
  return <Placeholder title={title} note={note} />;
}

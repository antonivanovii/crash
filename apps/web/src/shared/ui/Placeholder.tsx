/**
 * Заглушка раздела. Существует, чтобы маршруты из карты фронтенда были
 * заведены с самого начала: добавить экран в готовый маршрут дешевле, чем
 * перекраивать дерево навигации на середине проекта.
 */
export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="page">
      <h1 className="page__title">{title}</h1>
      <p className="page__stub">{note}</p>
    </div>
  );
}

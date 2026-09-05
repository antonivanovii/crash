import { serializeBigInts } from '@kobold/money';

/**
 * Подготовка значения для jsonb-колонки.
 *
 * Драйвер pg спокойно принимает bigint как значение NUMERIC — он вызывает
 * toString(). А вот bigint ВНУТРИ объекта, который едет в jsonb, роняет запрос:
 * pg сериализует такой параметр через JSON.stringify, а тот на bigint бросает
 * TypeError.
 *
 * Ловушка неприятна тем, что срабатывает только на тех играх, где в результат
 * попал bigint, и только в рантайме. Поэтому любой jsonb пишется через эту
 * функцию — и в схеме колонки, и в ревью это одно понятное место.
 */
export function toJsonb<T>(value: T): T {
  return serializeBigInts(value);
}

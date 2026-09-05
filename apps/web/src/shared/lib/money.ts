/**
 * Ввод игрока приходит строкой с точкой или запятой; на провод уходят
 * минорные единицы. Ни на одном шаге не появляется float — это ровно тот путь,
 * которым теряется копейка.
 */
export function toMinorUnits(input: string, scale = 2): string {
  const [whole = '0', frac = ''] = input.replace(',', '.').trim().split('.');
  return String(BigInt((whole || '0') + frac.padEnd(scale, '0').slice(0, scale)));
}

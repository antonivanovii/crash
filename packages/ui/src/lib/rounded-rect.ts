/**
 * Путь прямоугольника с разными радиусами углов.
 *
 * Макеты нарисованы на div'ах с `border-radius: 8px 8px 22px 22px`, а знак
 * и маскот должны быть SVG (иначе их не отдать в 16 px и не положить в спрайт).
 * Эта функция переносит ту же геометрию в path, включая правило CSS о том, что
 * пересекающиеся радиусы ужимаются пропорционально — без него углы разъезжаются.
 */
export function roundedRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radii: [topLeft: number, topRight: number, bottomRight: number, bottomLeft: number],
): string {
  let [tl, tr, br, bl] = radii;

  // Тот же клэмп, что применяет браузер к border-radius.
  const ratios = [
    tl + tr > 0 ? width / (tl + tr) : Infinity,
    bl + br > 0 ? width / (bl + br) : Infinity,
    tl + bl > 0 ? height / (tl + bl) : Infinity,
    tr + br > 0 ? height / (tr + br) : Infinity,
  ];
  const scale = Math.min(1, ...ratios);
  if (scale < 1) {
    tl *= scale;
    tr *= scale;
    br *= scale;
    bl *= scale;
  }

  const r = (n: number) => Number(n.toFixed(3));
  const right = x + width;
  const bottom = y + height;

  return [
    `M${r(x + tl)},${r(y)}`,
    `H${r(right - tr)}`,
    tr ? `A${r(tr)},${r(tr)} 0 0 1 ${r(right)},${r(y + tr)}` : '',
    `V${r(bottom - br)}`,
    br ? `A${r(br)},${r(br)} 0 0 1 ${r(right - br)},${r(bottom)}` : '',
    `H${r(x + bl)}`,
    bl ? `A${r(bl)},${r(bl)} 0 0 1 ${r(x)},${r(bottom - bl)}` : '',
    `V${r(y + tl)}`,
    tl ? `A${r(tl)},${r(tl)} 0 0 1 ${r(x + tl)},${r(y)}` : '',
    'Z',
  ]
    .filter(Boolean)
    .join(' ');
}

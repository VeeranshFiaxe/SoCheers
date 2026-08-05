/* The Paul Kalkbrenner dissolve grid. Tiles are rendered here and driven
   by lib/motion.ts, which finds them via [data-pixgrid]. They default to
   opacity:0 in CSS - grids that should start covering are set to 1 in JS,
   so a script-less load never hides the artwork behind black tiles. */
export default function PixGrid({
  cols,
  rows,
  className,
}: {
  cols: number;
  rows: number;
  className?: string;
}) {
  return (
    <div
      className={className ? `pixgrid ${className}` : "pixgrid"}
      data-pixgrid
      data-cols={cols}
      data-rows={rows}
      style={{ ["--cols" as string]: cols, ["--rows" as string]: rows }}
    >
      {Array.from({ length: cols * rows }, (_, i) => (
        <i key={i} />
      ))}
    </div>
  );
}

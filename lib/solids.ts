/* ------------------------------------------------------------------
   The design book's six solids (SoCheers Colors.jpg, and the tokens at the
   top of globals.css), in the order they are printed there. Two rows on
   this page are coloured out of it, and they use it differently.

   The awards ticker runs it straight: there are six shows, so one pass of
   the row is one pass of the palette and every show keeps its own colour
   on every repeat.

   The client wall cannot do that. It is thirty-odd names across three
   rows, so walking the palette in order would print a six-name rainbow
   twice per row and read as a pattern rather than as thirty brands. */
export const SOLIDS = [
  "var(--leaf)",
  "var(--sky)",
  "var(--tangerine)",
  "var(--logo)",
  "var(--purple)",
  "var(--pink)",
];

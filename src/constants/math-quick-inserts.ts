export interface QuickInsert {
  label: string;
  latex: string;
  description?: string;
}

/**
 * Quick insert symbols for inline math (short, single-line formulas)
 */
export const INLINE_QUICK_INSERTS: QuickInsert[] = [
  { label: "x²", latex: "x^2", description: "Superscript" },
  { label: "xₙ", latex: "x_n", description: "Subscript" },
  { label: "a/b", latex: "\\frac{a}{b}", description: "Fraction" },
  { label: "√", latex: "\\sqrt{x}", description: "Square root" },
  { label: "∑", latex: "\\sum_{i=1}^{n}", description: "Summation" },
  { label: "∫", latex: "\\int_{a}^{b}", description: "Integral" },
  { label: "α", latex: "\\alpha", description: "Alpha" },
  { label: "β", latex: "\\beta", description: "Beta" },
  { label: "π", latex: "\\pi", description: "Pi" },
  { label: "≈", latex: "\\approx", description: "Approximately" },
  { label: "≠", latex: "\\neq", description: "Not equal" },
  { label: "±", latex: "\\pm", description: "Plus-minus" },
];

/**
 * Quick insert structures for block math (multi-line, complex formulas)
 */
export const BLOCK_QUICK_INSERTS: QuickInsert[] = [
  // Include basic symbols
  ...INLINE_QUICK_INSERTS.slice(0, 6),

  // Advanced structures
  {
    label: "Matrix",
    latex: "\\begin{bmatrix}\na & b \\\\\nc & d\n\\end{bmatrix}",
    description: "2x2 Matrix",
  },
  {
    label: "Cases",
    latex:
      "\\begin{cases}\nx, & \\text{if } x > 0 \\\\\n-x, & \\text{if } x < 0\n\\end{cases}",
    description: "Piecewise function",
  },
  {
    label: "Align",
    latex: "\\begin{aligned}\n  x &= y \\\\\n  a &= b\n\\end{aligned}",
    description: "Aligned equations",
  },
  {
    label: "System",
    latex: "\\begin{cases}\n2x + y = 5 \\\\\nx - y = 1\n\\end{cases}",
    description: "System of equations",
  },
  {
    label: "Limit",
    latex: "\\lim_{x \\to \\infty}",
    description: "Limit",
  },
  {
    label: "Derivative",
    latex: "\\frac{d}{dx}",
    description: "Derivative",
  },
];

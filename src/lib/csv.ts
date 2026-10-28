/**
 * Formats one CSV cell: quoted, with embedded quotes doubled.
 * SECURITY: Values starting with = + - @ (or tab / CR) are prefixed with a single quote so
 * spreadsheet apps treat them as text instead of running them as formulas (CSV injection).
 */
export function csvCell(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  let text = String(val);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

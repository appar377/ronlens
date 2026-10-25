const paths: Record<string, string> = {
  search: '<circle cx="10" cy="10" r="7"/><path d="m15.3 15.3 6 6"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  bookmark: '<path d="M6 3h12a1 1 0 0 1 1 1v18l-7-5-7 5V4a1 1 0 0 1 1-1Z"/>',
  document: '<path d="M5 2h9l5 5v15H5Z"/><path d="M14 2v6h5M8 12h8M8 16h8"/>',
  question: '<path d="M7 8a5 5 0 1 1 8 4c-2 1-3 2-3 5"/><path d="M12 21v.1"/>',
  solution: '<path d="M9 19h6M10 22h4M9 17c0-4-4-4-4-9a7 7 0 0 1 14 0c0 5-4 5-4 9Z"/>',
  mechanism: '<path d="M4 13h3v9H4ZM11 4h3v18h-3ZM18 9h3v13h-3Z" fill="currentColor" stroke="none"/>',
  evidence: '<path d="M5 2h10l4 4v16H5Z"/><path d="M15 2v5h4M8 11h8M8 15h8M8 19h8"/>',
  discovery: '<circle cx="12" cy="4" r="3"/><circle cx="4" cy="19" r="3"/><circle cx="20" cy="19" r="3"/><path d="m10 7-5 9m9-9 5 9M7 19h10"/>',
  application: '<path d="m10 2-1 3-3 1-3-1-2 4 3 2v3l-3 2 2 4 3-1 3 1 1 3h4l1-3 3-1 3 1 2-4-3-2v-3l3-2-2-4-3 1-3-1-1-3Z"/><circle cx="12" cy="12" r="4"/>',
  next: '<path d="M9 19h6M10 22h4M9 17c0-4-4-4-4-9a7 7 0 0 1 14 0c0 5-4 5-4 9Z"/><path d="M10 7a2 2 0 1 1 3 2c-1 1-1 1-1 2m0 3v.1"/>',
};
export function icon(name: string): string {
  return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (paths[name] ?? paths.document) + "</svg>";
}

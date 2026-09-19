// Display helpers shared by the relation picker's pieces.
export function initialsOf(text) {
  return String(text || '')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(word => word[0].toUpperCase()).join('') || '?'
}

// What a search result row shows: its declared preview, else just the label.
export function rowView(row) {
  return {
    title: row.preview?.title || row.label,
    subtitle: row.preview?.subtitle || [],
    avatar: row.preview?.avatar?.url || null
  }
}

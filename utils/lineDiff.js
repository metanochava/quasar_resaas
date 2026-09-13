// Minimal line-based diff (classic LCS dynamic programming) - no new
// dependency (mega-prompt secção 34/82: "não introduzir nova
// dependência sem necessidade"). Good enough for the file sizes this
// IDE actually diffs (generated model/serializer/view files, single
// edited source files) - not meant for huge files.
export function lineDiff(originalText, modifiedText) {
  const a = (originalText ?? '').split('\n')
  const b = (modifiedText ?? '').split('\n')

  const n = a.length
  const m = b.length
  const lcs = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const rows = []
  let i = 0
  let j = 0

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      rows.push({ type: 'equal', text: a[i] })
      i++; j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      rows.push({ type: 'removed', text: a[i] })
      i++
    } else {
      rows.push({ type: 'added', text: b[j] })
      j++
    }
  }

  while (i < n) { rows.push({ type: 'removed', text: a[i] }); i++ }
  while (j < m) { rows.push({ type: 'added', text: b[j] }); j++ }

  return rows
}

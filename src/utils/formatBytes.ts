const UNITS = ['B', 'KB', 'MB', 'GB']

/**
 * Formata um número de bytes em string legível (ex: 1.4 KB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const index = Math.min(i, UNITS.length - 1)
  return `${parseFloat((bytes / Math.pow(k, index)).toFixed(decimals))} ${UNITS[index]}`
}

// ─── ZIP HANDLER ─────────────────────────────────────────────────────────────
// Wrapper JSZip para abrir, listar e extrair arquivos ZIP

import JSZip from 'jszip'

export interface ZipEntry {
  name: string
  size: number
  isDirectory: boolean
}

/**
 * Abre um arquivo ZIP e retorna a lista de arquivos dentro dele.
 */
export async function listZipEntries(file: File): Promise<ZipEntry[]> {
  const zip = await JSZip.loadAsync(file)
  const entries: ZipEntry[] = []
  zip.forEach((relativePath, zipEntry) => {
    entries.push({
      name: relativePath,
      size: 0,
      isDirectory: zipEntry.dir,
    })
  })
  return entries
}

/**
 * Extrai o conteúdo de um arquivo específico dentro do ZIP como string.
 */
export async function extractFileFromZip(file: File, targetPath: string): Promise<string> {
  const zip = await JSZip.loadAsync(file)
  const entry = zip.file(targetPath)
  if (!entry) throw new Error(`Arquivo não encontrado no ZIP: ${targetPath}`)
  return entry.async('string')
}

/**
 * Retorna todos os arquivos .html do ZIP, extraindo o primeiro encontrado por padrão.
 */
export async function extractHtmlFromZip(file: File): Promise<{ path: string; content: string }[]> {
  const zip = await JSZip.loadAsync(file)
  const results: { path: string; content: string }[] = []
  const htmlFiles = Object.keys(zip.files).filter(name => name.endsWith('.html') || name.endsWith('.htm'))
  for (const path of htmlFiles) {
    const entry = zip.file(path)
    if (entry && !entry.dir) {
      const content = await entry.async('string')
      results.push({ path, content })
    }
  }
  return results
}

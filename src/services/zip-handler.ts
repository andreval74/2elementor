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

// JSZip's 'string' type returns a binary (Latin-1) string — use uint8array + TextDecoder for correct UTF-8
async function readEntryAsUtf8(entry: JSZip.JSZipObject): Promise<string> {
  const bytes = await entry.async('uint8array')
  return new TextDecoder('utf-8').decode(bytes)
}

/**
 * Extrai o conteúdo de um arquivo específico dentro do ZIP como string UTF-8.
 */
export async function extractFileFromZip(file: File, targetPath: string): Promise<string> {
  const zip = await JSZip.loadAsync(file)
  const entry = zip.file(targetPath)
  if (!entry) throw new Error(`Arquivo não encontrado no ZIP: ${targetPath}`)
  return readEntryAsUtf8(entry)
}

/**
 * Retorna todos os arquivos .html do ZIP com conteúdo em UTF-8.
 */
export async function extractHtmlFromZip(file: File): Promise<{ path: string; content: string }[]> {
  const zip = await JSZip.loadAsync(file)
  const results: { path: string; content: string }[] = []
  const htmlFiles = Object.keys(zip.files).filter(name => name.endsWith('.html') || name.endsWith('.htm'))
  for (const path of htmlFiles) {
    const entry = zip.file(path)
    if (entry && !entry.dir) {
      const content = await readEntryAsUtf8(entry)
      results.push({ path, content })
    }
  }
  return results
}

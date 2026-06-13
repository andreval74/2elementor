import JSZip from 'jszip'

/**
 * Dispara o download de um arquivo de texto no browser.
 */
export function downloadTextFile(content: string, filename: string, mimeType = 'application/json; charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType })
  triggerDownload(blob, filename)
}

type ZipEntry = string | { base64: string }

/**
 * Cria um ZIP com múltiplos arquivos e dispara o download.
 * Aceita strings (texto/JSON) ou { base64: string } para binários (imagens, etc.).
 */
export async function downloadZip(files: Record<string, ZipEntry>, zipName = 'sections.zip'): Promise<void> {
  const zip = new JSZip()
  Object.entries(files).forEach(([name, content]) => {
    if (typeof content === 'string') {
      zip.file(name, content)
    } else {
      zip.file(name, content.base64, { base64: true })
    }
  })
  const blob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(blob, zipName)
}

/**
 * Copia texto para o clipboard do usuário.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

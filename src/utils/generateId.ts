/**
 * Gera um ID hexadecimal de 8 caracteres único por conversão.
 * Usado em todos os elementos do JSON Elementor.
 */
export function generateId(): string {
  return Math.random().toString(16).slice(2, 10)
}

/**
 * Garante unicidade verificando contra um Set de IDs já gerados.
 */
export function generateUniqueId(existing: Set<string>): string {
  let id = generateId()
  while (existing.has(id)) {
    id = generateId()
  }
  existing.add(id)
  return id
}

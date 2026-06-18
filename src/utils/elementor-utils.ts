// ─── ELEMENTOR UTILITIES ─────────────────────────────────────────────────────
// Helpers compartilhados pelos serviços que manipulam ElementorTemplate.

/**
 * Deep clone genérico via JSON round-trip.
 * Válido para objetos JSON-serializáveis (ElementorTemplate, PageSnapshot, etc.).
 * Garante que o objeto original nunca seja mutado pelo caller.
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T
}

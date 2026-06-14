import type { VisionProvider, ProviderId } from '@/types/vision.types'
import { geminiProvider } from './providers/gemini'
import { openrouterProvider } from './providers/openrouter'
import { togetherProvider } from './providers/together'
import { claudeProvider } from './providers/claude'
import { proxyProvider, isProxyAvailable } from './providers/proxy'

export { isProxyAvailable }

export const PROVIDERS: VisionProvider[] = [
  // Proxy sem chave aparece primeiro quando disponível (deploy com VITE_PROXY_URL)
  ...(isProxyAvailable ? [proxyProvider] : []),
  geminiProvider,      // FREE — 250 req/dia
  openrouterProvider,  // FREE — 50 req/dia
  togetherProvider,    // FREE* — $25 créditos
  claudeProvider,      // PAGO — máxima qualidade
]

export function getProvider(id: ProviderId | string): VisionProvider {
  return PROVIDERS.find(p => p.id === id) ?? PROVIDERS[0]
}

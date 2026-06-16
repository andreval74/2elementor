import type { VisionProvider } from '@/types/vision.types'
import { proxyProvider } from './providers/proxy'

export { isProxyAvailable } from './providers/proxy'

export const PROVIDERS: VisionProvider[] = [proxyProvider]

export function getProvider(_id?: string): VisionProvider {
  return proxyProvider
}

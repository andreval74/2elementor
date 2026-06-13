// [FUTURE: api-endpoint] — substituir localStorage por chamada de API (Fase 3)

import { useState, useCallback, useEffect } from 'react'
import { MAX_HISTORY } from '@/utils/constants'
import { generateId } from '@/utils/generateId'
import type { ConversionHistory, SectionExport, InputType } from '@/types/app.types'

const STORAGE_KEY = 'wk_elementor_history'

function loadFromStorage(): ConversionHistory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ConversionHistory[]) : []
  } catch {
    return []
  }
}

function saveToStorage(history: ConversionHistory[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // localStorage pode falhar em modo privado
  }
}

export interface UseHistoryReturn {
  history: ConversionHistory[]
  addToHistory: (params: { title: string; inputType: InputType; rawHtml: string; exports: SectionExport[] }) => void
  clearHistory: () => void
}

/**
 * Gerencia o histórico das últimas conversões no localStorage.
 * Interface idêntica à futura API — migração sem refatoração.
 */
export function useHistory(): UseHistoryReturn {
  const [history, setHistory] = useState<ConversionHistory[]>(loadFromStorage)

  useEffect(() => {
    saveToStorage(history)
  }, [history])

  const addToHistory = useCallback(
    ({ title, inputType, rawHtml, exports }: { title: string; inputType: InputType; rawHtml: string; exports: SectionExport[] }) => {
      const entry: ConversionHistory = {
        id: generateId(),
        timestamp: Date.now(),
        title,
        inputType,
        sectionsCount: exports.length,
        rawHtml,
        exports,
      }
      setHistory(prev => [entry, ...prev].slice(0, MAX_HISTORY))
    },
    []
  )

  const clearHistory = useCallback(() => setHistory([]), [])

  return { history, addToHistory, clearHistory }
}

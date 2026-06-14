// ─── APP TYPES ───────────────────────────────────────────────────────────────
// Estado global e tipos de suporte da aplicação

import type { Section } from './layout.types'
import type { ElementorTemplate } from './elementor.types'
import type { UIAnalysisResult } from './vision.types'

export type { UIAnalysisResult }

export type InputType = 'html' | 'zip' | 'image'

export type ConversionStatus = 'idle' | 'parsing' | 'mapping' | 'done' | 'error'

export interface TokenMap {
  WHATSAPP_NUMBER: string
  WHATSAPP_MSG: string
  EMAIL_CONTATO: string
  INSTAGRAM_URL: string
  LINKEDIN_URL: string
  FACEBOOK_URL: string
  NOME_EMPRESA: string
  TELEFONE: string
  SITE_URL: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface SectionExport {
  section: Section
  template: ElementorTemplate
  validation: ValidationResult
}

export interface ConversionHistory {
  id: string
  timestamp: number
  title: string
  inputType: InputType
  sectionsCount: number
  rawHtml: string
  exports: SectionExport[]
}

export interface AppState {
  inputType: InputType
  rawHtml: string
  sections: Section[]
  tokens: TokenMap
  exports: SectionExport[]
  history: ConversionHistory[]
  status: ConversionStatus
  errorMessage: string | null
}

export const DEFAULT_TOKENS: TokenMap = {
  WHATSAPP_NUMBER: '',
  WHATSAPP_MSG: 'Olá! Vim pelo site e gostaria de mais informações.',
  EMAIL_CONTATO: '',
  INSTAGRAM_URL: '',
  LINKEDIN_URL: '',
  FACEBOOK_URL: '',
  NOME_EMPRESA: '',
  TELEFONE: '',
  SITE_URL: '',
}

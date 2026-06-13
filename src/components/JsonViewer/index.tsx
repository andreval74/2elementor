import { useMemo } from 'react'
import { syntaxHighlight } from '@/utils/syntaxHighlight'

interface JsonViewerProps {
  json: string
  maxHeight?: string
}

export function JsonViewer({ json, maxHeight = '400px' }: JsonViewerProps) {
  const highlighted = useMemo(() => syntaxHighlight(json), [json])

  return (
    <div className="wk-json-viewer" style={{ maxHeight }}>
      <pre className="wk-json-pre" dangerouslySetInnerHTML={{ __html: highlighted }} />
    </div>
  )
}

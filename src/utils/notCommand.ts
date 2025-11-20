import { result } from 'lodash'
import path = require('path')
import * as vsc from 'vscode'

export const NOT_COMMAND = 'complete.notTemplate'

type NotPickItem = {
  label: string
  description: string
  detail: string
  range: vsc.Range
  text: string
}

type CleanupPayload = {
  range?: vsc.Range
  keyword?: string
}

const isCleanupPayload = (value: unknown): value is CleanupPayload => {
  if (!value || typeof value !== 'object') {
    return false
  }
  return ('keyword' in value) || ('range' in value)
}

export function notCommand(editor: vsc.TextEditor, cleanupRangeOrExpressions: any, maybeExpressions?: NotPickItem[], triggerDotRange?: vsc.Range) {
  let cleanupRange: vsc.Range | undefined
  let cleanupKeyword: string | undefined
  let expressions: NotPickItem[] = []

  // Support both call forms: (items) or (cleanupRange, items)
  if (Array.isArray(cleanupRangeOrExpressions)) {
    expressions = cleanupRangeOrExpressions as NotPickItem[]
  } else if (isCleanupPayload(cleanupRangeOrExpressions)) {
    cleanupRange = cleanupRangeOrExpressions.range
    cleanupKeyword = cleanupRangeOrExpressions.keyword
    expressions = Array.isArray(maybeExpressions) ? maybeExpressions : []
  } else {
    cleanupRange = cleanupRangeOrExpressions as vsc.Range | undefined
    expressions = Array.isArray(maybeExpressions) ? maybeExpressions : []
  }

  const startQuickPick = () => {
    return vsc.window.showQuickPick(expressions)
      .then(value => {
        if (!value) {
          return undefined
        }

        return editor.edit(e => {
          e.delete(value.range)

          // Remove trailing dot after the expression (postfix trigger)
          const doc = editor.document

          const fallbackRange = new vsc.Range(
            value.range.end,
            new vsc.Position(value.range.end.line, value.range.end.character + 1),
          )
          const dotRange = triggerDotRange ?? fallbackRange
          const nextChar = doc.getText(dotRange)

          if (nextChar === '.') {
            e.delete(dotRange)
          }

          // Insert inverted text
          e.insert(value.range.start, value.text)
        }).then(() => {
          // If inside an 'if' statement and no trailing ':', append ':' at EOL
          try {
            const line = editor.document.lineAt(value.range.start.line)

            if (/^\s*if\b/.test(line.text) && !line.text.trimEnd().endsWith(':')) {
              return editor.edit(ed => ed.insert(new vsc.Position(line.lineNumber, line.text.length), ':'))
            }
          } catch { /* noop */ }
          return undefined
        })
      })
  }

  if (cleanupRange) {
    const currentText = editor.document.getText(cleanupRange)
    const shouldCleanup = !cleanupKeyword || currentText === cleanupKeyword

    if (shouldCleanup) {
      return editor.edit(e => e.delete(cleanupRange)).then(startQuickPick, startQuickPick)
    }
  }

  return startQuickPick()
}

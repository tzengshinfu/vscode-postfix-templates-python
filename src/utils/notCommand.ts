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

export function notCommand(editor: vsc.TextEditor, cleanupRangeOrExpressions: any, maybeExpressions?: NotPickItem[], triggerDotRange?: vsc.Range) {
  let cleanupRange: vsc.Range | undefined
  let expressions: NotPickItem[] = []
  // Support both call forms: (items) or (cleanupRange, items)
  if (Array.isArray(cleanupRangeOrExpressions)) {
    expressions = cleanupRangeOrExpressions as NotPickItem[]
  } else {
    cleanupRange = cleanupRangeOrExpressions as vsc.Range | undefined
    expressions = Array.isArray(maybeExpressions) ? maybeExpressions : []
  }

  // Always cleanup the typed keyword (e.g., '.not' and trailing ':')
  if (cleanupRange) {
    editor.edit(e => e.delete(cleanupRange))
  }

  return vsc.window.showQuickPick(expressions)
    .then(value => {
      if (!value) {
        return undefined
      }

      return editor.edit(e => {
        // Delete the selected expression range
        e.delete(value.range)
        // Remove trailing dot after the expression (postfix trigger)
        const doc = editor.document
        const fallbackRange = new vsc.Range(
          value.range.end,
          new vsc.Position(value.range.end.line, value.range.end.character + 1),
        )
        const dotRange = triggerDotRange ?? fallbackRange
        const nextChar = doc.getText(dotRange)
        // TEMP: log dotRange info to provider.log for debugging
        try {
          const fs = require('fs') as typeof import('fs')
          const logPath = path.join(__dirname, '..', '..', '..', 'provider.log')
          console.log(logPath)
          const logLine = `${new Date().toISOString()} notCommand tex=(${value.text}) dotRange=(${dotRange.start.line},${dotRange.start.character})->(${dotRange.end.line},${dotRange.end.character}) nextChar="${nextChar.replace(/"/g, '""')}"\n`
          fs.appendFileSync(logPath, logLine)
        } catch {}
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
        } catch {}
        return undefined
      })
    })
}

import * as vsc from 'vscode'

export const NOT_COMMAND = 'complete.notTemplate'

type NotPickItem = {
  label: string
  description: string
  detail: string
  range: vsc.Range
  text: string
}

export function notCommand(editor: vsc.TextEditor, cleanupRangeOrExpressions: any, maybeExpressions?: NotPickItem[]) {
  let cleanupRange: vsc.Range | undefined
  let expressions: NotPickItem[]
  if (cleanupRangeOrExpressions && typeof cleanupRangeOrExpressions === 'object' && 'start' in cleanupRangeOrExpressions && 'end' in cleanupRangeOrExpressions) {
    cleanupRange = cleanupRangeOrExpressions as vsc.Range
    expressions = maybeExpressions || []
  } else {
    expressions = cleanupRangeOrExpressions as NotPickItem[]
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
        const dotPos = value.range.end
        const nextChar = doc.getText(new vsc.Range(dotPos, new vsc.Position(dotPos.line, dotPos.character + 1)))
        if (nextChar === '.') {
          e.delete(new vsc.Range(dotPos, new vsc.Position(dotPos.line, dotPos.character + 1)))
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

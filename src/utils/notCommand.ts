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
  // TODO:delete console.log('[' + new Date().toISOString() + ']; {notCommands.ts:16}:\n ' + '`' + editor.document.getText() + '`')
  // TODO: 查16~44行` \`消失原因
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
  // TODO:delete console.log('[' + new Date().toISOString() + ']; {notCommands.ts:27}:\n ' + '`' + editor.document.getText() + '`')

  const startQuickPick = () => {
    // TODO:delete console.log('[' + new Date().toISOString() + ']; {notCommands.ts:33}:\n ' + '`' + editor.document.getText() + '`')

    return vsc.window.showQuickPick(expressions)
      .then(value => {
        // TODO:delete console.log('[' + new Date().toISOString() + ']; {notCommands.ts:38}:\n ' + '`' + editor.document.getText() + '`')
        if (!value) {
          return undefined
        }

        return editor.edit(e => {
          // Delete the selected expression range
          const newRange = new vsc.Range(
            value.range.start,
            new vsc.Position(value.range.end.line, value.range.end.character + 20),
          )
          // TODO:delete console.log('[' + new Date().toISOString() + ']; {notCommands.ts:44}:\n ' + '`' + editor.document.getText(newRange) + '`')
          e.delete(value.range)
          // Remove trailing dot after the expression (postfix trigger)
          const doc = editor.document
          // TODO:delete console.log('[' + new Date().toISOString() + ']; {notCommands.ts:48}:\n ' + '`' + doc.getText() + '`')

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
            const logLine = `${new Date().toISOString()} notCommand text=(${value.text}) dotRange=(${dotRange.start.line},${dotRange.start.character})->(${dotRange.end.line},${dotRange.end.character}) nextChar="${nextChar.replace(/"/g, '""')}"\n`
            fs.appendFileSync(logPath, logLine)
          } catch {}
          if (nextChar === '.') {
            e.delete(dotRange)
              const lineText = doc.lineAt(dotRange.start.line).text ?? ''
              // TODO:delete console.log('[' + new Date().toISOString() + ']; {notCommands.ts:66}:\n ' + '`' + lineText + '`')
          }
          // Insert inverted text
          e.insert(value.range.start, value.text)
          // TODO:delete console.log('[' + new Date().toISOString() + '] {notCommands.ts:70}:\n ' + '`' + value.text + '`')
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

  if (cleanupRange) {
    const currentText = editor.document.getText(cleanupRange)
    const shouldCleanup = !cleanupKeyword || currentText === cleanupKeyword
    if (shouldCleanup) {
      return editor.edit(e => e.delete(cleanupRange)).then(startQuickPick, startQuickPick)
    }
  }

  return startQuickPick()
}

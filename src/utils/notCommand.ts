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

      editor.edit(e => {
        e.delete(value.range)
        e.insert(value.range.start, value.text)
      })
    })
}

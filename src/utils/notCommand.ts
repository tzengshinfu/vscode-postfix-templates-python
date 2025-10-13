import * as vsc from 'vscode'

export const NOT_COMMAND = 'complete.notTemplate'

type NotPickItem = {
  label: string
  description: string
  detail: string
  range: vsc.Range
  text: string
}

export function notCommand(editor: vsc.TextEditor, expressions: NotPickItem[]) {
  return vsc.window.showQuickPick(expressions)
    .then(value => {
      if (!value) {
        return undefined
      }

      editor.edit(e => {
        e.delete(value.range)
        e.insert(value.range.start, `not (${value.text})`)
      })
    })
}

import * as vsc from 'vscode'
import * as tree from './web-tree-sitter'
import * as sitter from './sitter'

export const NOT_COMMAND = 'complete.notTemplate'

export function notCommand(editor: vsc.TextEditor, expressions: tree.Node[]) {
  return vsc.window.showQuickPick(expressions.map(node => ({
    label: node.text.replace(/\s+/g, ' '),
    description: '',
    detail: 'Invert this expression',
    node
  })))
    .then(value => {
      if (!value) {
        return undefined
      }

      editor.edit(e => {
        const node = value.node

        const nodeStart = sitter.getLineAndCharacterOfPosition(node, sitter.getNodeStart(node))
        const nodeEnd = sitter.getLineAndCharacterOfPosition(node, sitter.getNodeEnd(node))

        const range = new vsc.Range(
          new vsc.Position(nodeStart.line, nodeStart.character),
          new vsc.Position(nodeEnd.line, nodeEnd.character + 1) // accomodate 1 character for the dot
        )

        e.delete(range)
        e.insert(range.start, `not (${sitter.getNodeText(value.node)})`)
      })
    })
}

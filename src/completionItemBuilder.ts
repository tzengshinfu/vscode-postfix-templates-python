import * as vsc from 'vscode'
import * as py from './utils/python'
import { adjustLeadingWhitespace, adjustMultilineIndentation } from './utils/multiline-expressions'
import { SnippetParser } from 'vscode-snippet-parser'
import { getConfigValue } from './utils/vscode-helpers'
import { IndentInfo } from './template'
import * as tree from './web-tree-sitter'

const RegexExpression = '{{expr(?::(upper|lower|capitalize))?}}'

export class CompletionItemBuilder {
  private item: vsc.CompletionItem
  private code: string
  private node: tree.Node

  private constructor(keyword: string, node: tree.Node, private indentInfo: IndentInfo) {
    this.node = node
    this.item = new vsc.CompletionItem({ label: keyword, description: 'POSTFIX' }, vsc.CompletionItemKind.Snippet)
    this.item.preselect = true
    this.item.sortText = '0000'
    this.item.filterText = keyword
    this.code = adjustMultilineIndentation(node.text, indentInfo?.indentSize)
  }

  public static create = (keyword: string, node: tree.Node, indentInfo: IndentInfo) => new CompletionItemBuilder(keyword, node, indentInfo)

  public command = (command: vsc.Command) => {
    this.item.command = command

    return this
  }

  public insertText = (insertText?: string) => {
    this.item.insertText = insertText

    if (insertText === '') {
      try {
        const { end: nodeEnd } = py.getNodePositions(this.node)
        const afterDot = new vsc.Position(nodeEnd.line, nodeEnd.character + 1)
        const label = (typeof this.item.label === 'object')
          ? (this.item.label as vsc.CompletionItemLabel).label
          : String(this.item.label ?? '')
        let editRange: vsc.Range | undefined
        const editor = vsc.window.activeTextEditor

        if (editor && label) {
          const candidateRange = new vsc.Range(afterDot, afterDot.translate(0, label.length))
          const candidateText = editor.document.getText(candidateRange)

          if (candidateText === label) {
            editRange = candidateRange
          }
        }

        this.item.textEdit = editRange
          ? vsc.TextEdit.replace(editRange, '')
          : vsc.TextEdit.insert(afterDot, '')
      } catch { /* noop */ }
    }

    return this
  }

  public replace = (replacement: string): CompletionItemBuilder => {
    this.addCodeBlockDescription(replacement, this.code.replace(/\\/g, '\\\\'))

    const { start: nodeStart, end: nodeEnd } = py.getNodePositions(this.node)

    const rangeToDelete = new vsc.Range(
      new vsc.Position(nodeStart.line, nodeStart.character),
      new vsc.Position(nodeEnd.line, nodeEnd.character + 1) /* accomodate 1 character for the dot */
    )

    // Also remove the typed template keyword after the dot (do not remove trailing ':')
    let labelRange: vsc.Range | undefined
    try {
      const editor = vsc.window.activeTextEditor
      if (editor) {
        const label = (typeof this.item.label === 'object') ? (this.item.label as vsc.CompletionItemLabel).label : String(this.item.label)
        const afterDot = new vsc.Position(nodeEnd.line, nodeEnd.character + 1)
        const typed = editor.document.getText(new vsc.Range(afterDot, afterDot.translate(0, label.length)))
        if (typed === label) {
          labelRange = new vsc.Range(afterDot, afterDot.translate(0, label.length))
        }
      }
    } catch { /* noop */ }

    const useSnippets = /(?<!\\)\$/.test(replacement)

    if (useSnippets) {
      const escapedCode = this.code
        .replace(/\\/g, '\\\\')
        .replace(/\$/g, '\\$')

      const snippetContent = adjustLeadingWhitespace(
        this.replaceExpression(replacement, escapedCode),
        this.indentInfo.leadingWhitespace
      )
      // Use SnippetString so VS Code expands $TM_* and tabstops
      this.item.insertText = new vsc.SnippetString(snippetContent)
      const edits: vsc.TextEdit[] = [
        vsc.TextEdit.delete(rangeToDelete)
      ]
      this.item.additionalTextEdits = edits
      /* align with insert text behavior below */
      this.item.keepWhitespace = true
    } else {
      const finalText = adjustLeadingWhitespace(
        this.replaceExpression(replacement.replace(/\\\$/g, '$$'), this.code),
        this.indentInfo.leadingWhitespace
      )
      const edits: vsc.TextEdit[] = [
        vsc.TextEdit.replace(rangeToDelete, finalText)
      ]
      // Ensure the typed keyword after the dot is removed
      try {
        const afterDot = new vsc.Position(nodeEnd.line, nodeEnd.character + 1)
        this.item.textEdit = labelRange
          ? vsc.TextEdit.replace(labelRange, '')
          : vsc.TextEdit.insert(afterDot, '')
      } catch { /* noop */ }
      this.item.additionalTextEdits = edits
    }

    return this
  }

  public description = (description: string): CompletionItemBuilder => {
    if (!description) {
      return this
    }

    this.item.documentation = new vsc.MarkdownString(description)

    return this
  }

  private addCodeBlockDescription = (replacement: string, inputCode: string) => {
    const addCodeBlock = (md: vsc.MarkdownString) => {
      const code = this.replaceExpression(replacement, inputCode)
      const snippetPreviewMode = getConfigValue<'raw' | 'inserted'>('snippetPreviewMode')

      return md.appendCodeblock(snippetPreviewMode === 'inserted' ? new SnippetParser().text(code) : code, 'python')
    }

    if (!this.item.documentation) {
      const md = new vsc.MarkdownString()
      addCodeBlock(md)
      this.item.documentation = md
    } else {
      addCodeBlock(this.item.documentation as vsc.MarkdownString)
    }
  }

  public build = () => this.item

  private replaceExpression = (replacement: string, code: string, customRegex?: string) => {
    const re = new RegExp(customRegex || RegexExpression, 'g')

    return replacement.replace(re, (_match, p1) => {
      if (p1 && this.filters[p1]) {
        return this.filters[p1](code)
      }
      return code
    })
  }

  private filters: { [key: string]: (x: string) => string } = {
    'upper': (x: string) => x.toUpperCase(),
    'lower': (x: string) => x.toLowerCase(),
    'capitalize': (x: string) => x.substring(0, 1).toUpperCase() + x.substring(1),
  }
}

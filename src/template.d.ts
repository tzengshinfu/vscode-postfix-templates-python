import * as vsc from 'vscode'
import * as tree from './web-tree-sitter'

export interface IPostfixTemplate {
  readonly templateName: string

  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo): vsc.CompletionItem

  canUse(node: tree.Node): boolean
}

export interface IndentInfo {
  indentSize?: number
  /** Leading whitespace characters of the first line of replacing node */
  leadingWhitespace?: string
}

import { CompletionItemBuilder } from '../completionItemBuilder'
import { IndentInfo } from '../template'
import { BaseExpressionTemplate } from './baseTemplates'
import * as tree from '../web-tree-sitter'

export class AwaitTemplate extends BaseExpressionTemplate {
  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    return CompletionItemBuilder
      .create('await', node, indentInfo)
      .replace('await {{expr}}$0')
      .build()
  }

  override canUse(node: tree.Node) {
    return !this.isTypeNode(node) && !this.inAssignmentStatement(node)
      && !this.isBinaryExpression(node) && !this.inAwaitedExpression(node) &&
      (this.isIdentifier(node) ||
        this.isExpression(node) ||
        this.isCallExpression(node))
  }
}

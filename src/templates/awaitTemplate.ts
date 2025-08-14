import { CompletionItemBuilder } from '../completionItemBuilder'
import { IndentInfo } from '../template'
import { BaseExpressionTemplate } from './baseTemplates'
import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'

export class AwaitTemplate extends BaseExpressionTemplate {
  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    return CompletionItemBuilder
      .create('await', node, indentInfo)
      .replace('await {{expr}}$0')
      .build()
  }

  override canUse(node: tree.Node) {
    return !py.isTypeNode(node)
      && !py.inAssignmentStatement(node)
      && !py.isBinaryExpression(node)
      && !py.inAwaitedExpression(node)
      && (py.isIdentifier(node)
        || py.isExpression(node)
        || py.isCallExpression(node))
  }
}

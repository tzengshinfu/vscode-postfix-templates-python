import * as vsc from 'vscode'
import { IndentInfo, IPostfixTemplate } from '../template'
import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'

export abstract class BaseTemplate implements IPostfixTemplate {
  constructor(public readonly templateName: string) {}

  abstract buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo): vsc.CompletionItem
  abstract canUse(node: tree.Node): boolean
}

export abstract class BaseExpressionTemplate extends BaseTemplate {
  abstract override buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo)

  canUse(node: tree.Node) {
    return !py.inIfStatement(node)
      && !py.isTypeNode(node)
      && !py.inAssignmentStatement(node)
      && (py.isIdentifier(node)
        || py.isExpression(node)
        || py.isPrefixUnaryExpression(node)
        || py.isBinaryExpression(node)
        || py.isCallExpression(node)
        || py.isAwaitExpression(node))
  }
}

import { IndentInfo } from "../template"
import { BaseTemplate } from "./baseTemplates"
import { CompletionItemBuilder } from "../completionItemBuilder"
import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'

export class CallTemplate extends BaseTemplate {
  constructor(private keyword: 'call') {
    super(keyword)
  }

  override buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    return CompletionItemBuilder
      .create(this.keyword, node, indentInfo)
      .replace('$1({{expr}})$0')
      .build()
  }

  override canUse(node: tree.Node) {
    return !py.inIfStatement(node)
      && !py.isTypeNode(node)
      && (py.isIdentifier(node)
        || py.isExpression(node)
        || py.isPrefixUnaryExpression(node)
        || py.isBinaryExpression(node)
        || py.isCallExpression(node)
        || py.isAwaitExpression(node))
  }
}

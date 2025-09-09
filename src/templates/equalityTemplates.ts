import { CompletionItemBuilder } from "../completionItemBuilder"
import { IndentInfo } from "../template"
import { BaseTemplate } from "./baseTemplates"
import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'

export class EqualityTemplate extends BaseTemplate {
  constructor(private keyword: string, private operator: string, private operand: string) {
    super(keyword)
  }

  override canUse(node: tree.Node) {
    return (py.isIdentifier(node)
      || py.isExpression(node)
      || py.isCallExpression(node))
      && (py.inReturnStatement(node)
        || py.inIfStatement(node)
        || py.inVariableDeclaration(node)
        || py.inAssignmentStatement(node))
      && !py.inBinaryExpression(node)
  }

  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    return CompletionItemBuilder
      .create(this.keyword, node, indentInfo)
      .replace(`{{expr}} ${this.operator} ${this.operand}`)
      .build()
  }
}

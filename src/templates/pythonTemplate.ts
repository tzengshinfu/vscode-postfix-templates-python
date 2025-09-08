import { IndentInfo } from "../template"
import { BaseTemplate } from "./baseTemplates"
import { CompletionItemBuilder } from "../completionItemBuilder"
import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'

export class PythonTemplate extends BaseTemplate {
  constructor(private keyword: string) {
    super(keyword)
  }

  override buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    return CompletionItemBuilder
      .create(this.keyword, node, indentInfo)
      .description('Python built-in functions')
      .replace(`${this.keyword}({{expr}})$0`)
      .build()
  }

  override canUse(node: tree.Node) {
    return !py.isTypeNode(node)
      && (py.isIdentifier(node)
        || py.isExpression(node)
        || py.isPrefixUnaryExpression(node)
        || py.isBinaryExpression(node)
        || py.isCallExpression(node))
  }
}

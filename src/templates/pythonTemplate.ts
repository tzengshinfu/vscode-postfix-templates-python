import { Node } from "typescript"
import { IndentInfo } from "../template"
import { BaseTemplate } from "./baseTemplates"
import { CompletionItemBuilder } from "../completionItemBuilder"

export class PythonTemplate extends BaseTemplate {
  constructor(private keyword: string) {
    super(keyword)
  }

  override buildCompletionItem(node: Node, indentInfo?: IndentInfo) {
    return CompletionItemBuilder.create(this.keyword, node, indentInfo)
      .description('Built-in Functions')
      .replace(`${this.keyword}({{expr}})$0`)
      .build()
  }

  override canUse(node: Node) {
    return !this.inIfStatement(node) && !this.isTypeNode(node) &&
      (this.isIdentifier(node) ||
        this.isExpression(node) ||
        this.isNewExpression(node) ||
        this.isUnaryExpression(node) ||
        this.isBinaryExpression(node) ||
        this.isCallExpression(node))
  }
}

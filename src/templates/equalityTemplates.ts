import ts = require("typescript")
import { CompletionItemBuilder } from "../completionItemBuilder"
import { IndentInfo } from "../template"
import { BaseTemplate } from "./baseTemplates"

export class EqualityTemplate extends BaseTemplate {
  constructor(private keyword: string, private operator: string, private operand: string, private isUndefinedTemplate?: boolean) {
    super(keyword)
  }

  override canUse(node: ts.Node) {
    return (this.isIdentifier(node) ||
      this.isExpression(node) ||
      this.isCallExpression(node))
      &&
      (this.inReturnStatement(node) ||
        this.inIfStatement(node) ||
        this.inVariableDeclaration(node) ||
        this.inAssignmentStatement(node))
  }

  buildCompletionItem(node: ts.Node, indentInfo?: IndentInfo) {
    return CompletionItemBuilder
      .create(this.keyword, node, indentInfo)
      .replace(`{{expr}} ${this.operator} ${this.operand}`)
      .build()
  }
}

import { CompletionItemBuilder } from '../completionItemBuilder'
import { BaseExpressionTemplate } from './baseTemplates'
import { getIndentCharacters } from '../utils'
import { invertExpression } from '../utils/invert-expression'
import { IndentInfo } from '../template'
import * as tree from '../web-tree-sitter'

abstract class BaseIfElseTemplate extends BaseExpressionTemplate {
  override canUse(node: tree.Node) {
    return super.canUse(node)
      && !this.inReturnStatement(node)
      && !this.inFunctionArgument(node)
      && !this.inVariableDeclaration(node)
      && !this.inAssignmentStatement(node)
  }
}

export class IfTemplate extends BaseIfElseTemplate {
  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    node = this.unwindBinaryExpression(node, false)
    const replacement = this.unwindBinaryExpression(node, true).text

    return CompletionItemBuilder
      .create('if', node, indentInfo)
      .replace(`if (${replacement}) {\n${getIndentCharacters()}\${0}\n}`)
      .build()
  }
}

export class ElseTemplate extends BaseIfElseTemplate {
  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    node = this.unwindBinaryExpression(node, false)
    const replacement = invertExpression(this.unwindBinaryExpression(node, true))

    return CompletionItemBuilder
      .create('else', node, indentInfo)
      .replace(`if (${replacement}) {\n${getIndentCharacters()}\${0}\n}`)
      .build()
  }
}

export class IfEqualityTemplate extends BaseIfElseTemplate {
  constructor(private keyword: string, private operator: string, private operand: string, private isUndefinedTemplate?: boolean) {
    super(keyword)
  }

  override canUse(node: tree.Node) {
    return super.canUse(node) && !this.isBinaryExpression(node)
  }

  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    return CompletionItemBuilder
      .create(this.keyword, node, indentInfo)
      .replace(`if ({{expr}} ${this.operator} ${this.operand}) {\n${getIndentCharacters()}\${0}\n}`)
      .build()
  }
}

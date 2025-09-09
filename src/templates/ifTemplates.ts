import { CompletionItemBuilder } from '../completionItemBuilder'
import { BaseExpressionTemplate } from './baseTemplates'
import { createIfTemplate } from '../utils/template-helpers'
import { invertExpression } from '../utils/invert-expression'
import { IndentInfo } from '../template'
import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'

abstract class BaseIfElseTemplate extends BaseExpressionTemplate {
  override canUse(node: tree.Node) {
    return super.canUse(node)
      && !py.inReturnStatement(node)
      && !py.inFunctionArgument(node)
      && !py.inVariableDeclaration(node)
      && !py.inAssignmentStatement(node)
  }
}

export class IfTemplate extends BaseIfElseTemplate {
  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    const { node: unwrappedNode, text } = py.unwrapNodeForTemplate(node)

    return CompletionItemBuilder
      .create('if', unwrappedNode, indentInfo)
      .replace(createIfTemplate(text))
      .build()
  }
}

export class IfElseTemplate extends BaseIfElseTemplate {
  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    const { node: unwrappedNode } = py.unwrapNodeForTemplate(node)
    const replacement = invertExpression(py.unwindBinaryExpression(unwrappedNode, true))

    return CompletionItemBuilder
      .create('ifelse', unwrappedNode, indentInfo)
      .replace(createIfTemplate(replacement, true))
      .build()
  }
}

export class IfEqualityTemplate extends BaseIfElseTemplate {
  constructor(private keyword: string, private operator: string, private operand: string, private isUndefinedTemplate?: boolean) {
    super(keyword)
  }

  override canUse(node: tree.Node) {
    return super.canUse(node) && !py.inBinaryExpression(node)
  }

  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    return CompletionItemBuilder
      .create(this.keyword, node, indentInfo)
      .replace(createIfTemplate(`{{expr}} ${this.operator} ${this.operand}`))
      .build()
  }
}

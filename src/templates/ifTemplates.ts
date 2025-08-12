import { CompletionItemBuilder } from '../completionItemBuilder'
import { BaseExpressionTemplate } from './baseTemplates'
import { getIndentCharacters } from '../utils'
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
    node = py.unwindBinaryExpression(node, false)
    const replacement = py.unwindBinaryExpression(node, true).text

    return CompletionItemBuilder
      .create('if', node, indentInfo)
      .replace(`if ${replacement}:\n${getIndentCharacters()}\${0}`)
      .build()
  }
}

export class IfElseTemplate extends BaseIfElseTemplate {
  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    node = py.unwindBinaryExpression(node, false)
    const replacement = invertExpression(py.unwindBinaryExpression(node, true))

    return CompletionItemBuilder
      .create('ifelse', node, indentInfo)
      .replace(`if ${replacement}:\n${getIndentCharacters()}\${0}\nelse:\n`)
      .build()
  }
}

export class IfEqualityTemplate extends BaseIfElseTemplate {
  constructor(private keyword: string, private operator: string, private operand: string, private isUndefinedTemplate?: boolean) {
    super(keyword)
  }

  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    return CompletionItemBuilder
      .create(this.keyword, node, indentInfo)
      .replace(`if {{expr}} ${this.operator} ${this.operand}: \n${getIndentCharacters()}\${0}`)
      .build()
  }

  override canUse(node: tree.Node) {
    return super.canUse(node) && !py.isBinaryExpression(node)
  }
}

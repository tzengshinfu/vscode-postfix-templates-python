import { CompletionItemBuilder } from '../completionItemBuilder'
import { IndentInfo } from '../template'
import { isStringLiteral } from '../utils/typescript'
import { BaseExpressionTemplate } from './baseTemplates'
import * as tree from '../web-tree-sitter'

export class ReturnTemplate extends BaseExpressionTemplate {
  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    node = this.unwindBinaryExpression(node)

    return CompletionItemBuilder
      .create('return', node, indentInfo)
      .replace('return {{expr}}')
      .build()
  }

  override canUse(node: tree.Node) {
    return (super.canUse(node) || this.isNewExpression(node) || this.isObjectLiteral(node) || (isStringLiteral(node) && this.isNotInSingleLineString(node)))
      && !this.inReturnStatement(node)
      && !this.inFunctionArgument(node)
      && !this.inVariableDeclaration(node)
      && !this.inAssignmentStatement(node)
  }
}

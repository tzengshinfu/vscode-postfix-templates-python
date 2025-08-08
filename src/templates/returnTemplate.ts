import { CompletionItemBuilder } from '../completionItemBuilder'
import { IndentInfo } from '../template'
import { BaseExpressionTemplate } from './baseTemplates'
import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'

export class ReturnTemplate extends BaseExpressionTemplate {
  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    node = py.unwindBinaryExpression(node)

    return CompletionItemBuilder
      .create('return', node, indentInfo)
      .replace('return {{expr}}')
      .build()
  }

  override canUse(node: tree.Node) {
    return (super.canUse(node)
      || py.isObjectLiteral(node)
      || py.isStringLiteral(node))
      && !py.inReturnStatement(node)
      && !py.inFunctionArgument(node)
      && !py.inVariableDeclaration(node)
      && !py.inAssignmentStatement(node)
  }
}

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
    // Allow return template even inside return statements for binary expressions
    // This allows things like "return x * 100.return" but prevents "return expr.return"
    const inReturn = py.inReturnStatement(node)
    const allowInReturn = inReturn && py.isBinaryExpression(node)
    
    return (super.canUse(node)
      || py.isObjectLiteral(node)
      || py.isStringLiteral(node))
      && (!inReturn || allowInReturn)
      && !py.inFunctionArgument(node)
      && !py.inVariableDeclaration(node)
      && !py.inAssignmentStatement(node)
      && !py.inIfStatement(node)
  }
}

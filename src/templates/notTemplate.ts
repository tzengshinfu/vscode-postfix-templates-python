import { CompletionItemBuilder } from '../completionItemBuilder'
import { BaseTemplate } from './baseTemplates'
import { NOT_COMMAND } from '../utils/notCommand'
import { IndentInfo } from '../template'
import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'
import { invertExpression } from '../utils/invert-expression'

export class NotTemplate extends BaseTemplate {
  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    node = this.normalizeBinaryExpression(node)

    const completionBuilder = CompletionItemBuilder
      .create('not', node, indentInfo)

    if (py.inBinaryExpression(node)) {
      const expressions = this.getBinaryExpressions(node)
      if (expressions.length > 1) {
        return completionBuilder
          .insertText('')
          .command({
            title: '',
            command: NOT_COMMAND,
            arguments: expressions
          })
          .description('`!expr` - *[multiple options]*')
          .build()
      }
    }

    const replacement = invertExpression(node, undefined)
    return completionBuilder
      .replace(replacement)
      .build()
  }

  canUse(node: tree.Node) {
    return !py.inTypeNode(node)
      && !py.isObjectLiteral(node) /* don't negate dict literals */
      && !py.isStringLiteral(node) /* don't negate string literals  */
      && (py.isExpression(node)
        || py.inPrefixUnaryExpression(node)
        || py.inBinaryExpression(node)
        || py.isCallExpression(node)
        || py.isIdentifier(node))
  }

  private isStrictEqualityOrInstanceofBinaryExpression = (node: tree.Node) => {
    if (py.inBinaryExpression(node)) {
      const operatorNode = node.namedChildren.find(child => child.type === 'comparison_operator')
      if (operatorNode) {
        const operatorText = operatorNode.text

        return operatorText === 'is' || operatorText === 'is not'
      }
    }

    if (py.isCallExpression(node) && node.firstNamedChild?.text === 'isinstance') {

      return true
    }

    return false
  }

  private getBinaryExpressions = (node: tree.Node) => {
    const possibleExpressions = [node]

    do {
      py.inBinaryExpression(node.parent) && possibleExpressions.push(node.parent)

      node = node.parent
    } while (node.parent)

    return possibleExpressions
  }

  private normalizeBinaryExpression = (node: tree.Node) => {
    if (node.parent
      && py.isParenthesizedExpression(node.parent)
      && node.parent.firstNamedChild
      && py.inBinaryExpression(node.parent.firstNamedChild)) {

      return node.parent
    }

    if (py.isPrefixUnaryExpression(node) && node.type === 'not_operator') {
      return node
    }

    if (node.parent && this.isStrictEqualityOrInstanceofBinaryExpression(node.parent)) {
      return node.parent
    }

    return node
  }
}

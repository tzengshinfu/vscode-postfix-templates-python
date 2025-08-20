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

    if (py.isBinaryExpression(node)) {
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
    return !py.isTypeNode(node)
      && (py.isExpression(node)
        || py.isPrefixUnaryExpression(node)
        || py.isPrefixUnaryExpression(node.parent)
        || py.isBinaryExpression(node)
        || py.isCallExpression(node)
        || py.isIdentifier(node)
        || py.isAwaitExpression(node))
  }

  private isStrictEqualityOrInstanceofBinaryExpression = (node: tree.Node) => {
    if (py.isBinaryExpression(node)) {
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
      py.isBinaryExpression(node.parent) && possibleExpressions.push(node.parent)

      node = node.parent
    } while (node.parent)

    return possibleExpressions
  }

  private normalizeBinaryExpression = (node: tree.Node) => {
    if (node.parent
      && py.isParenthesizedExpression(node.parent)
      && node.parent.firstNamedChild
      && py.isBinaryExpression(node.parent.firstNamedChild)) {

      return node.parent
    }

    if (py.isPrefixUnaryExpression(node) && node.type === 'not_operator') {
      return node
    }

    if (this.isStrictEqualityOrInstanceofBinaryExpression(node.parent)) {
      return node.parent
    }

    return node
  }
}

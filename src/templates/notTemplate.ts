import * as ts from 'typescript'
import { CompletionItemBuilder } from '../completionItemBuilder'
import { BaseTemplate } from './baseTemplates'
import { NOT_COMMAND } from '../notCommand'
import { invertExpression } from '../utils/invert-expression'
import { IndentInfo } from '../template'
import * as tree from '../web-tree-sitter'

export class NotTemplate extends BaseTemplate {
  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    node = this.normalizeBinaryExpression(node)

    const completionBuilder = CompletionItemBuilder
      .create('not', node, indentInfo)

    if (this.isBinaryExpression(node)) {
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
    return !this.isTypeNode(node) &&
      (this.isExpression(node)
        || this.isUnaryExpression(node)
        || this.isUnaryExpression(node.parent)
        || this.isBinaryExpression(node)
        || this.isCallExpression(node)
        || this.isIdentifier(node))
  }

  private isStrictEqualityOrInstanceofBinaryExpression = (node: tree.Node) => {
    return ts.isBinaryExpression(node) && [
      ts.SyntaxKind.EqualsEqualsEqualsToken,
      ts.SyntaxKind.ExclamationEqualsEqualsToken,
      ts.SyntaxKind.InstanceOfKeyword
    ].includes(node.operatorToken.kind)
  }

  private getBinaryExpressions = (node: tree.Node) => {
    const possibleExpressions = [node]

    do {
      this.isBinaryExpression(node.parent) && possibleExpressions.push(node.parent)

      node = node.parent
    } while (node.parent)

    return possibleExpressions
  }

  private normalizeBinaryExpression = (node: tree.Node) => {
    if (ts.isParenthesizedExpression(node.parent) && ts.isBinaryExpression(node.parent.expression)) {
      return node.parent
    }

    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
      return node
    }

    if (this.isStrictEqualityOrInstanceofBinaryExpression(node.parent)) {
      return node.parent
    }

    return node
  }
}

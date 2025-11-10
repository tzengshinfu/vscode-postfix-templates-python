import * as vsc from 'vscode'
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
        // Compute top-most binary expression for full inversion option
        let top: tree.Node = node
        while (top.parent && py.inBinaryExpression(top.parent)) {
          top = top.parent
        }
        const topPos = py.getNodePositions(top)
        // Extend range to include enclosing parenthesis if top is inside a parenthesized_expression
        const topEndPos = (top.parent && py.isParenthesizedExpression(top.parent) && top.parent.lastNamedChild?.id === top.id)
          ? py.getNodePositions(top.parent).end
          : topPos.end
        // Range for top: end at expression end (exclude typed dot); dot cleanup handled separately
        const topRange = new vsc.Range(
          new vsc.Position(topPos.start.line, topPos.start.character),
          new vsc.Position(topEndPos.line, topEndPos.character) // do NOT include dot or trailing space
        )
        const items = expressions.map(expr => {
          const exprPos = py.getNodePositions(expr)
          const exprEndPos = (expr.parent && py.isParenthesizedExpression(expr.parent) && expr.parent.lastNamedChild?.id === expr.id)
            ? py.getNodePositions(expr.parent).end
            : exprPos.end
          // For sub-expressions do not consume trailing space; keep range strictly over expression
          const exprRange = new vsc.Range(
            new vsc.Position(exprPos.start.line, exprPos.start.character),
            new vsc.Position(exprEndPos.line, exprEndPos.character)
          )
          const isTop = expr.id === top.id
          return {
            label: expr.text.replace(/\s+/g, ' '),
            description: '',
            detail: 'Invert this expression',
            range: isTop ? topRange : exprRange,
            text: invertExpression(expr) // suffix handled in notCommand
          }
        })
        return completionBuilder
          .insertText('')
          .command({ title: '', command: NOT_COMMAND, arguments: [this.getCleanupRange(node, 'not'), items] })
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
      && !py.isObjectLiteral(node)
      && !py.isStringLiteral(node)
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
    // Find the nearest binary expression ancestor
    let current: tree.Node | null = node
    while (current && !py.inBinaryExpression(current)) {
      current = current.parent
    }
    if (!current) {
      return []
    }

    // Climb to the top-most binary expression
    let top: tree.Node = current
    while (top.parent && py.inBinaryExpression(top.parent)) {
      top = top.parent
    }

    // Only offer quick-pick when it's a logical expression (and/or)
    let hasLogical = false
    for (let i = 0; i < top.childCount; i++) {
      const ch = top.child(i)
      if (ch && (ch.text === 'and' || ch.text === 'or')) {
        hasLogical = true
        break
      }
    }
    if (!hasLogical) {
      return [top]
    }

    // Split the top expression into left/right parts for quick-pick
    const left = top.firstNamedChild || top
    const right = top.lastNamedChild || top

    // Prefer offering the right-hand side first, then the whole expression, then left
    const result: tree.Node[] = []
    if (right && right.id !== top.id) {
      result.push(right)
    }
    if (top) {
      result.push(top)
    }
    if (left && left.id !== top.id && (!right || left.id !== right.id)) {
      result.push(left)
    }
    return result
  }

  private normalizeBinaryExpression = (node: tree.Node) => {
    if (node.parent
      && py.isParenthesizedExpression(node.parent)
      && node.parent.firstNamedChild
      && py.inBinaryExpression(node.parent.firstNamedChild)) {
      return node.parent
    }

    if (py.isPrefixUnaryExpression(node)) {
      return node
    }

    if (node.parent && this.isStrictEqualityOrInstanceofBinaryExpression(node.parent)) {
      return node.parent
    }

    if (node.parent && py.inBinaryExpression(node.parent)) {
      return py.unwindBinaryExpression(node.parent, false)
    }

    return node
  }

  private getCleanupRange(node: tree.Node, keyword: string): vsc.Range | undefined {
    try {
      const { end } = py.getNodePositions(node)
      const editor = vsc.window.activeTextEditor
      if (!editor) { return undefined }
      const doc = editor.document
      const dotPos = new vsc.Position(end.line, end.character)
      const afterDot = dotPos.translate(0, 1)
      if (doc.getText(new vsc.Range(dotPos, afterDot)) !== '.') { return undefined }
      const keywordRange = new vsc.Range(afterDot, afterDot.translate(0, keyword.length))
      if (doc.getText(keywordRange) !== keyword) { return undefined }
      // Only delete the keyword; keep the dot and any trailing ':' for cancel behavior
      return keywordRange
    } catch {
      return undefined
    }
  }
}

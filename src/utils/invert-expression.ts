import * as ts from 'typescript'
import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'

const operatorMapping = new Map<ts.SyntaxKind, ts.SyntaxKind>([
  [ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken],
  [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken],
  [ts.SyntaxKind.GreaterThanEqualsToken, ts.SyntaxKind.LessThanToken],
  [ts.SyntaxKind.GreaterThanToken, ts.SyntaxKind.LessThanEqualsToken]
])

const reverseMapping = new Map<ts.SyntaxKind, ts.SyntaxKind>()
operatorMapping.forEach((v, k) => reverseMapping.set(v, k))

const logicalOperatorMapping = new Map<ts.SyntaxKind, ts.SyntaxKind>([
  [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken],
  [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.AmpersandAmpersandToken]
])

export const invertBinaryExpression = (expr: ts.BinaryExpression, addOrBrackets = false): string => {
  let op = operatorMapping.get(expr.operatorToken.kind) || reverseMapping.get(expr.operatorToken.kind)
  if (op) {
    return `${expr.left.getText()} ${ts.tokenToString(op)} ${expr.right.getText()}`
  }

  op = logicalOperatorMapping.get(expr.operatorToken.kind)
  if (op) {
    const left = invertExpression(expr.left, op !== ts.SyntaxKind.BarBarToken)
    const right = invertExpression(expr.right, op !== ts.SyntaxKind.BarBarToken)
    const match = /^\s+/.exec(expr.right.getFullText())
    const leadingWhitespaces = match ? match[0] : ' '

    const result = `${left} ${ts.tokenToString(op)}${leadingWhitespaces + right}`

    return addOrBrackets && op === ts.SyntaxKind.BarBarToken ? `(${result})` : result
  }
}

export const invertExpression = (expr: tree.Node, addOrBrackets = false) => {
  const text = expr.text

  // not (expr) => expr
  const notWithBracketsPattern = /(not)(\s*)(\()(.*)(\))/g
  if (notWithBracketsPattern.test(text)) {
    return text.replace(notWithBracketsPattern, "$4")
  }

  // (x > y) => (x <= y)
  if (py.isParenthesizedExpression(expr) && py.isBinaryExpression(expr.expression)) {
    const result = invertBinaryExpression(expr.expression, addOrBrackets)
    if (result) {
      return `(${result})`
    }
  }

  // x > y => x <= y
  if (py.isBinaryExpression(expr)) {
    const result = invertBinaryExpression(expr, addOrBrackets)
    if (result) {
      return result
    }
  }

  const notPattern = /(not)(\s*)(.*)/g

  return notPattern.test(text) ? text.replace(notPattern, "$3") : `not ${text}`
}

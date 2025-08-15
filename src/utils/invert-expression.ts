import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'

// Python operator mapping for inversion
const operatorMapping = new Map<string, string>([
  ['==', '!='],
  ['!=', '=='],
  ['>=', '<'],
  ['>', '<='],
  ['<=', '>'],
  ['<', '>=']
])

const logicalOperatorMapping = new Map<string, string>([
  ['and', 'or'],
  ['or', 'and']
])

const getBinaryOperator = (node: tree.Node): string | undefined => {
  // For comparison_operator, binary_operator, boolean_operator nodes
  // Find the operator child node
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i)
    if (child && ['==', '!=', '>', '<', '>=', '<=', 'and', 'or'].includes(child.text)) {
      return child.text
    }
  }

  return undefined
}

const getLeftRightNodes = (node: tree.Node): { left: tree.Node | null, right: tree.Node | null } => {
  // For binary expressions, typically: left_expr operator right_expr
  const children = []

  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i)
    if (child && py.isExpression(child)) {
      children.push(child)
    }
  }

  return {
    left: children[0] || null,
    right: children[1] || null
  }
}

export const invertBinaryExpression = (expr: tree.Node, addOrBrackets = false): string | undefined => {
  const operator = getBinaryOperator(expr)
  if (!operator) {
    return undefined
  }

  const { left, right } = getLeftRightNodes(expr)
  if (!left || !right) {
    return undefined
  }

  let op = operatorMapping.get(operator)
  if (op) {
    return `${left.text} ${op} ${right.text}`
  }

  op = logicalOperatorMapping.get(operator)
  if (op) {
    const leftInverted = invertExpression(left, op !== 'or')
    const rightInverted = invertExpression(right, op !== 'or')

    const result = `${leftInverted} ${op} ${rightInverted}`

    return addOrBrackets && op === 'or' ? `(${result})` : result
  }

  return undefined
}

export const invertExpression = (expr: tree.Node, addOrBrackets = false): string => {
  const text = expr.text

  // not (x) => x
  if (py.isPrefixUnaryExpression(expr) && expr.childCount >= 2) {
    const operator = expr.child(0)
    const operand = expr.child(1)

    if (operator?.text === 'not') {
      if (operand && py.isParenthesizedExpression(operand)) {
        // Extract content from parentheses: not (x) => x
        const innerExpr = operand.firstNamedChild
        return innerExpr ? innerExpr.text : text
      } else if (operand) {
        // Handle unparenthesized expressions: not x => x
        return operand.text
      }
    }
  }

  // (x) => not (x)
  if (py.isParenthesizedExpression(expr)) {
    if (py.isIdentifier(expr.child(1))) {
      return `not ${text}`
    }
  }

  // (x > y) => (x <= y)
  if (py.isParenthesizedExpression(expr)
    && expr.firstNamedChild
    && py.isBinaryExpression(expr.firstNamedChild)) {
    const result = invertBinaryExpression(expr.firstNamedChild, addOrBrackets)
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

  const notPattern = /(not)(\s*)(.*)/

  if (notPattern.test(text)) {
    return text.replace(notPattern, "$3")
  } else if (py.isBinaryExpression(expr)) {
    return `not (${text})`
  } else {
    return `not ${text}`
  }
}

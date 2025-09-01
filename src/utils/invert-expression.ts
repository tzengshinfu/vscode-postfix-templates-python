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
    if (child && ['==', '!=', '>', '<', '>=', '<=', 'and', 'or', '*', '+', '-', '/', '%', '//', '**', '&', '|', '^', '<<', '>>', 'in', 'is'].includes(child.text)) {
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
    // Collect named nodes that are not operators
    if (child && child.isNamed && !['==', '!=', '>', '<', '>=', '<=', 'and', 'or', '*', '+', '-', '/', '%', '//', '**', '&', '|', '^', '<<', '>>', 'in', 'not', 'is'].includes(child.text)) {
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

  // not (x) => x or not x => x  
  // Check for not_operator node type specifically
  if (expr.type === 'not_operator' || py.isPrefixUnaryExpression(expr)) {
    // For not_operator, the structure is: not_operator -> 'not' -> operand
    // For unary_operator, the structure is: unary_operator -> operator -> operand
    if (expr.childCount >= 2) {
      const operator = expr.child(0)
      const operand = expr.child(1)

      if (operator?.text === 'not') {
        if (operand && py.isParenthesizedExpression(operand)) {
          // Extract content from parentheses: not (x) => x
          const innerExpr = operand.firstNamedChild
          // If the inner expression is a binary expression, return its text directly (like TypeScript version)
          if (innerExpr && py.isBinaryExpression(innerExpr)) {
            return innerExpr.text
          }
          return innerExpr ? innerExpr.text : operand.text.slice(1, -1) // Remove parentheses
        } else if (operand) {
          // Handle unparenthesized expressions: not x => x
          return operand.text
        }
      }
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

  // x > y => x <= y or x and y => not x or not y
  if (py.isBinaryExpression(expr)) {
    const result = invertBinaryExpression(expr, addOrBrackets)
    if (result) {
      return result
    }
  }

  // (x) => not (x)
  if (py.isParenthesizedExpression(expr)) {
    if (py.isIdentifier(expr.child(1))) {
      return `not ${text}`
    }
  }

  const notPattern = /(not)(\s*)(.*)/

  if (notPattern.test(text)) {
    return text.replace(notPattern, "$3")
  }

  // Follow TypeScript version logic more closely
  if (py.isBinaryExpression(expr)) {
    return text.startsWith('not ') ? text.substring(4) : `not (${text})`
  }

  // For non-binary expressions, follow TypeScript pattern: always without parentheses for simple cases
  return text.startsWith('not ') ? text.substring(4) : `not ${text}`
}

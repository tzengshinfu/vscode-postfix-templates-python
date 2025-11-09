import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'

/* Python operator mapping for inversion */
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
  /* For comparison_operator, binary_operator, boolean_operator nodes */
  /* Find the operator child node */
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i)
    if (child && ['==', '!=', '>', '<', '>=', '<=', 'and', 'or', '*', '+', '-', '/', '%', '//', '**', '&', '|', '^', '<<', '>>', 'in', 'is'].includes(child.text)) {
      return child.text
    }
  }

  return undefined
}

const getLeftRightNodes = (node: tree.Node): { left: tree.Node | null, right: tree.Node | null } => {
  /* Use first/last named children to capture full operands (handles chained/multiline attributes) */
  return {
    left: node.firstNamedChild || null,
    right: node.lastNamedChild || null
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
    /* Preserve original whitespace/newlines between operands for multiline logical expressions */
    const isLeftSimple = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(left.text.trim())
    const isRightSimple = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(right.text.trim())

    const leftInverted = invertExpression(left, !isLeftSimple && op !== 'or')
    const rightInverted = invertExpression(right, !isRightSimple && op !== 'or')

    const relativeLeftEnd = left.endIndex - expr.startIndex
    const relativeRightStart = right.startIndex - expr.startIndex
    let between = expr.text.slice(relativeLeftEnd, relativeRightStart)
    between = between.replace(/\b(and|or)\b/, op) // swap operator token but keep surrounding whitespace/backslashes

    const result = `${leftInverted}${between}${rightInverted}`

    return addOrBrackets && op === 'or' ? `(${result})` : result
  }

  return undefined
}

export const invertExpression = (expr: tree.Node, addOrBrackets = false): string => {
  const text = expr.text

  /* not (x) => x or not x => x  */
  /* Check for not_operator node type specifically */
  if (py.isPrefixUnaryExpression(expr)) {
    /* For not_operator, the structure is: not_operator -> 'not' -> operand */
    /* For unary_operator, the structure is: unary_operator -> operator -> operand */
    if (expr.childCount >= 2) {
      const operator = expr.child(0)
      const operand = expr.child(1)

      if (operator?.text === 'not') {
        if (operand && py.isParenthesizedExpression(operand)) {
          /* Extract content from parentheses: not (x) => x */
          const innerExpr = operand.firstNamedChild
          /* If the inner expression is a binary expression, return its text directly (like TypeScript version) */
          if (innerExpr && py.isBinaryExpression(innerExpr)) {
            return innerExpr.text
          }
          return innerExpr ? innerExpr.text : operand.text.slice(1, -1) /* Remove parentheses */
        } else if (operand) {
          /* Handle unparenthesized expressions: not x => x */
          return operand.text
        }
      }
    }
  }

  /* (x > y) => (x <= y) */
  if (py.isParenthesizedExpression(expr)
    && expr.firstNamedChild
    && py.isBinaryExpression(expr.firstNamedChild)) {
    const result = invertBinaryExpression(expr.firstNamedChild, addOrBrackets)
    if (result) {
      return `(${result})`
    }
  }

  /* x > y => x <= y or x and y => not x or not y */
  if (py.isBinaryExpression(expr)) {
    const result = invertBinaryExpression(expr, addOrBrackets)
    if (result) {
      return result
    }
  }

  /* (x) => not (x) */
  if (py.isParenthesizedExpression(expr)) {
    // Avoid producing double parentheses for already parenthesized expressions
    return `not ${text}`
  }

  const notPattern = /(not)(\s*)(.*)/

  if (notPattern.test(text)) {
    return text.replace(notPattern, "$3")
  }

  /* Check if this node itself is a binary expression (not its parent) */
  const binaryTypes = ['binary_operator', 'boolean_operator', 'comparison_operator']
  const isNodeItelfBinaryExpression = binaryTypes.includes(expr.type) ||
    (py.isParenthesizedExpression(expr) && expr.firstNamedChild && binaryTypes.includes(expr.firstNamedChild.type))

  if (isNodeItelfBinaryExpression) {
    return text.startsWith('not ') ? text.substring(4) : `not (${text})`
  }

  /* For non-binary logical expressions, we need to be more careful about operator precedence */
  /* If the expression is complex (contains operators), we should wrap it in parentheses */
  const hasOperators = /[+\-*/%<>=!&|^]/.test(text)
  const isSimpleIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(text)

  if (text.startsWith('not ')) {
    return text.substring(4)
  } else if (isSimpleIdentifier && !addOrBrackets) {
    /* For simple identifiers without forcing brackets, no parentheses needed */
    return `not ${text}`
  } else if (hasOperators || addOrBrackets) {
    /* For expressions with operators or when brackets are forced, wrap in parentheses */
    return `not (${text})`
  } else {
    /* For other cases (like numbers, strings), no parentheses needed */
    return `not ${text}`
  }
}

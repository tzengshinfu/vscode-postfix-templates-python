import * as tree from '../web-tree-sitter'

// Python tree-sitter node type checking functions
export const isArrayLiteral = (node: tree.Node): boolean => {
  return node.type === 'list'
}

export const isAwaitExpression = (node: tree.Node): boolean => {
  return node.type === 'await'
}

export const isBinaryExpression = (node: tree.Node): boolean => {
  return node.type === 'binary_operator'
    || node.type === 'boolean_operator'
    || node.type === 'comparison_operator'
}

export const isElementAccessExpression = (node: tree.Node): boolean => {
  return node.type === 'subscript'
}

export const isExpression = (node: tree.Node): boolean => {
  const expressionTypes = [
    'identifier', 'call', 'attribute', 'subscript',
    'binary_operator', 'boolean_operator', 'comparison_operator',
    'unary_operator', 'not_operator', 'string', 'integer', 'float',
    'list', 'dictionary', 'set', 'tuple'
  ]

  return expressionTypes.includes(node.type)
}

export const isParenthesizedExpression = (node: tree.Node): boolean => {
  return node.type === 'parenthesized_expression'
}

export const isPrefixUnaryExpression = (node: tree.Node): boolean => {
  return node.type === 'unary_operator' || node.type === 'not_operator'
}

// Position utility functions for tree-sitter nodes
export const getLineAndCharacterOfPosition = (node: tree.Node, offset: number): { line: number, character: number } => {
  // For tree-sitter nodes, we can get position directly
  if (offset === node.startIndex) {
    return { line: node.startPosition.row, character: node.startPosition.column }
  } else if (offset === node.endIndex) {
    return { line: node.endPosition.row, character: node.endPosition.column }
  }

  // Fallback to start position
  return { line: node.startPosition.row, character: node.startPosition.column }
}

// Node text and range utilities
export const getNodeStart = (node: tree.Node): number => {
  return node.startIndex
}

export const getNodeEnd = (node: tree.Node): number => {
  return node.endIndex
}

export const getNodeText = (node: tree.Node): string => {
  return node.text
}

// Specific Python node checks
export const isIdentifier = (node: tree.Node): boolean => {
  return node.type === 'identifier'
}

export const isCallExpression = (node: tree.Node): boolean => {
  return node.type === 'call'
}

export const isPropertyAccessExpression = (node: tree.Node): boolean => {
  return node.type === 'attribute'
}

// Additional helper functions for templates
export const isStringLiteral = (node: tree.Node): boolean => {
  return node.type === 'string'
}

export const isTypeNode = (node: tree.Node): boolean => {
  return node.type === 'type'
}

// Context checking functions for Python AST
export const isObjectLiteral = (node: tree.Node): boolean => {
  // Python equivalent would be dictionary literals
  return node.type === 'dictionary'
}

export const isAnyFunction = (node: tree.Node): boolean => {
  return node.type === 'function_definition'
    || node.type === 'lambda'
    || node.type === 'async_function_definition'
}

export const inReturnStatement = (node: tree.Node): boolean => {
  if (isAnyFunction(node)) {
    return false
  }

  if (node.type === 'return_statement') {
    return true
  }

  return node.parent ? inReturnStatement(node.parent) : false
}

export const isSimpleExpression = (node: tree.Node): boolean => {
  return node.type === 'expression_statement' && !isStringLiteral(node)
}

export const inFunctionArgument = (node: tree.Node): boolean => {
  return node.parent?.type === 'argument_list'
}

export const inVariableDeclaration = (node: tree.Node): boolean => {
  if (isAnyFunction(node)) {
    return false
  }

  // Python assignment statements
  if (node.type === 'assignment' || node.parent?.type === 'assignment') {
    return true
  }

  return node.parent ? inVariableDeclaration(node.parent) : false
}

export const inAssignmentStatement = (node: tree.Node): boolean => {
  if (isAnyFunction(node)) {
    return false
  }

  // Check if we're in an assignment context
  if (node.type === 'assignment') {
    return true
  }

  // Check if parent is assignment and we're on the left side
  if (node.parent?.type === 'assignment') {
    return node.parent.namedChildren[0] === node
  }

  return node.parent ? inAssignmentStatement(node.parent) : false
}

export const inIfStatement = (node: tree.Node, expressionNode?: tree.Node): boolean => {
  if (node.type === 'if_statement') {
    if (!expressionNode) {
      return true
    }

    // Check if expressionNode is the condition of this if statement
    return node.namedChildren[0] === expressionNode
  }

  return node.parent ? inIfStatement(node.parent, node) : false
}

export const inAwaitedExpression = (node: tree.Node): boolean => {
  if (isAnyFunction(node)) {
    return false
  }

  return node.type === 'await' || (node.parent && inAwaitedExpression(node.parent))
}

export const unwindBinaryExpression = (node: tree.Node, removeParens = true): tree.Node => {
  let binaryExpression: tree.Node | undefined

  if (
    removeParens
    && node.type === 'parenthesized_expression'
    && node.namedChildren[0]?.type === 'binary_operator'
  ) {
    binaryExpression = node.namedChildren[0]
  } else {
    // Find the binary expression upwards
    let current = node.parent
    while (current) {
      if (current.type === 'binary_operator'
        || current.type === 'boolean_operator'
        || current.type === 'comparison_operator') {
        binaryExpression = current

        break
      }

      current = current.parent
    }
  }

  // Continue expanding upwards to the top-level binary expression
  while (
    binaryExpression?.parent
    && (binaryExpression.parent.type === 'binary_operator'
      || binaryExpression.parent.type === 'boolean_operator'
      || binaryExpression.parent.type === 'comparison_operator')
  ) {
    binaryExpression = binaryExpression.parent
  }

  return binaryExpression ?? node
}

import * as tree from '../web-tree-sitter'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Parser, Language } = require('web-tree-sitter')

// Python tree-sitter node type checking functions
export const isArrayLiteral = (node: tree.Node | null | undefined): boolean => {
  return node?.type === 'list' || getUnwrappedNode(node)?.type === 'list'
}

export const isAwaitExpression = (node: tree.Node | null | undefined): boolean => {
  return node?.type === 'await' || getUnwrappedNode(node)?.type === 'await'
}

export const isBinaryExpression = (node: tree.Node | null | undefined): boolean => {
  if (!node) {
    return false
  }

  const binaryTypes = ['binary_operator', 'boolean_operator', 'comparison_operator']

  // Check if the node itself is a binary expression
  if (binaryTypes.includes(node.type) || binaryTypes.includes(getUnwrappedNode(node)?.type)) {
    return true
  }

  // Check if it's a parenthesized binary expression
  if (isParenthesizedExpression(node) && node.firstNamedChild && binaryTypes.includes(node.firstNamedChild.type)) {
    return true
  }

  // Check parent node recursively (like TypeScript version)
  return node.parent ? isBinaryExpression(node.parent) : false
}

export const isElementAccessExpression = (node: tree.Node | null | undefined): boolean => {
  return node?.type === 'subscript' || getUnwrappedNode(node)?.type === 'subscript'
}

export const isExpression = (node: tree.Node | null | undefined): boolean => {
  return (node?.type === 'expression_statement' || getUnwrappedNode(node)?.type === 'expression_statement')
    || (node?.type === 'attribute' || getUnwrappedNode(node)?.type === 'attribute')
    || (node?.type === 'subscript' || getUnwrappedNode(node)?.type === 'subscript')
}

export const isParenthesizedExpression = (node: tree.Node | null | undefined): boolean => {
  // There is no need to call `getUnwrappedNode` because the bottom node cannot be a parenthesized_expression
  return node?.type === 'parenthesized_expression'
}

export const isPrefixUnaryExpression = (node: tree.Node | null | undefined): boolean => {
  const unaryTypes = ['unary_operator', 'not_operator']

  return unaryTypes.includes(node?.type) || unaryTypes.includes(getUnwrappedNode(node)?.type)
}

// Utility function to get the unwrapped node (inner node without parentheses)
export const getUnwrappedNode = (node: tree.Node | null | undefined): tree.Node | null => {
  if (!node) {
    return null
  }

  let current = node
  while (current && current.type === 'parenthesized_expression') {
    current = current.firstNamedChild
  }

  return current
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

// Specific Python node checks
export const isIdentifier = (node: tree.Node | null | undefined): boolean => {
  return node?.type === 'identifier' || getUnwrappedNode(node)?.type === 'identifier'
}

export const isCallExpression = (node: tree.Node | null | undefined): boolean => {
  return node?.type === 'call' || getUnwrappedNode(node)?.type === 'call'
}

export const isPropertyAccessExpression = (node: tree.Node | null | undefined): boolean => {
  return node?.type === 'attribute' || getUnwrappedNode(node)?.type === 'attribute'
}

// New helper functions to distinguish different call patterns
export const isConstructorCall = (node: tree.Node | null | undefined): boolean => {
  if (!node || (node.type !== 'call' && getUnwrappedNode(node)?.type !== 'call')) {
    return false
  }

  // Get the actual call node (unwrap if parenthesized)
  const callNode = node.type === 'call' ? node :
    (getUnwrappedNode(node)?.type === 'call' ? getUnwrappedNode(node) : null)

  if (!callNode) {
    return false
  }

  // Check if the function being called is a direct identifier (not an attribute)
  const functionNode = callNode.firstNamedChild

  return functionNode?.type === 'identifier'
}

export const isMethodCall = (node: tree.Node | null | undefined): boolean => {
  if (!node || (node.type !== 'call' && getUnwrappedNode(node)?.type !== 'call')) {
    return false
  }

  // Get the actual call node (unwrap if parenthesized)
  const callNode = node.type === 'call' ? node :
    (getUnwrappedNode(node)?.type === 'call' ? getUnwrappedNode(node) : null)

  if (!callNode) {
    return false
  }

  // Check if the function being called is an attribute (object.method)
  const functionNode = callNode.firstNamedChild

  return functionNode?.type === 'attribute'
}

export const isFunctionCall = (node: tree.Node | null | undefined): boolean => {
  return isConstructorCall(node) // In Python, function calls and constructor calls have the same structure
}

export const isChainedMethodCall = (node: tree.Node | null | undefined): boolean => {
  if (!isMethodCall(node)) {
    return false
  }

  // Get the actual call node (unwrap if parenthesized)
  const callNode = node?.type === 'call' ? node : getUnwrappedNode(node)
  if (!callNode) {
    return false
  }

  // Check if the object being called is itself a method call
  const attributeNode = callNode.firstNamedChild  // should be 'attribute'
  const objectNode = attributeNode?.firstNamedChild  // the object part

  return objectNode?.type === 'call' || getUnwrappedNode(objectNode)?.type === 'call'
}

// Additional helper functions for templates
export const isStringLiteral = (node: tree.Node | null | undefined): boolean => {
  return node?.type === 'string' || getUnwrappedNode(node)?.type === 'string'
}

export const isTypeNode = (node: tree.Node | null | undefined): boolean => {
  return node?.type === 'type' || getUnwrappedNode(node)?.type === 'type'
}

// Context checking functions for Python AST
export const isObjectLiteral = (node: tree.Node | null | undefined): boolean => {
  // Python equivalent would be dictionary literals
  return node?.type === 'dictionary' || getUnwrappedNode(node)?.type === 'dictionary'
}

export const isAnyFunction = (node: tree.Node | null | undefined): boolean => {
  const functionTypes = ['function_definition', 'lambda', 'async_function_definition']

  return functionTypes.includes(node?.type) || functionTypes.includes(getUnwrappedNode(node)?.type)
}

export const inReturnStatement = (node: tree.Node | null | undefined): boolean => {
  if (!node || isAnyFunction(node)) {
    return false
  }

  if (node.type === 'return_statement') {
    return true
  }

  return node.parent ? inReturnStatement(node.parent) : false
}

export const inFunctionArgument = (node: tree.Node | null | undefined): boolean => {
  return node?.parent?.type === 'argument_list'
}

export const inVariableDeclaration = (node: tree.Node | null | undefined): boolean => {
  if (!node || isAnyFunction(node)) {
    return false
  }

  // Python assignment statements
  if (node.type === 'assignment' || node.parent?.type === 'assignment') {
    return true
  }

  return node.parent ? inVariableDeclaration(node.parent) : false
}

export const inAssignmentStatement = (node: tree.Node | null | undefined): boolean => {
  if (!node || isAnyFunction(node)) {
    return false
  }

  // Check if we're in an assignment context
  if (node.type === 'assignment') {
    return true
  }

  // Check if parent is assignment and we're on the left side
  if (node.parent?.type === 'assignment') {
    return node.parent.firstNamedChild === node
  }

  return node.parent ? inAssignmentStatement(node.parent) : false
}

export const inIfStatement = (node: tree.Node | null | undefined, expressionNode?: tree.Node | null | undefined): boolean => {
  if (!node) {
    return false
  }

  if (node.type === 'if_statement') {
    if (!expressionNode) {
      return true
    }

    // Check if expressionNode is the condition of this if statement
    return node.firstNamedChild === expressionNode
  }

  return node.parent ? inIfStatement(node.parent, node) : false
}

export const inAwaitedExpression = (node: tree.Node | null | undefined): boolean => {
  if (!node || isAnyFunction(node)) {
    return false
  }

  return node.type === 'await' || (node.parent ? inAwaitedExpression(node.parent) : false)
}

export const unwindBinaryExpression = (node: tree.Node, removeParens = true): tree.Node => {
  let binaryExpression: tree.Node | undefined

  if (
    removeParens
    && isParenthesizedExpression(node)
    && isBinaryExpression(node.firstNamedChild)
  ) {
    binaryExpression = node.firstNamedChild
  } else {
    // Find the binary expression upwards
    let current = node.parent
    while (current) {
      if (isBinaryExpression(current)) {
        binaryExpression = current

        break
      }

      current = current.parent
    }
  }

  // Continue expanding upwards to the top-level binary expression
  while (
    binaryExpression?.parent && isBinaryExpression(binaryExpression.parent)
  ) {
    binaryExpression = binaryExpression.parent
  }

  return binaryExpression ?? node
}

/**
 * Finds the appropriate AST node before a dot position in Python code.
 * This function traverses up the AST to find the complete expression node
 * that should be used for postfix completion.
 *
 * @param parser - The tree-sitter parser instance
 * @param text - The full text content
 * @param dotOffset - The offset position of the dot
 * @returns The AST node representing the expression before the dot, or null if not found
 */
export const findNodeBeforeDot = (parser: tree.Parser, text: string, dotOffset: number): tree.Node | null => {
  const textBeforeDot = text.slice(0, dotOffset)
  const textAfterDot = text.slice(dotOffset + 1)
  const textReplaceDotWithSpace = textBeforeDot + " " + textAfterDot
  const syntaxTree = parser.parse(textReplaceDotWithSpace)
  const findNamedNode = (node: tree.Node | null): tree.Node | null => {
    if (!node) {
      return null
    }

    // 如果當前節點是 unNamed token（如標點符號），向上查找到有意義的 named 節點
    let currentNode = node

    if (!currentNode.isNamed) {
      // 向上查找直到找到 named 節點
      while (currentNode.parent) {
        currentNode = currentNode.parent
        if (currentNode.isNamed) {
          break
        }
      }
    }

    if (['module', 'ERROR', 'comment'].includes(currentNode.type)) {
      return null
    }

    // Ensure the dot is at the end of the node
    if (currentNode.endIndex !== dotOffset) {
      return null
    }

    return currentNode
  }

  let treeNode = syntaxTree.rootNode.descendantForIndex(dotOffset - 1)
  if (!treeNode) {
    syntaxTree.delete()
    return null
  }

  treeNode = findNamedNode(treeNode)
  if (!treeNode) {
    syntaxTree.delete()
    return null
  }

  // for @x
  if (treeNode.parent?.type === 'decorator') {
    syntaxTree.delete()
    return null
  }

  // for f-strings interpolation
  if (treeNode.type === 'interpolation') {
    syntaxTree.delete()
    return null
  }

  // for string
  if (treeNode.type === 'string_end') {
    return treeNode.parent
  }

  // for x.y
  if (treeNode.parent?.type === 'attribute') {
    return treeNode.parent
  }

  // for x(y, z)
  if (treeNode.parent?.type === 'call') {
    return treeNode.parent
  }

  // NOTE: syntaxTree is intentionally not deleted here
  // The returned node depends on this tree remaining alive
  // The caller is responsible for cleaning up by calling node.tree.delete()
  return treeNode
}

export const unwrapNodeForTemplate = (node: tree.Node): { node: tree.Node, text: string } => {
  const unwrapped = unwindBinaryExpression(node, false)
  const textNode = unwindBinaryExpression(unwrapped, true)
  return { node: unwrapped, text: textNode.text }
}

export const getNodePositions = (node: tree.Node): { start: { line: number, character: number }, end: { line: number, character: number } } => {
  return {
    start: getLineAndCharacterOfPosition(node, node.startIndex),
    end: getLineAndCharacterOfPosition(node, node.endIndex)
  }
}

// Parser initialization utilities
/**
 * Initialize a tree-sitter parser for Python
 * @param wasmPath - Path to the tree-sitter-python.wasm file
 * @returns Promise that resolves to initialized parser
 */
export async function createPythonParser(wasmPath: string): Promise<tree.Parser> {
  await Parser.init()
  const Python: tree.Language = await Language.load(wasmPath)
  const parser = new Parser()
  parser.setLanguage(Python)
  return parser
}

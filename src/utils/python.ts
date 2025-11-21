import * as tree from '../web-tree-sitter'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const { Parser, Language } = require('web-tree-sitter')

/* Python tree-sitter node type checking functions */
export const isArrayLiteral = (node: tree.Node | null | undefined): boolean => {
  return Boolean(['list']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

export const isAwaitExpression = (node: tree.Node | null | undefined): boolean => {
  return Boolean(['await']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

export const isBinaryExpression = (node: tree.Node | null | undefined): boolean => {
  return Boolean(['binary_operator', 'boolean_operator', 'comparison_operator']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

export const isElementAccessExpression = (node: tree.Node | null | undefined): boolean => {
  return Boolean(['subscript']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

export const isExpression = (node: tree.Node | null | undefined): boolean => {
  return Boolean([
    ...['expression_statement'],
    ...['attribute', 'subscript'],
    ...['integer', 'float'],
    ...['true', 'false', 'none'],
    ...['list', 'tuple', 'set', 'dictionary']
  ].filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

export const isParenthesizedExpression = (node: tree.Node | null | undefined): boolean => {
  /* There is no need to call `unwrappedNode` because the bottom node cannot be a parenthesized_expression */
  return Boolean(['parenthesized_expression']
    .filter(t => [node?.type].includes(t)).length)
}

export const isPrefixUnaryExpression = (node: tree.Node | null | undefined): boolean => {
  return Boolean(['unary_operator', 'not_operator']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

export const isUnaryOperator = (node: tree.Node | null | undefined): boolean => {
  return Boolean(['unary_operator']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

export const isNotOperator = (node: tree.Node | null | undefined): boolean => {
  return Boolean(['not_operator']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

/* Utility function to get the unwrapped node (inner node without parentheses) */
export const unwrappedNode = (node: tree.Node | null | undefined): tree.Node | null => {
  if (!node) {
    return null
  }

  let current = node
  while (isParenthesizedExpression(current)) {
    current = current.firstNamedChild
  }

  return current
}

/* Position utility functions for tree-sitter nodes */
export const getLineAndCharacterOfPosition = (node: tree.Node, offset: number): { line: number, character: number } => {
  /* For tree-sitter nodes, we can get position directly */
  if (offset === node.startIndex) {
    return { line: node.startPosition.row, character: node.startPosition.column }
  } else if (offset === node.endIndex) {
    return { line: node.endPosition.row, character: node.endPosition.column }
  }

  /* Fallback to start position */
  return { line: node.startPosition.row, character: node.startPosition.column }
}

/* Specific Python node checks */
export const isIdentifier = (node: tree.Node | null | undefined): boolean => {
  return Boolean(['identifier']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

export const isCallExpression = (node: tree.Node | null | undefined): boolean => {
  return Boolean(['call']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

export const isPropertyAccessExpression = (node: tree.Node | null | undefined): boolean => {
  return Boolean(['attribute']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

/* New helper functions to distinguish different call patterns */
export const isConstructorCall = (node: tree.Node | null | undefined): boolean => {
  if (!isCallExpression(node)) {
    return false
  }

  /* Get the actual call node (unwrap if parenthesized) */
  const callNode = isCallExpression(node) ? node :
    (isCallExpression(unwrappedNode(node)) ? unwrappedNode(node) : null)
  if (!callNode) {
    return false
  }

  /* Check if the function being called is a direct identifier (not an attribute) */
  const functionNode = callNode.firstNamedChild

  return functionNode?.type === 'identifier'
}

export const isMethodCall = (node: tree.Node | null | undefined): boolean => {
  if (!isCallExpression(node)) {
    return false
  }

  /* Get the actual call node (unwrap if parenthesized) */
  const callNode = isCallExpression(node) ? node :
    (isCallExpression(unwrappedNode(node)) ? unwrappedNode(node) : null)
  if (!callNode) {
    return false
  }

  /* Check if the function being called is an attribute (object.method) */
  const functionNode = callNode.firstNamedChild

  return functionNode?.type === 'attribute'
}

export const isChainedMethodCall = (node: tree.Node | null | undefined): boolean => {
  if (!isMethodCall(node)) {
    return false
  }

  /* Get the actual call node (unwrap if parenthesized) */
  const callNode = isCallExpression(node) ? node :
    (isCallExpression(unwrappedNode(node)) ? unwrappedNode(node) : null)
  if (!callNode) {
    return false
  }

  /* Check if the object being called is itself a method call */
  const attributeNode = callNode.firstNamedChild  /* should be 'attribute' */
  const objectNode = attributeNode?.firstNamedChild  /* the object part */

  return isCallExpression(objectNode)
}

/* Additional helper functions for templates */
export const isStringLiteral = (node: tree.Node | null | undefined): boolean => {
  return Boolean(['string']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

export const isTypeNode = (node: tree.Node | null | undefined): boolean => {
  return Boolean(['type']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

/* Context checking functions for Python AST */
export const isObjectLiteral = (node: tree.Node | null | undefined): boolean => {
  /* Python equivalent would be dictionary literals */
  return Boolean(['dictionary']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

export const isAnyFunction = (node: tree.Node | null | undefined): boolean => {
  return Boolean(['function_definition', 'lambda', 'async_function_definition']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

export const isLambda = (node: tree.Node | null | undefined): boolean => {
  return Boolean(['lambda']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

export const isListComprehension = (node: tree.Node | null | undefined): boolean => {
  return Boolean(['list_comprehension']
    .filter(t => [node?.type, unwrappedNode(node)?.type].includes(t)).length)
}

export const inReturnStatement = (node: tree.Node | null | undefined): boolean => {
  if (isAnyFunction(node)) {
    return false
  }

  if (node.type === 'return_statement') {
    return true
  }

  return node.parent ? inReturnStatement(node.parent) : false
}

export const inFunctionArgument = (node: tree.Node | null | undefined): boolean => {
  if (!node) {
    return false
  }
  if (node.parent?.type === 'argument_list') {
    return true
  }
  return node.parent ? inFunctionArgument(node.parent) : false
}

export const inVariableDeclaration = (node: tree.Node | null | undefined): boolean => {
  if (isAnyFunction(node)) {
    return false
  }

  /* Python assignment statements */
  if (inAssignmentStatement(node)) {
    return true
  }

  return node.parent ? inVariableDeclaration(node.parent) : false
}

export const inAssignmentStatement = (node: tree.Node | null | undefined): boolean => {
  if (isAnyFunction(node)) {
    return false
  }

  /* Check if we're in an assignment context */
  if (node.type === 'assignment' || node.type === 'augmented_assignment') {
    return true
  }

  return node.parent ? inAssignmentStatement(node.parent) : false
}

export const inPrefixUnaryExpression = (node: tree.Node | null | undefined): boolean => {
  /* Check if the node itself is a prefix unary expression */
  if (isPrefixUnaryExpression(node)) {
    return true
  }

  /* Check parent node recursively (like TypeScript version) */
  return node.parent ? inPrefixUnaryExpression(node.parent) : false
}

export const inIfStatement = (node: tree.Node | null | undefined, expressionNode?: tree.Node | null | undefined): boolean => {
  if (node?.type === 'if_statement') {
    if (!expressionNode) {
      return true
    }

    /* Check if expressionNode is the condition of this if statement */
    return node.firstNamedChild.id === expressionNode.id
  }

  return node.parent ? inIfStatement(node.parent, node) : false
}

export const inAwaitExpression = (node: tree.Node | null | undefined): boolean => {
  if (isAnyFunction(node)) {
    return false
  }

  return isAwaitExpression(node) || (node.parent ? inAwaitExpression(node.parent) : false)
}

export const inBinaryExpression = (node: tree.Node | null | undefined): boolean => {
  if (isAnyFunction(node)) {
    return false
  }

  /* Check if the node itself is a binary expression */
  if (isBinaryExpression(node)) {
    return true
  }

  /* Check parent node recursively (like TypeScript version) */
  return node.parent ? inBinaryExpression(node.parent) : false
}

export const inTypeNode = (node: tree.Node | null | undefined): boolean => {
  /* Check if the node itself is a type */
  if (isTypeNode(node)) {
    return true
  }

  /* Check parent node recursively (like TypeScript version) */
  return node.parent ? inTypeNode(node.parent) : false
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
    /* Find the binary expression upwards */
    let current = node.parent
    while (current) {
      if (isBinaryExpression(current)) {
        binaryExpression = current

        break
      }

      current = current.parent
    }
  }

  /* Continue expanding upwards to the top-level binary expression */
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
 * Overload 1: Accepts a parser and raw text. The text will be sanitized
 *             (the dot and any typed suffix will be removed) before parsing.
 * Overload 2: Accepts a pre-parsed syntax tree that already reflects the
 *             sanitized text (used together with DocumentTreeCache).
 */
export function findNodeBeforeDot(parser: tree.Parser, text: string, dotOffset: number): tree.Node | null
export function findNodeBeforeDot(syntaxTree: tree.Tree, dotOffset: number): tree.Node | null
export function findNodeBeforeDot(arg1: tree.Parser | tree.Tree, arg2: string | number, arg3?: number): tree.Node | null {
  if (typeof arg2 === 'string' && typeof arg3 === 'number') {
    const parser = arg1 as tree.Parser
    const sanitized = sanitizeTextAroundDot(arg2, arg3)
    const syntaxTree = parser.parse(sanitized)
    return findNodeBeforeDotInTree(syntaxTree, arg3)
  }

  if (typeof arg2 === 'number' && arg3 === undefined) {
    return findNodeBeforeDotInTree(arg1 as tree.Tree, arg2)
  }

  throw new Error('Invalid arguments for findNodeBeforeDot')
}

const sanitizeTextAroundDot = (text: string, dotOffset: number): string => {
  const textBeforeDot = text.slice(0, dotOffset)
  const textAfterDot = text.slice(dotOffset + 1)
  const templateMatch = /^[\w$-]+/.exec(textAfterDot)
  const sanitizedAfterDot = templateMatch ? textAfterDot.slice(templateMatch[0].length) : textAfterDot
  return textBeforeDot + sanitizedAfterDot
}

const findNodeBeforeDotInTree = (syntaxTree: tree.Tree, dotOffset: number): tree.Node | null => {
  const findNamedNode = (node: tree.Node | null): tree.Node | null => {
    if (!node) {
      return null
    }

    /* If the current node is an unNamed token (like punctuation), search upward to find a meaningful named node */
    let currentNode = node

    if (!currentNode.isNamed) {
      /* Search upward until a named node is found */
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

    /* Ensure the dot is at the end of the node */
    if (currentNode.endIndex !== dotOffset) {
      return null
    }

    return currentNode
  }

  if (dotOffset <= 0) {
    return null
  }

  let treeNode = syntaxTree.rootNode.descendantForIndex(dotOffset - 1)
  if (!treeNode) {
    return null
  }

  treeNode = findNamedNode(treeNode)
  if (!treeNode) {
    return null
  }

  /* for @x */
  if (treeNode.parent?.type === 'decorator') {
    return null
  }

  /* for f-strings interpolation */
  if (treeNode.type === 'interpolation') {
    return null
  }

  /* for string */
  if (treeNode.type === 'string_end') {
    const stringNode = treeNode.parent
    if (!stringNode) {
      return null
    }

    return stringNode
  }

  /* for x.y */
  if (treeNode.parent?.type === 'attribute') {
    return treeNode.parent
  }

  /* for x(y, z) */
  if (treeNode.parent?.type === 'call') {
    return treeNode.parent
  }

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

/* Parser initialization utilities */
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

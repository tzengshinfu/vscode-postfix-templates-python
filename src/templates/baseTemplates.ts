import * as ts from 'typescript'
import * as vsc from 'vscode'
import { IndentInfo, IPostfixTemplate } from '../template'
import { isAssignmentBinaryExpression, isStringLiteral } from '../utils/typescript'
import * as tree from '../web-tree-sitter'

export abstract class BaseTemplate implements IPostfixTemplate {
  constructor(public readonly templateName: string) {}

  abstract buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo): vsc.CompletionItem
  abstract canUse(node: tree.Node): boolean

  protected isSimpleExpression = (node: tree.Node) => ts.isExpressionStatement(node) && !isStringLiteral(node)
  protected isPropertyAccessExpression = (node: tree.Node) => ts.isPropertyAccessExpression(node)
  protected isElementAccessExpression = (node: tree.Node) => ts.isElementAccessExpression(node)
  protected isExpression = (node: tree.Node) => this.isSimpleExpression(node) || this.isPropertyAccessExpression(node) || this.isElementAccessExpression(node)
  protected isIdentifier = (node: tree.Node) => ts.isIdentifier(node)

  protected isUnaryExpression = (node: tree.Node) => ts.isPostfixUnaryExpression(node) || ts.isPrefixUnaryExpression(node)
  protected isCallExpression = (node: tree.Node) => ts.isCallExpression(node)
  protected isNewExpression = (node: tree.Node) => ts.isNewExpression(node)
  protected inFunctionArgument = (node: tree.Node) => ts.isCallExpression(node.parent) && node.parent.arguments.includes(node as ts.Expression)

  protected isObjectLiteral = (node: tree.Node) => {
    return ts.isBlock(node) && (node.statements.length === 0 || node.statements.some(x => ts.isLabeledStatement(x)))
  }

  protected isTypeNode = (node: tree.Node) => {
    if (ts.isTypeNode(node)) { // built-in types
      return true
    }

    // Custom types (including namespaces) are encapsulated in TypeReferenceNode
    return node.parent
  }

  protected inAwaitedExpression = (node: tree.Node) => {
    if (this.isAnyFunction(node)) {
      return false
    }
    return node.type === ts.SyntaxKind.AwaitExpression || (node.parent && this.inAwaitedExpression(node.parent))
  }

  protected inReturnStatement = (node: tree.Node) => {
    if (this.isAnyFunction(node)) {
      return false
    }
    return node.type === ts.SyntaxKind.ReturnStatement || (node.parent && this.inReturnStatement(node.parent))
  }

  protected inVariableDeclaration = (node: tree.Node) => {
    if (this.isAnyFunction(node)) {
      return false
    }

    return node.type === ts.SyntaxKind.VariableDeclaration || node.parent && this.inVariableDeclaration(node.parent)
  }

  protected isBinaryExpression = (node: tree.Node) => {
    if (ts.isBinaryExpression(node) && !isAssignmentBinaryExpression(node)) {
      return true
    }

    return ts.isParenthesizedExpression(node) && ts.isBinaryExpression(node.expression)
      || node.parent && this.isBinaryExpression(node.parent)
  }

  protected unwindBinaryExpression = (node: tree.Node, removeParens = true) => {
    let binaryExpression: ts.BinaryExpression | undefined

    if (
      removeParens &&
      ts.isParenthesizedExpression(node) &&
      ts.isBinaryExpression(node.expression) &&
      !isAssignmentBinaryExpression(node.expression)
    ) {
      binaryExpression = node.expression
    } else {
      binaryExpression = ts.findAncestor(node, (n: tree.Node): n is ts.BinaryExpression =>
        ts.isBinaryExpression(n) && !isAssignmentBinaryExpression(n)
      ) ?? undefined
    }

    while (
      binaryExpression &&
      ts.isBinaryExpression(binaryExpression.parent) &&
      !isAssignmentBinaryExpression(binaryExpression.parent)
    ) {
      binaryExpression = binaryExpression.parent
    }

    return binaryExpression ?? node
  }

  protected isAnyFunction = (node: tree.Node) => {
    return ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node)
  }

  protected inAssignmentStatement = (node: tree.Node) => {
    if (this.isAnyFunction(node)) {
      return false
    }

    if (ts.isBinaryExpression(node)) {
      return isAssignmentBinaryExpression(node)
    }

    return node.parent && this.inAssignmentStatement(node.parent)
  }

  protected inIfStatement = (node: tree.Node, expressionNode?: tree.Node) => {
    if (ts.isIfStatement(node)) {
      return !expressionNode || node.expression === expressionNode
    }

    return node.parent && this.inIfStatement(node.parent, node)
  }
}

export abstract class BaseExpressionTemplate extends BaseTemplate {
  abstract override buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo)

  canUse(node: tree.Node) {
    return !this.inIfStatement(node) && !this.isTypeNode(node) && !this.inAssignmentStatement(node) &&
      (this.isIdentifier(node) ||
        this.isExpression(node) ||
        this.isUnaryExpression(node) ||
        this.isBinaryExpression(node) ||
        this.isCallExpression(node))
  }
}

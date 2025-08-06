import * as vsc from 'vscode'
import { IndentInfo, IPostfixTemplate } from '../template'
import * as tree from '../web-tree-sitter'
import * as sitter from '../sitter'

export abstract class BaseTemplate implements IPostfixTemplate {
  constructor(public readonly templateName: string) {}

  abstract buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo): vsc.CompletionItem
  abstract canUse(node: tree.Node): boolean

  // Use sitter.ts functions for node type checking
  protected isIdentifier = sitter.isIdentifier
  protected isCallExpression = sitter.isCallExpression
  protected isBinaryExpression = sitter.isBinaryExpression
  protected isUnaryExpression = sitter.isPrefixUnaryExpression
  protected isStringLiteral = sitter.isStringLiteral
  protected isTypeNode = sitter.isTypeNode
  protected isExpression = sitter.isExpression
  protected isObjectLiteral = sitter.isObjectLiteral
  protected isAnyFunction = sitter.isAnyFunction
  protected inReturnStatement = sitter.inReturnStatement
  protected inFunctionArgument = sitter.inFunctionArgument
  protected inVariableDeclaration = sitter.inVariableDeclaration
  protected inAssignmentStatement = sitter.inAssignmentStatement
  protected inIfStatement = sitter.inIfStatement
}

export abstract class BaseExpressionTemplate extends BaseTemplate {
  abstract override buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo)

  canUse(node: tree.Node) {
    return sitter.isIdentifier(node) ||
      sitter.isExpression(node) ||
      sitter.isPrefixUnaryExpression(node) ||
      sitter.isBinaryExpression(node) ||
      sitter.isCallExpression(node)
  }
}

import * as vsc from 'vscode'
import { IndentInfo, IPostfixTemplate } from '../template'
import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'

export abstract class BaseTemplate implements IPostfixTemplate {
  constructor(public readonly templateName: string) {}

  abstract buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo): vsc.CompletionItem
  abstract canUse(node: tree.Node): boolean

  protected isIdentifier = py.isIdentifier
  protected isCallExpression = py.isCallExpression
  protected isBinaryExpression = py.isBinaryExpression
  protected isUnaryExpression = py.isPrefixUnaryExpression
  protected isStringLiteral = py.isStringLiteral
  protected isTypeNode = py.isTypeNode
  protected isExpression = py.isExpression
  protected isObjectLiteral = py.isObjectLiteral
  protected isAnyFunction = py.isAnyFunction
  protected inReturnStatement = py.inReturnStatement
  protected inFunctionArgument = py.inFunctionArgument
  protected inVariableDeclaration = py.inVariableDeclaration
  protected inAssignmentStatement = py.inAssignmentStatement
  protected inIfStatement = py.inIfStatement
  protected inAwaitedExpression = py.inAwaitedExpression
  protected unwindBinaryExpression = py.unwindBinaryExpression
  protected isPropertyAccessExpression = py.isPropertyAccessExpression
  protected isElementAccessExpression = py.isElementAccessExpression
}

export abstract class BaseExpressionTemplate extends BaseTemplate {
  abstract override buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo)

  canUse(node: tree.Node) {
    return py.isIdentifier(node) ||
      py.isExpression(node) ||
      py.isPrefixUnaryExpression(node) ||
      py.isBinaryExpression(node) ||
      py.isCallExpression(node)
  }
}

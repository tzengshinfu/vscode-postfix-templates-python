import * as ts from 'typescript'
import { CompletionItemBuilder } from '../completionItemBuilder'
import { BaseTemplate } from './baseTemplates'
import { getConfigValue, getIndentCharacters, getPlaceholderWithOptions } from '../utils'
import { inferForVarTemplate } from '../utils/infer-names'
import { IndentInfo } from '../template'

abstract class BaseForTemplate extends BaseTemplate {
  canUse(node: ts.Node): boolean {
    return !this.inReturnStatement(node) &&
      !this.inIfStatement(node) &&
      !this.inFunctionArgument(node) &&
      !this.inVariableDeclaration(node) &&
      !this.inAssignmentStatement(node) &&
      !this.isTypeNode(node) &&
      !this.isBinaryExpression(node) &&
      (this.isIdentifier(node) ||
        this.isPropertyAccessExpression(node) ||
        this.isElementAccessExpression(node) ||
        this.isCallExpression(node) ||
        this.isArrayLiteral(node))
  }

  protected isArrayLiteral = (node: ts.Node) => node.kind === ts.SyntaxKind.ArrayLiteralExpression
}

const getArrayItemNames = (node: ts.Node): string[] => {
  const inferVarNameEnabled = getConfigValue<boolean>('inferVariableName')
  const suggestedNames = inferVarNameEnabled ? inferForVarTemplate(node) : undefined
  return suggestedNames?.length > 0 ? suggestedNames : ['item']
}

export class ForTemplate extends BaseForTemplate {
  buildCompletionItem(node: ts.Node, indentInfo?: IndentInfo) {
    const itemNames = getArrayItemNames(node)

    return CompletionItemBuilder
      .create('for', node, indentInfo)
      .replace(`for ${getPlaceholderWithOptions(itemNames)} in {{expr}}:\n${getIndentCharacters()}\${0}\n`)
      .build()
  }
}

export class ForRangeTemplate extends BaseForTemplate {
  buildCompletionItem(node: ts.Node, indentInfo?: IndentInfo) {
    const itemNames = getArrayItemNames(node)

    return CompletionItemBuilder
      .create('forrange', node, indentInfo)
      .replace(`for ${getPlaceholderWithOptions(itemNames)} in range({{expr}}):\n${getIndentCharacters()}\${0}\n`)
      .build()
  }

  override canUse(node: ts.Node) {
    return !Number.isNaN(Number.parseFloat(node.getFullText().trim())) || (ts.isExpression(node) && this.isNotInSingleLineString(node));
  }
}

import { CompletionItemBuilder } from '../completionItemBuilder'
import { BaseTemplate } from './baseTemplates'
import { getConfigValue, getPlaceholderWithOptions } from '../utils/vscode-helpers'
import { createForLoopTemplate } from '../utils/template-helpers'
import { inferForVarTemplate } from '../utils/infer-names'
import { IndentInfo } from '../template'
import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'

abstract class BaseForTemplate extends BaseTemplate {
  canUse(node: tree.Node): boolean {
    return !py.inReturnStatement(node)
      && !py.inIfStatement(node)
      && !py.inFunctionArgument(node)
      && !py.inVariableDeclaration(node)
      && !py.inAssignmentStatement(node)
      && !py.isTypeNode(node)
      && !py.isBinaryExpression(node)
      && (py.isIdentifier(node)
        || py.isPropertyAccessExpression(node)
        || py.isElementAccessExpression(node)
        || py.isCallExpression(node)
        || py.isArrayLiteral(node))
  }
}

const getArrayItemNames = (node: tree.Node): string[] => {
  const inferVarNameEnabled = getConfigValue<boolean>('inferVariableName')
  const suggestedNames = inferVarNameEnabled ? inferForVarTemplate(node) : ['item']

  return suggestedNames
}

export class ForTemplate extends BaseForTemplate {
  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    const itemNames = getArrayItemNames(node)

    return CompletionItemBuilder
      .create('for', node, indentInfo)
      .replace(createForLoopTemplate('{{expr}}', getPlaceholderWithOptions(itemNames)) + '\n')
      .build()
  }
}

export class ForRangeTemplate extends BaseForTemplate {
  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    const itemNames = getArrayItemNames(node)

    return CompletionItemBuilder
      .create('forrange', node, indentInfo)
      .replace(createForLoopTemplate('range({{expr}})', getPlaceholderWithOptions(itemNames)) + '\n')
      .build()
  }

  override canUse(node: tree.Node) {
    // Check if node represents a valid number
    const isNumber = /^\s*-?\d+(\.\d+)?\s*$/.test(node.text)

    return isNumber || (py.isExpression(node) && !py.isStringLiteral(node))
  }
}

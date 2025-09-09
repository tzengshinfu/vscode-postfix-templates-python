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
      && !py.inTypeNode(node)
      && !py.inBinaryExpression(node)
      && !py.inPrefixUnaryExpression(node)
      && (py.isIdentifier(node)
        || py.isPropertyAccessExpression(node)
        || py.isElementAccessExpression(node)
        || py.isCallExpression(node)
        || py.isArrayLiteral(node)
        || py.isStringLiteral(node))
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
    // Check if node text content is a valid non-negative integer (including 0)
    return (super.canUse(node)
      || (node.type === 'integer' && !py.inBinaryExpression(node))
    ) && !py.isStringLiteral(node)
  }
}

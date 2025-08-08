import { CompletionItemBuilder } from '../completionItemBuilder'
import { BaseTemplate } from './baseTemplates'
import { getConfigValue, getIndentCharacters, getPlaceholderWithOptions } from '../utils/utils'
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
  const suggestedNames = inferVarNameEnabled ? inferForVarTemplate(node) : undefined
  return suggestedNames?.length > 0 ? suggestedNames : ['item']
}

export class ForTemplate extends BaseForTemplate {
  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    const itemNames = getArrayItemNames(node)

    return CompletionItemBuilder
      .create('for', node, indentInfo)
      .replace(`for ${getPlaceholderWithOptions(itemNames)} in {{expr}}:\n${getIndentCharacters()}\${0}\n`)
      .build()
  }
}

export class ForRangeTemplate extends BaseForTemplate {
  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    const itemNames = getArrayItemNames(node)

    return CompletionItemBuilder
      .create('forrange', node, indentInfo)
      .replace(`for ${getPlaceholderWithOptions(itemNames)} in range({{expr}}):\n${getIndentCharacters()}\${0}\n`)
      .build()
  }

  override canUse(node: tree.Node) {
    return !Number.isNaN(Number.parseFloat(py.getNodeText(node))) || (py.isExpression(node) && !py.isStringLiteral(node))
  }
}

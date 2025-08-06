import { CompletionItemBuilder } from '../completionItemBuilder'
import { BaseTemplate } from './baseTemplates'
import { getConfigValue, getIndentCharacters, getPlaceholderWithOptions } from '../utils'
import { IndentInfo } from '../template'
import * as tree from '../web-tree-sitter'
import * as sitter from '../sitter'

abstract class BaseForTemplate extends BaseTemplate {
  canUse(node: tree.Node): boolean {
    return this.isIdentifier(node) ||
      this.isCallExpression(node) ||
      this.isArrayLiteral(node)
  }

  protected isArrayLiteral = (node: tree.Node) => node.type === 'list'
}

const getArrayItemNames = (node: tree.Node): string[] => {
  // Simplified for Python - just use default name
  return ['item']
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
    return !Number.isNaN(Number.parseFloat(sitter.getNodeText(node))) || (sitter.isExpression(node) && node.type !== 'string')
  }
}

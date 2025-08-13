import * as vsc from 'vscode'
import * as tree from '../web-tree-sitter'
import { IndentInfo } from '../template'
import { CompletionItemBuilder } from '../completionItemBuilder'
import { getIndentCharacters } from './vscode-helpers'

/**
 * Builds a simple template completion item with the given parameters
 */
export const buildSimpleTemplate = (
  keyword: string,
  node: tree.Node,
  indentInfo: IndentInfo,
  template: string,
  description?: string
): vsc.CompletionItem => {
  const builder = CompletionItemBuilder
    .create(keyword, node, indentInfo)
    .replace(template)

  if (description) {
    builder.description(description)
  }

  return builder.build()
}

/**
 * Creates a block template with appropriate indentation
 */
export const createBlockTemplate = (condition: string, hasElse = false): string => {
  const indent = getIndentCharacters()
  const elseBlock = hasElse ? `\nelse:\n${indent}` : ''
  return `${condition}:\n${indent}\${0}${elseBlock}`
}

/**
 * Creates a for loop template with proper indentation
 */
export const createForLoopTemplate = (iterable: string, itemName: string): string => {
  const indent = getIndentCharacters()
  return `for ${itemName} in ${iterable}:\n${indent}\${0}`
}

/**
 * Creates an if statement template with proper indentation
 */
export const createIfTemplate = (condition: string, hasElse = false): string => {
  return createBlockTemplate(`if ${condition}`, hasElse)
}

/**
 * Creates a while loop template with proper indentation
 */
export const createWhileTemplate = (condition: string): string => {
  return createBlockTemplate(`while ${condition}`)
}
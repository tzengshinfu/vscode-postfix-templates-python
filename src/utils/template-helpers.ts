import { getIndentCharacters } from './vscode-helpers'

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

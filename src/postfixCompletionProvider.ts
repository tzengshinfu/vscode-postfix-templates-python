import * as vsc from 'vscode'

import { IndentInfo, IPostfixTemplate } from './template'
import { AllTabs, AllSpaces } from './utils/multiline-expressions'
import { loadBuiltinTemplates, loadCustomTemplates } from './templates'
import { CustomTemplate } from './templates/customTemplate'
import { getHtmlLikeEmbedText } from './utils/htmlLikeSupport'
import { findNodeBeforeDot } from './utils/python'
import * as tree from './web-tree-sitter'

let currentSuggestion = undefined

export const overrideTsxEnabled = { value: false }

export class PostfixCompletionProvider implements vsc.CompletionItemProvider {
  private templates: IPostfixTemplate[] = []
  private customTemplateNames: string[] = []
  private mergeMode: 'append' | 'override'
  private parser: tree.Parser

  constructor(parser: tree.Parser) {
    this.mergeMode = vsc.workspace.getConfiguration('postfix.customTemplate').get('mergeMode', 'append')

    const customTemplates = loadCustomTemplates()
    this.customTemplateNames = customTemplates.map(t => t.templateName)

    this.templates = [
      ...loadBuiltinTemplates(),
      ...customTemplates
    ]

    this.parser = parser
  }

  provideCompletionItems(document: vsc.TextDocument, position: vsc.Position, _token: vsc.CancellationToken): vsc.CompletionItem[] | vsc.CompletionList | Thenable<vsc.CompletionItem[] | vsc.CompletionList> {
    const line = document.lineAt(position.line)
    const dotIndex = line.text.lastIndexOf('.', position.character - 1)
    const wordRange = document.getWordRangeAtPosition(position)
    const isCursorOnWordAfterDot = (wordRange?.start ?? position).character === dotIndex + 1
    if (dotIndex === -1 || !isCursorOnWordAfterDot) {
      return []
    }

    const fullCurrentNode = this.getNodeBeforeTheDot(document, position, dotIndex)
    if (!fullCurrentNode) {
      return []
    }

    const indentInfo = this.getIndentInfo(document, fullCurrentNode)

    try {
      return this.templates
        .filter(t => {
          let canUseTemplate = t.canUse(fullCurrentNode)

          if (this.mergeMode === 'override') {
            canUseTemplate &&= (t instanceof CustomTemplate || !this.customTemplateNames.includes(t.templateName))
          }

          return canUseTemplate
        })
        .flatMap(t => t.buildCompletionItem(fullCurrentNode, indentInfo))
    } catch (err) {
      console.error('Error while building postfix autocomplete items:')
      console.error(err)

      return []
    }
  }

  resolveCompletionItem(item: vsc.CompletionItem, _token: vsc.CancellationToken): vsc.ProviderResult<vsc.CompletionItem> {
    currentSuggestion = (item.label as vsc.CompletionItemLabel)?.label || item.label

    return item
  }

  private getHtmlLikeEmbeddedText(document: vsc.TextDocument, position: vsc.Position) {
    const knownHtmlLikeLangs = [
      'html'
    ]

    if (knownHtmlLikeLangs.includes(document.languageId)) {
      return getHtmlLikeEmbedText(document, document.offsetAt(position))
    }

    return null
  }

  private getNodeBeforeTheDot(document: vsc.TextDocument, position: vsc.Position, dotIndex: number) {
    const dotOffset = document.offsetAt(position.with({ character: dotIndex }))
    const speciallyHandledText = this.getHtmlLikeEmbeddedText(document, position)
    const fullText = speciallyHandledText ?? document.getText()
    
    return findNodeBeforeDot(this.parser, fullText, dotOffset)
  }

  private getIndentInfo(document: vsc.TextDocument, node: tree.Node): IndentInfo {
    const startPos = node.startPosition
    const line = document.lineAt(startPos.row)

    const whitespaces = line.text.substring(0, line.firstNonWhitespaceCharacterIndex)
    let indentSize = 0

    if (AllTabs.test(whitespaces)) {
      indentSize = whitespaces.length
    } else if (AllSpaces.test(whitespaces)) {
      indentSize = whitespaces.length / (vsc.window.activeTextEditor.options.tabSize as number)
    }

    return {
      indentSize,
      leadingWhitespace: whitespaces
    }
  }
}

export const getCurrentSuggestion = () => currentSuggestion
export const resetCurrentSuggestion = () => currentSuggestion = undefined

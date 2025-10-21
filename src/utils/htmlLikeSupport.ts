import * as vsc from 'vscode'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getLanguageService, TokenType } from 'vscode-html-languageservice'

const languageService = getLanguageService()

const getHtmlLikeEmbedRange = (document: vsc.TextDocument, cursorOffset: number): undefined | null | Record<'start' | 'end', number> => {
  const html = languageService.parseHTMLDocument({ ...document, uri: undefined, languageId: 'html' })
  const node = html.findNodeAt(cursorOffset)

  let mostTopNode = node

  // Walk up to the nearest tag node first (text nodes have no `tag`)
  while (mostTopNode && !mostTopNode.tag) {
    mostTopNode = mostTopNode.parent
  }

  // Then traverse up through tag nodes to find enclosing <script type="py"> block
  while (mostTopNode?.tag) {
    if (mostTopNode.tag === 'style') {
      return null
    }
    if (mostTopNode.tag === 'script') {
      const typeAttr = mostTopNode?.attributes?.type
      if ((typeAttr ? typeAttr.replace(/['"]/g, '') : '') !== 'py') {
        return null
      }

      const { startTagEnd, endTagStart } = mostTopNode

      return {
        start: startTagEnd,
        end: endTagStart
      }
    }

    mostTopNode = mostTopNode.parent
  }

  const validAttributeRegexps = {
    html: /^on/,
    vue: /^(?::|@|v-)/
  }

  if (!Object.keys(validAttributeRegexps).includes(document.languageId)) {
    return undefined
  }

  const scanner = languageService.createScanner(document.getText())

  let scannedTokens = 0
  let attrName: string | undefined
  let attrValue: string | undefined

  while (scanner.scan() !== TokenType.EOS) {
    const tokenEnd = scanner.getTokenEnd()
    const tokenType = scanner.getTokenType()

    if ([TokenType.DelimiterAssign, TokenType.Whitespace].includes(tokenType)) {
      continue
    }

    if (tokenType === TokenType.AttributeValue
      && cursorOffset > scanner.getTokenOffset()
      && cursorOffset < tokenEnd) {
      attrValue = scanner.getTokenText()

      break
    } else {
      attrName = tokenType === TokenType.AttributeName ? scanner.getTokenText() : undefined
    }

    if (tokenEnd > cursorOffset) {
      break
    }

    if (scannedTokens++ === 3000) {
      return null
    }
  }

  if (attrName !== undefined && attrValue !== undefined) {
    /* return range without quotes */
    if (validAttributeRegexps[document.languageId].test(attrName)) {
      return { start: scanner.getTokenOffset() + 1, end: scanner.getTokenEnd() - 2 }
    } else {
      return null
    }
  }

  return undefined
}

export const getHtmlLikeEmbedText = (document: vsc.TextDocument, cursorOffset: number): string | null => {
  const handleRange = getHtmlLikeEmbedRange(document, cursorOffset)
  if (!handleRange) {
    return null
  }

  const { start, end } = handleRange
  const fullText = document.getText()

  return fullText.slice(0, start).replaceAll(/[^\n]/g, ' ') + fullText.slice(start, end) + fullText.slice(end).replaceAll(/[^\n]/g, ' ')
}

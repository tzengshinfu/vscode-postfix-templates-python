import * as vsc from 'vscode'
import * as tree from '../web-tree-sitter'

type TreePoint = { row: number, column: number }

interface CachedDocument {
  tree: tree.Tree
  text: string
  version: number
}

export interface TreeForCompletion {
  tree: tree.Tree
  dispose?: () => void
}

export class DocumentTreeCache implements vsc.Disposable {
  private readonly cache = new Map<string, CachedDocument>()
  private readonly changeSubscription: vsc.Disposable
  private readonly closeSubscription: vsc.Disposable

  constructor(private readonly parser: tree.Parser) {
    this.changeSubscription = vsc.workspace.onDidChangeTextDocument(this.handleDocumentChange, this)
    this.closeSubscription = vsc.workspace.onDidCloseTextDocument(this.handleDocumentClose, this)
  }

  dispose(): void {
    this.changeSubscription.dispose()
    this.closeSubscription.dispose()

    for (const entry of this.cache.values()) {
      entry.tree.delete()
    }

    this.cache.clear()
  }

  getTreeForCompletion(document: vsc.TextDocument, dotOffset: number, afterDot: string): TreeForCompletion | null {
    const entry = this.ensureEntry(document)
    if (!entry) {
      return null
    }

    const removalLength = this.getTemplateSuffixLength(afterDot)
    if (removalLength <= 0) {
      return { tree: entry.tree }
    }

    return this.buildSanitizedTree(document, entry, dotOffset, removalLength)
  }

  invalidate(document: vsc.TextDocument): void {
    const uri = document.uri.toString()
    const entry = this.cache.get(uri)
    if (!entry) {
      return
    }

    entry.tree.delete()
    this.cache.delete(uri)
  }

  private ensureEntry(document: vsc.TextDocument): CachedDocument | null {
    const uri = document.uri.toString()
    let entry = this.cache.get(uri)

    if (!entry) {
      entry = this.createEntry(document)
      this.cache.set(uri, entry)
      return entry
    }

    if (entry.version !== document.version) {
      entry.tree.delete()
      const text = document.getText()
      entry.tree = this.parser.parse(text)
      entry.text = text
      entry.version = document.version
    }

    return entry
  }

  private createEntry(document: vsc.TextDocument): CachedDocument {
    const text = document.getText()
    return {
      text,
      tree: this.parser.parse(text),
      version: document.version
    }
  }

  private handleDocumentChange(event: vsc.TextDocumentChangeEvent): void {
    const document = event.document
    const uri = document.uri.toString()
    let entry = this.cache.get(uri)

    if (!entry) {
      entry = this.createEntry(document)
      this.cache.set(uri, entry)
    }

    if (!event.contentChanges.length) {
      entry.version = document.version
      return
    }

    let workingTree = entry.tree
    let workingText = entry.text

    for (const change of event.contentChanges) {
      const startIndex = change.rangeOffset
      const oldEndIndex = startIndex + change.rangeLength
      const newEndIndex = startIndex + change.text.length

      const startPosition = DocumentTreeCache.toPoint(change.range.start)
      const oldEndPosition = DocumentTreeCache.toPoint(change.range.end)
      const newEndPosition = DocumentTreeCache.advancePoint(startPosition, change.text)

      workingTree.edit({
        startIndex,
        oldEndIndex,
        newEndIndex,
        startPosition,
        oldEndPosition,
        newEndPosition
      })

      workingText = workingText.slice(0, startIndex) + change.text + workingText.slice(oldEndIndex)
    }

    const newTree = this.parser.parse(workingText, workingTree)
    workingTree.delete()

    entry.tree = newTree
    entry.text = workingText
    entry.version = document.version
  }

  private handleDocumentClose(document: vsc.TextDocument): void {
    this.invalidate(document)
  }

  private buildSanitizedTree(document: vsc.TextDocument, entry: CachedDocument, dotOffset: number, removalLength: number): TreeForCompletion {
    const removalStart = dotOffset + 1
    const removalEnd = Math.min(entry.text.length, removalStart + removalLength)

    if (removalStart >= removalEnd) {
      return { tree: entry.tree }
    }

    const sanitizedText = entry.text.slice(0, removalStart) + entry.text.slice(removalEnd)
    const baseTree = entry.tree.copy()

    const startPosition = document.positionAt(removalStart)
    const endPosition = document.positionAt(removalEnd)

    baseTree.edit({
      startIndex: removalStart,
      oldEndIndex: removalEnd,
      newEndIndex: removalStart,
      startPosition: DocumentTreeCache.toPoint(startPosition),
      oldEndPosition: DocumentTreeCache.toPoint(endPosition),
      newEndPosition: DocumentTreeCache.toPoint(startPosition)
    })

    const sanitizedTree = this.parser.parse(sanitizedText, baseTree)
    baseTree.delete()

    return {
      tree: sanitizedTree,
      dispose: () => sanitizedTree.delete()
    }
  }

  private getTemplateSuffixLength(afterDot: string): number {
    const match = /^[\w$-]+/.exec(afterDot)
    return match?.[0].length ?? 0
  }

  private static toPoint(position: vsc.Position): TreePoint {
    return { row: position.line, column: position.character }
  }

  private static advancePoint(start: TreePoint, text: string): TreePoint {
    if (!text.length) {
      return { ...start }
    }

    const segments = text.split(/\r?\n/)

    if (segments.length === 1) {
      return {
        row: start.row,
        column: start.column + text.length
      }
    }

    return {
      row: start.row + segments.length - 1,
      column: segments[segments.length - 1].length
    }
  }
}

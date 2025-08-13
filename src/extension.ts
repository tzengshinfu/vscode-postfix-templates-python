'use strict'
import * as vsc from 'vscode'
import { PostfixCompletionProvider } from './postfixCompletionProvider'
import { notCommand, NOT_COMMAND } from './utils/notCommand'
import { createPythonParser } from './utils/python'
import * as tree from './web-tree-sitter'

let completionProvider: vsc.Disposable
let parser: tree.Parser

export async function activate(context: vsc.ExtensionContext): Promise<void> {
  const wasmUri = vsc.Uri.joinPath(context.extensionUri, 'out', 'tree-sitter-python.wasm')
  parser = await createPythonParser(wasmUri.fsPath)
  registerCompletionProvider(context)

  context.subscriptions.push(vsc.commands.registerTextEditorCommand(NOT_COMMAND, async (editor: vsc.TextEditor, _: vsc.TextEditorEdit, ...args: tree.Node[]) => {
    const [...expressions] = args

    await notCommand(editor, expressions)
  }))

  context.subscriptions.push(vsc.workspace.onDidChangeConfiguration(e => {
    if (!e.affectsConfiguration('postfix')) {
      return
    }

    if (completionProvider) {
      const idx = context.subscriptions.indexOf(completionProvider)
      context.subscriptions.splice(idx, 1)
      completionProvider.dispose()
    }

    registerCompletionProvider(context)
  }))
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void {
}

function registerCompletionProvider(context: vsc.ExtensionContext) {
  const provider = new PostfixCompletionProvider(parser)

  const TESTS_SELECTOR: vsc.DocumentSelector = ['postfix', 'html']
  const DOCUMENT_SELECTOR: vsc.DocumentSelector =
    process.env.NODE_ENV === 'test' ? TESTS_SELECTOR : <string[]>vsc.workspace.getConfiguration('postfix').get('languages')

  completionProvider = vsc.languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, provider, '.')
  context.subscriptions.push(completionProvider)
}

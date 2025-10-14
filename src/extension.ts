'use strict'
import * as vsc from 'vscode'
import { PostfixCompletionProvider } from './postfixCompletionProvider'
import { notCommand, NOT_COMMAND } from './utils/notCommand'
import { createPythonParser } from './utils/python'
import * as tree from './web-tree-sitter'

let completionProvider: vsc.Disposable | null = null
let parser: tree.Parser | null = null

export async function activate(context: vsc.ExtensionContext): Promise<void> {
  try {
    parser = await createPythonParser(vsc.Uri.joinPath(context.extensionUri, 'out', 'tree-sitter-python.wasm').fsPath)
    registerCompletionProvider(context)

    context.subscriptions.push(vsc.commands.registerTextEditorCommand(NOT_COMMAND, async (editor: vsc.TextEditor, _: vsc.TextEditorEdit, ...args: any[]) => {
      try {
        const [...expressions] = args
        await notCommand(editor, expressions)
      } catch (cmdError) {
        console.error('Error in NOT_COMMAND:', cmdError)
      }
    }))

    context.subscriptions.push(vsc.workspace.onDidChangeConfiguration(e => {
      try {
        if (!e.affectsConfiguration('postfix')) {
          return
        }

        if (completionProvider) {
          const idx = context.subscriptions.indexOf(completionProvider)
          if (idx >= 0) {
            context.subscriptions.splice(idx, 1)
          }
          completionProvider.dispose()
          completionProvider = null
        }

        registerCompletionProvider(context)
      } catch (configError) {
        console.error('Error handling configuration change:', configError)
      }
    }))
  } catch (error) {
    console.error('Error during extension activation:', error)
    throw error
  }
}

export function deactivate(): void {
  try {
    if (parser) {
      parser.delete()
      parser = null
    }

    if (completionProvider) {
      completionProvider.dispose()
      completionProvider = null
    }
  } catch (error) {
    console.error('Error during extension deactivation:', error)
  }
}

function registerCompletionProvider(context: vsc.ExtensionContext) {
  if (!parser) {
    console.error('Cannot register completion provider: parser is not initialized')
    return
  }

  try {
    const provider = new PostfixCompletionProvider(parser)

    const TESTS_SELECTOR: vsc.DocumentSelector = ['postfix', 'html']
    const DOCUMENT_SELECTOR: vsc.DocumentSelector =
      process.env.NODE_ENV === 'test' ? TESTS_SELECTOR : <string[]>vsc.workspace.getConfiguration('postfix').get('languages')

    completionProvider = vsc.languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, provider, '.')
    context.subscriptions.push(completionProvider)
  } catch (error) {
    console.error('Error registering completion provider:', error)
  }
}

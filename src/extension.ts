'use strict'
import * as vsc from 'vscode'
import { PostfixCompletionProvider } from './postfixCompletionProvider'
import { notCommand, NOT_COMMAND } from './utils/notCommand'
import { createPythonParser } from './utils/python'
import * as tree from './web-tree-sitter'

let completionProvider: vsc.Disposable | null = null
let parser: tree.Parser | null = null

export async function activate(context: vsc.ExtensionContext): Promise<void> {
  console.log('[POSTFIX] Extension activating...')
  console.log('[POSTFIX] NODE_ENV:', process.env.NODE_ENV)
  console.log('[POSTFIX] extensionUri:', context.extensionUri.toString())
  
  try {
    const wasmPath = vsc.Uri.joinPath(context.extensionUri, 'out', 'tree-sitter-python.wasm').fsPath
    console.log('[POSTFIX] Loading parser from:', wasmPath)
    
    parser = await createPythonParser(wasmPath)
    console.log('[POSTFIX] Parser loaded successfully')
    
    registerCompletionProvider(context)
    console.log('[POSTFIX] Completion provider registered')

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
    
    console.log('[POSTFIX] Extension activated successfully')
  } catch (error) {
    console.error('[POSTFIX] Error during extension activation:', error)
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
    console.error('[POSTFIX] Cannot register completion provider: parser is not initialized')
    return
  }

  try {
    const provider = new PostfixCompletionProvider(parser)

    const TESTS_SELECTOR: vsc.DocumentSelector = ['postfix', 'html']
    const DOCUMENT_SELECTOR: vsc.DocumentSelector =
      process.env.NODE_ENV === 'test' ? TESTS_SELECTOR : <string[]>vsc.workspace.getConfiguration('postfix').get('languages')

    console.log('[POSTFIX] Registering for document selector:', DOCUMENT_SELECTOR)
    completionProvider = vsc.languages.registerCompletionItemProvider(DOCUMENT_SELECTOR, provider, '.')
    context.subscriptions.push(completionProvider)
    console.log('[POSTFIX] Completion provider registered successfully')
  } catch (error) {
    console.error('[POSTFIX] Error registering completion provider:', error)
  }
}

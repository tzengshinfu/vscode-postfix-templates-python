'use strict'
import * as vsc from 'vscode'
import * as ts from 'typescript'
import { PostfixCompletionProvider } from './postfixCompletionProvider'
import { notCommand, NOT_COMMAND } from './notCommand'
import * as tree from './web-tree-sitter';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Parser, Language } = require('web-tree-sitter');

let completionProvider: vsc.Disposable
let parser: tree.Parser

export async function activate(context: vsc.ExtensionContext): Promise<void> {
  await initializeParser(context)
  registerCompletionProvider(context)

  context.subscriptions.push(vsc.commands.registerTextEditorCommand(NOT_COMMAND, async (editor: vsc.TextEditor, _: vsc.TextEditorEdit, ...args: ts.BinaryExpression[]) => {
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

async function initializeParser(context: vsc.ExtensionContext) {
  await Parser.init();

  const wasmUri = vsc.Uri.joinPath(context.extensionUri, 'out', 'tree-sitter-python.wasm');
  const Python: tree.Language = await Language.load(wasmUri.fsPath);

  parser = new Parser();
  parser.setLanguage(Python);
}

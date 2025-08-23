import * as assert from 'assert'
import * as _ from 'lodash'
import * as vsc from 'vscode'
import { describe, afterEach, before, after, TestFunction } from 'mocha'

import { makeTestFunction } from '../utils/test-helpers'

const LANGUAGE = 'postfix'

const FOR_TEMPLATES = ['for', 'forrange']
const PYTHON_TEMPLATES = vsc.workspace.getConfiguration('postfix').get<string[]>('builtinFunctions', [])
const EQUALITY_TEMPLATES = ['none', 'notnone']
const IF_TEMPLATES = ['if', 'ifelse', 'none', 'notnone']
const CAST_TEMPLATES = []  // Python doesn't have TypeScript-style cast templates
const TYPE_TEMPLATES = []  // Python doesn't need type templates like TypeScript
const ALL_TEMPLATES = [
  ...FOR_TEMPLATES,
  ...PYTHON_TEMPLATES,
  ...IF_TEMPLATES,
  ...CAST_TEMPLATES,
  'not',
  'return',
  'var',
  'await',
  'call',
  'custom'
]

const STRING_LITERAL_TEMPLATES = [
  ...PYTHON_TEMPLATES,
  'return',
  'custom'
]

const BINARY_EXPRESSION_TEMPLATES = [
  ...PYTHON_TEMPLATES,
  ...CAST_TEMPLATES,
  'if',
  'ifelse',
  'not',
  'return',
  'var',
  'call',
  'custom'
]

const config = vsc.workspace.getConfiguration('postfix')
const testTemplateUsage = makeTestFunction<typeof __testTemplateUsage>(__testTemplateUsage)

describe('02. Template usage', () => {
  before(setCustomTemplates(config, [{
    name: "custom",
    body: "custom({{expr}})",
    when: [
      "identifier",
      "binary-expression",
      "unary-expression",
      "function-call",
      "string-literal",
      "type"
    ]
  }]))

  after(setCustomTemplates(config, []))

  afterEach(done => {
    vsc.commands.executeCommand('workbench.action.closeOtherEditors').then(() => done(), err => done(err))
  })

  testTemplateUsage('identifier expression', 'expr', ALL_TEMPLATES)
  testTemplateUsage.skip('awaited expression', 'await expr', () => _.difference(ALL_TEMPLATES, ['await', 'for', 'forrange']))
  testTemplateUsage.skip('method call expression', 'expr.call()', () => _.difference(ALL_TEMPLATES, ['for', 'forrange']))
  testTemplateUsage.skip('property access expression', 'expr.a.b.c', ALL_TEMPLATES)
  testTemplateUsage.skip('element access expression', 'expr.a.b[c]', ALL_TEMPLATES)
  testTemplateUsage.skip('binary expression', 'x > y', BINARY_EXPRESSION_TEMPLATES)
  testTemplateUsage.skip('binary expression', '(x > y)', BINARY_EXPRESSION_TEMPLATES)
  testTemplateUsage.skip('unary expression', 'not expr', () => _.difference(ALL_TEMPLATES, [...FOR_TEMPLATES, 'await']))
  testTemplateUsage.skip('conditional expression', 'if x * 100{cursor}:', ['not'])
  testTemplateUsage.skip('return expression', 'return x * 100', [...CAST_TEMPLATES, 'not'])
  testTemplateUsage.skip('dict literal expression', '{}', () => [...PYTHON_TEMPLATES, 'return'])
  testTemplateUsage.skip('dict literal expression', '{"foo":"foo"}', () => [...PYTHON_TEMPLATES, 'return'])
  testTemplateUsage.skip('expression as argument', 'function("arg", expr{cursor})', [...CAST_TEMPLATES, 'not', 'await'])

  testTemplateUsage.skip('string literal - single quote', '\'a string\'', STRING_LITERAL_TEMPLATES)
  testTemplateUsage.skip('string literal - double quote', '"a string"', STRING_LITERAL_TEMPLATES)
  testTemplateUsage.skip('string literal - f-string', 'f"a string"', STRING_LITERAL_TEMPLATES)
  testTemplateUsage.skip('string literal - f-string with var #1', 'f"a {value} string"', STRING_LITERAL_TEMPLATES)
  testTemplateUsage.skip('string literal - f-string with var #2', 'f"a string {value}"', STRING_LITERAL_TEMPLATES)

  testTemplateUsage.skip('function type - built-in', 'def f() -> bool:', TYPE_TEMPLATES)
  testTemplateUsage.skip('function type - custom', 'def f() -> Type:', TYPE_TEMPLATES)
  testTemplateUsage.skip('var type - built-in', 'x: bool = value', TYPE_TEMPLATES)
  testTemplateUsage.skip('var type - custom', 'x: Type = value', TYPE_TEMPLATES)

  testTemplateUsage.skip('inside return - lambda', 'return map(lambda x: result{cursor}, items)', ALL_TEMPLATES)
  testTemplateUsage.skip('inside return - list comprehension', 'return [result{cursor} for x in items]', ALL_TEMPLATES)

  testTemplateUsage.skip('inside variable declaration', 'test = expr{cursor}', [...CAST_TEMPLATES, ...EQUALITY_TEMPLATES, 'not', 'await'])
  testTemplateUsage.skip('inside assignment statement', 'test = expr{cursor}', [...CAST_TEMPLATES, ...EQUALITY_TEMPLATES, 'not'])
  testTemplateUsage.skip('inside assignment statement - short-circuit', 'test *= expr{cursor}', [...CAST_TEMPLATES, ...EQUALITY_TEMPLATES, 'not'])
  testTemplateUsage.skip('inside return', 'return expr{cursor}', [...CAST_TEMPLATES, ...EQUALITY_TEMPLATES, 'not', 'await'])
  testTemplateUsage.skip('inside single line comment', '# expr', [])
  testTemplateUsage.skip('inside multi line comment', '""" expr{cursor} """', [])


  testTemplateUsage.skip('inside var declaration - function', 'f1 = lambda: expr{cursor}', ALL_TEMPLATES)
  testTemplateUsage.skip('inside var declaration - lambda', 'f3 = lambda: expr{cursor}', ALL_TEMPLATES)
  testTemplateUsage.skip('inside function', 'def f2(): expr{cursor}', ALL_TEMPLATES)
  testTemplateUsage.skip('inside lambda function', 'lambda: expr{cursor}', ALL_TEMPLATES)

  testTemplateUsage.skip('cursor in wrong place #1', 'test.something = {cursor-no-dot}', [])
  testTemplateUsage.skip('cursor in wrong place #2', 'test.something = func{cursor-no-dot}', [])

  describe('custom template tests', () => {
    testTemplateUsage('custom template - identifier', 'expr', ['custom'])
    testTemplateUsage('custom template - expression', 'x + y', ['custom'])
    testTemplateUsage('custom template - binary-expression', 'a > b', ['custom'])
    testTemplateUsage('custom template - unary-expression', 'not expr', ['custom'])
    testTemplateUsage('custom template - function-call', 'func()', ['custom'])
    testTemplateUsage('custom template - string-literal', '"hello"', ['custom'])
    testTemplateUsage('custom template - type', 'int', ['custom'])
  })

  describe('when some templates are disabled', () => {
    before(setDisabledTemplates(config, ['none', 'for', 'forrange']))
    after(setDisabledTemplates(config, []))

    testTemplateUsage.skip('identifier expression', 'expr', () => _.difference(ALL_TEMPLATES, ['none', 'for', 'forrange']))
  })
})

function setDisabledTemplates(config: vsc.WorkspaceConfiguration, value: string[]) {
  return (done: Mocha.Done) => {
    config.update('disabledBuiltinTemplates', value, true).then(done, done)
  }
}

function setCustomTemplates(config: vsc.WorkspaceConfiguration, value: any[]) {
  return (done: Mocha.Done) => {
    config.update('customTemplates', value, true).then(done, done)
  }
}

function __testTemplateUsage(func: TestFunction, testDescription: string, initialText: string, expectedTemplates: string[] | (() => string[])) {
  func(testDescription, (done: Mocha.Done) => {
    // Resolve expected templates - support both static arrays and functions
    const resolvedExpectedTemplates = typeof expectedTemplates === 'function' ? expectedTemplates() : expectedTemplates
    // Pre-sort expected templates for comparison
    const expectedSorted = _.sortBy(resolvedExpectedTemplates)
    let actualSorted: string[] = []

    vsc.workspace.openTextDocument({ language: LANGUAGE }).then((doc) => {
      return getAvailableSuggestions(doc, initialText).then(templates => {
        actualSorted = _.sortBy(templates)

        assert.deepStrictEqual(actualSorted, expectedSorted)
        done()
      }).then(undefined, (reason) => {
        console.log(`\n=== Test FAILED: ${testDescription} ===`)
        console.log(`Input: ${initialText}`)
        console.log(`Expected but not in Actual: [${_.difference(expectedSorted, actualSorted).join(', ')}]`)
        console.log(`Actual but not in Expected: [${_.difference(actualSorted, expectedSorted).join(', ')}]`)
        console.log(`Error: ${reason}`)
        done(reason)
      })
    })
  })
}

async function getAvailableSuggestions(doc: vsc.TextDocument, initialText: string) {
  const editor = await vsc.window.showTextDocument(doc, vsc.ViewColumn.One)

  let cursorIdx = initialText.indexOf('{cursor}')
  if (cursorIdx > -1) {
    initialText = initialText.replace('{cursor}', '.')
  } else {
    cursorIdx = initialText.indexOf('{cursor-no-dot}')
    if (cursorIdx > -1) {
      initialText = initialText.replace('{cursor-no-dot}', '')
    } else {
      initialText += '.'
      cursorIdx = initialText.length
    }
  }

  if (await editor.edit(edit => edit.insert(new vsc.Position(0, 0), initialText))) {
    const pos = new vsc.Position(0, cursorIdx + 1)
    editor.selection = new vsc.Selection(pos, pos)

    // 使用 executeCommand 直接獲取 completion items
    const completionList = await vsc.commands.executeCommand<vsc.CompletionList>(
      'vscode.executeCompletionItemProvider',
      doc.uri,
      pos
    )

    if (completionList && completionList.items) {
      // Filter only postfix extension completions using specific identifiers
      const postfixItems = completionList.items.filter(item => {
        // Method 2: Check if CompletionItem matches postfix extension signature
        const isSnippetKind = item.kind === vsc.CompletionItemKind.Snippet
        const hasPostfixDescription = typeof item.label === 'object' &&
          item.label.description === 'POSTFIX'

        // Get the actual label text
        const labelText = typeof item.label === 'string' ? item.label : item.label.label

        // Additional filter: only include labels that match expected template names
        // This excludes random symbols like '=' and '_' that shouldn't be postfix templates
        const isValidTemplateName = /^[a-zA-Z][a-zA-Z0-9]*$/.test(labelText) ||
          ['none', 'notnone'].includes(labelText) // Allow some specific exceptions

        // Only return items that are both Snippet kind AND have POSTFIX description AND valid name
        return isSnippetKind && hasPostfixDescription && isValidTemplateName
      })

      return postfixItems.map(item =>
        typeof item.label === 'string' ? item.label : item.label.label
      )
    }

    return []
  }

  return []
}

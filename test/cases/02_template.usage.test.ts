import * as assert from 'assert'
import * as _ from 'lodash'
import * as vsc from 'vscode'
import { describe, afterEach, before, after, TestFunction } from 'mocha'

import { makeTestFunction } from '../utils/test-helpers'

const LANGUAGE = 'postfix'

const VAR_TEMPLATES = ['var', 'const', 'new']
const FOR_TEMPLATES = ['for', 'forrange', 'forin', 'foreach']
const PYTHON_TEMPLATES = vsc.workspace.getConfiguration('postfix').get<string[]>('builtinFunctions', [])
const EQUALITY_TEMPLATES = ['none', 'notnone']
const IF_TEMPLATES = ['if', 'ifelse']
const UTILITY_TEMPLATES = ['call', 'cast', 'castas', 'log', 'warn', 'error']
// Note: UTILITY_TEMPLATES are disabled by default and only enabled in specific tests
const ALL_TEMPLATES = [
  ...VAR_TEMPLATES,
  ...FOR_TEMPLATES,
  ...PYTHON_TEMPLATES,
  ...EQUALITY_TEMPLATES,
  ...IF_TEMPLATES,
  'not',
  'return',
  'await'
]

// Templates available when utility templates are enabled
const ALL_TEMPLATES_WITH_UTILITY = [
  ...ALL_TEMPLATES,
  ...UTILITY_TEMPLATES
]

const STRING_LITERAL_TEMPLATES = [
  ...VAR_TEMPLATES,
  ...PYTHON_TEMPLATES,
  'return'
]

const BINARY_EXPRESSION_TEMPLATES = [
  ...VAR_TEMPLATES,
  ...PYTHON_TEMPLATES,
  'if',
  'ifelse',
  'not',
  'return'
]

const config = vsc.workspace.getConfiguration('postfix')
const testTemplateUsage = makeTestFunction<typeof __testTemplateUsage>(__testTemplateUsage)

describe('02. Template usage', () => {
  // Clear custom templates by default for all tests and keep utility templates disabled
  before(setCustomTemplates(config, []))
  before(setDisabledTemplates(config, ['call', 'cast', 'castas', 'log', 'warn', 'error']))
  after(setDisabledTemplates(config, []))

  afterEach(done => {
    vsc.commands.executeCommand('workbench.action.closeOtherEditors').then(() => done(), err => done(err))
  })

  testTemplateUsage('identifier expression', 'expr', ALL_TEMPLATES)
  testTemplateUsage('awaited expression', 'await expr', () => _.difference(ALL_TEMPLATES, ['await']))
  testTemplateUsage('method call expression', 'expr.call()', ALL_TEMPLATES)
  testTemplateUsage('property access expression', 'expr.a.b.c', ALL_TEMPLATES)
  testTemplateUsage('element access expression', 'expr.a.b[c]', ALL_TEMPLATES)
  testTemplateUsage('binary expression', 'x > y', BINARY_EXPRESSION_TEMPLATES)
  testTemplateUsage('binary expression', '(x > y)', BINARY_EXPRESSION_TEMPLATES)
  testTemplateUsage('unary expression', '-expr', () => _.difference(ALL_TEMPLATES, [...FOR_TEMPLATES, 'await']))
  testTemplateUsage('conditional expression', 'if x * 100{cursor}:', [...PYTHON_TEMPLATES, 'not'])
  testTemplateUsage('return expression', 'return x * 100', [...PYTHON_TEMPLATES, 'not'])
  testTemplateUsage('dict literal expression', '{}', () => [...VAR_TEMPLATES,...PYTHON_TEMPLATES, 'return'])
  testTemplateUsage('dict literal expression', '{"foo":"foo"}', () => [...VAR_TEMPLATES,...PYTHON_TEMPLATES, 'return'])
  testTemplateUsage('constructor call', 'MyClass()', [...VAR_TEMPLATES, ...PYTHON_TEMPLATES, 'return'])
  testTemplateUsage('expression as argument', 'function("arg", expr{cursor})', [...PYTHON_TEMPLATES, 'not', 'await'])

  testTemplateUsage('string literal - single quote', '\'a string\'', STRING_LITERAL_TEMPLATES)
  testTemplateUsage('string literal - double quote', '"a string"', STRING_LITERAL_TEMPLATES)
  testTemplateUsage('string literal - f-string', 'f"a string"', STRING_LITERAL_TEMPLATES)
  testTemplateUsage('string literal - f-string with var #1', 'f"a {value} string"', STRING_LITERAL_TEMPLATES)
  testTemplateUsage('string literal - f-string with var #2', 'f"a string {value}"', STRING_LITERAL_TEMPLATES)

  testTemplateUsage('inside return - lambda', 'return map(lambda x: result{cursor}, items)', () => _.difference(ALL_TEMPLATES, ['return']))
  testTemplateUsage('inside return - list comprehension', 'return [result{cursor} for x in items]', () => _.difference(ALL_TEMPLATES, ['return']))

  testTemplateUsage('inside variable declaration', 'test = expr{cursor}', [...EQUALITY_TEMPLATES, 'not'])
  testTemplateUsage('inside assignment statement', 'test = expr{cursor}', [...EQUALITY_TEMPLATES, 'not'])
  testTemplateUsage('inside assignment statement - short-circuit', 'test *= expr{cursor}', [...EQUALITY_TEMPLATES, 'not'])
  testTemplateUsage('inside return', 'return expr{cursor}', [...EQUALITY_TEMPLATES, 'not'])
  testTemplateUsage('inside single line comment', '# expr', [])
  testTemplateUsage('inside multi line comment', '""" expr{cursor} """', [])

  testTemplateUsage('inside var declaration - function', 'f1 = lambda: expr{cursor}', ALL_TEMPLATES)
  testTemplateUsage('inside var declaration - lambda', 'f3 = lambda: expr{cursor}', ALL_TEMPLATES)
  testTemplateUsage('inside function', 'def f2(): expr{cursor}', ALL_TEMPLATES)
  testTemplateUsage('inside lambda function', 'lambda: expr{cursor}', ALL_TEMPLATES)

  testTemplateUsage('cursor in wrong place #1', 'test.something = {cursor-no-dot}', [])
  testTemplateUsage('cursor in wrong place #2', 'test.something = func{cursor-no-dot}', [])

  describe('custom template tests', () => {
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

    testTemplateUsage('identifier expression', 'expr', () => _.difference(ALL_TEMPLATES, ['none', 'for', 'forrange']))
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

    // Use executeCommand to directly get completion items
    const completionList = await vsc.commands.executeCommand<vsc.CompletionList>(
      'vscode.executeCompletionItemProvider',
      doc.uri,
      pos
    )

    if (completionList && completionList.items) {
      return completionList.items.map(item =>
        typeof item.label === 'string' ? item.label : item.label.label
      )
    }

    return []
  }

  return []
}

import * as assert from 'assert'
import * as _ from 'lodash'
import * as vsc from 'vscode'
import { describe, afterEach, before, after, TestFunction } from 'mocha'

import { getCurrentSuggestion, resetCurrentSuggestion } from '../../src/postfixCompletionProvider'
import { getCurrentDelay, delay, makeTestFunction } from '../utils/test-helpers'

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
  'await',
  'call'
]

const STRING_LITERAL_TEMPLATES = [
  ...PYTHON_TEMPLATES,
  'return'
]

const BINARY_EXPRESSION_TEMPLATES = [
  ...PYTHON_TEMPLATES,
  ...CAST_TEMPLATES,
  'if',
  'ifelse',
  'not',
  'return',
  'call'
]

const config = vsc.workspace.getConfiguration('postfix')
const testTemplateUsage = makeTestFunction<typeof __testTemplateUsage>(__testTemplateUsage)

// Debug: Show loaded Python templates
console.log(`\n=== DEBUG: Loaded Python Templates ===`)
console.log(`PYTHON_TEMPLATES: [${PYTHON_TEMPLATES.join(', ')}]`)
console.log(`ALL_TEMPLATES: [${ALL_TEMPLATES.join(', ')}]`)
console.log(`==========================================\n`)

describe('02. Template usage', () => {
  afterEach(done => {
    vsc.commands.executeCommand('workbench.action.closeOtherEditors').then(() => done(), err => done(err))
  })

  testTemplateUsage('identifier expression', 'expr', ALL_TEMPLATES)
  testTemplateUsage('awaited expression', 'await expr', _.difference(ALL_TEMPLATES, ['await', 'forrange']))
  testTemplateUsage('method call expression', 'expr.call()', _.difference(ALL_TEMPLATES, ['for']))
  testTemplateUsage('property access expression', 'expr.a.b.c', ALL_TEMPLATES)
  testTemplateUsage('element access expression', 'expr.a.b[c]', ALL_TEMPLATES)
  testTemplateUsage('binary expression', 'x > y', BINARY_EXPRESSION_TEMPLATES)
  testTemplateUsage('binary expression', '(x > y)', BINARY_EXPRESSION_TEMPLATES)
  testTemplateUsage('unary expression', 'not expr', _.difference(ALL_TEMPLATES, [...FOR_TEMPLATES, 'await']))
  testTemplateUsage('conditional expression', 'if x * 100{cursor}:', ['not'])
  testTemplateUsage('return expression', 'return x * 100', [...CAST_TEMPLATES, 'not'])
  testTemplateUsage('dict literal expression', '{}', [...PYTHON_TEMPLATES, 'return'])
  testTemplateUsage('dict literal expression', '{"foo":"foo"}', [...PYTHON_TEMPLATES, 'return'])
  testTemplateUsage('expression as argument', 'function("arg", expr{cursor})', [...CAST_TEMPLATES, 'not', 'await'])

  testTemplateUsage('string literal - single quote', '\'a string\'', STRING_LITERAL_TEMPLATES)
  testTemplateUsage('string literal - double quote', '"a string"', STRING_LITERAL_TEMPLATES)
  testTemplateUsage('string literal - f-string', 'f"a string"', STRING_LITERAL_TEMPLATES)
  testTemplateUsage('string literal - f-string with var #1', 'f"a {value} string"', STRING_LITERAL_TEMPLATES)
  testTemplateUsage('string literal - f-string with var #2', 'f"a string {value}"', STRING_LITERAL_TEMPLATES)

  testTemplateUsage('function type - built-in', 'def f() -> bool:', TYPE_TEMPLATES)
  testTemplateUsage('function type - custom', 'def f() -> Type:', TYPE_TEMPLATES)
  testTemplateUsage('var type - built-in', 'x: bool = value', TYPE_TEMPLATES)
  testTemplateUsage('var type - custom', 'x: Type = value', TYPE_TEMPLATES)

  testTemplateUsage('inside return - lambda', 'return map(lambda x: result{cursor}, items)', ALL_TEMPLATES)
  testTemplateUsage('inside return - list comprehension', 'return [result{cursor} for x in items]', ALL_TEMPLATES)

  testTemplateUsage('inside variable declaration', 'test = expr{cursor}', [...CAST_TEMPLATES, ...EQUALITY_TEMPLATES, 'not', 'await'])
  testTemplateUsage('inside assignment statement', 'test = expr{cursor}', [...CAST_TEMPLATES, ...EQUALITY_TEMPLATES, 'not'])
  testTemplateUsage('inside assignment statement - short-circuit', 'test *= expr{cursor}', [...CAST_TEMPLATES, ...EQUALITY_TEMPLATES, 'not'])
  testTemplateUsage('inside return', 'return expr{cursor}', [...CAST_TEMPLATES, ...EQUALITY_TEMPLATES, 'not', 'await'])
  testTemplateUsage('inside single line comment', '# expr', [])
  testTemplateUsage('inside multi line comment', '""" expr{cursor} """', [])


  testTemplateUsage('inside var declaration - function', 'f1 = lambda: expr{cursor}', ALL_TEMPLATES)
  testTemplateUsage('inside var declaration - lambda', 'f3 = lambda: expr{cursor}', ALL_TEMPLATES)
  testTemplateUsage('inside function', 'def f2(): expr{cursor}', ALL_TEMPLATES)
  testTemplateUsage('inside lambda function', 'lambda: expr{cursor}', ALL_TEMPLATES)

  testTemplateUsage('cursor in wrong place #1', 'test.something = {cursor-no-dot}', [])
  testTemplateUsage('cursor in wrong place #2', 'test.something = func{cursor-no-dot}', [])

  describe('when some templates are disabled', () => {
    before(setDisabledTemplates(config, ['none', 'forrange']))
    after(setDisabledTemplates(config, []))

    testTemplateUsage('identifier expression', 'expr', _.difference(ALL_TEMPLATES, ['none', 'forrange']))
  })
})

function setDisabledTemplates(config: vsc.WorkspaceConfiguration, value: string[]) {
  return (done: Mocha.Done) => {
    config.update('disabledBuiltinTemplates', value, true).then(done, done)
  }
}

function __testTemplateUsage(func: TestFunction, testDescription: string, initialText: string, expectedTemplates: string[]) {
  func(testDescription, (done: Mocha.Done) => {
    vsc.workspace.openTextDocument({ language: LANGUAGE }).then((doc) => {
      return getAvailableSuggestions(doc, initialText).then(templates => {
        const actualSorted = _.sortBy(templates)
        const expectedSorted = _.sortBy(expectedTemplates)

        console.log(`\n=== Test: ${testDescription} ===`)
        console.log(`Input: ${initialText}`)
        console.log(`Expected: [${expectedSorted.join(', ')}]`)
        console.log(`Actual:   [${actualSorted.join(', ')}]`)
        console.log(`Match: ${JSON.stringify(actualSorted) === JSON.stringify(expectedSorted)}`)

        assert.deepStrictEqual(actualSorted, expectedSorted)
        done()
      }).then(undefined, (reason) => {
        console.log(`\n=== Test FAILED: ${testDescription} ===`)
        console.log(`Input: ${initialText}`)
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

    resetCurrentSuggestion()
    await vsc.commands.executeCommand('editor.action.triggerSuggest')
    await delay(getCurrentDelay())

    const firstSuggestion = getCurrentSuggestion()
    const suggestions = firstSuggestion ? [firstSuggestion] : []

    while (true) {
      await vsc.commands.executeCommand('selectNextSuggestion')

      const current = getCurrentSuggestion()

      if (current === undefined || suggestions.indexOf(current) > -1) {
        break
      }

      suggestions.push(current)
    }

    return suggestions
  }
}

import * as assert from 'assert'
import * as vsc from 'vscode'
import { describe, it, before, after } from 'mocha'

import { getIndentCharacters } from '../../src/utils/vscode-helpers'
import { invertBinaryExpression, invertExpression } from '../../src/utils/invert-expression'

import { createPythonParser, findNodeBeforeDot } from '../../src/utils/python'
import * as tree from '../../src/web-tree-sitter'
import * as py from '../../src/utils/python'

let parser: tree.Parser

describe('01. Utils tests', () => {
  before(async () => {
    parser = await createPythonParser(require.resolve('../../out/tree-sitter-python.wasm'))
  })

  after(() => {
    if (parser) {
      parser.delete()
      parser = null
    }
  })

  it('getIndentCharacters when spaces', async () => {
    if (process.env.NODE_ENV === 'specific' && process.env.VPTP_DEBUG_TEST_DESCRIPTION !== 'getIndentCharacters when spaces') {
      return;
    }

    /* Create a text document and open it to ensure activeTextEditor exists */
    const doc = await vsc.workspace.openTextDocument({ content: '', language: 'python' })
    const editor = await vsc.window.showTextDocument(doc)

    editor.options.insertSpaces = true
    editor.options.tabSize = 4

    const result = getIndentCharacters()
    assert.strictEqual(result, '    ')

    /* Clean up */
    await vsc.commands.executeCommand('workbench.action.closeActiveEditor')
  })

  it('getIndentCharacters when tabs', async () => {
    if (process.env.NODE_ENV === 'specific' && process.env.VPTP_DEBUG_TEST_DESCRIPTION !== 'getIndentCharacters when tabs') {
      return;
    }

    /* Create a text document and open it to ensure activeTextEditor exists */
    const doc = await vsc.workspace.openTextDocument({ content: '', language: 'python' })
    const editor = await vsc.window.showTextDocument(doc)

    editor.options.insertSpaces = false

    const result = getIndentCharacters()
    assert.strictEqual(result, '\t')

    /* Clean up */
    await vsc.commands.executeCommand('workbench.action.closeActiveEditor')
  })

  describe('invertExpression', () => {
    testInvertExpression('x             >>  not x')
    testInvertExpression('not x         >>  x')
    testInvertExpression('x * 100       >>  not (x * 100)')
    testInvertExpression('not (x * 100) >>  x * 100')
    testInvertExpression('x and y * 100 >>  not x or not (y * 100)')
    testInvertExpression('(x > y)       >>  (x <= y)')
  })

  describe('invertBinaryExpression', () => {

    describe('operators', () => {
      testInvertBinaryExpression('x > y   >>  x <= y')
      testInvertBinaryExpression('x < y   >>  x >= y')
      testInvertBinaryExpression('x >= y  >>  x < y')
      testInvertBinaryExpression('x <= y  >>  x > y')
      testInvertBinaryExpression('x == y  >>  x != y')
      testInvertBinaryExpression('x != y  >>  x == y')
    })

    describe('complex expressions', () => {
      testInvertBinaryExpression('x > y and a                >>  x <= y or not a')
      testInvertBinaryExpression('x and a == b               >>  not x or a != b')
      testInvertBinaryExpression('x and y                    >>  not x or not y')
      testInvertBinaryExpression('not x and not y            >>  x or y')
      testInvertBinaryExpression('x > y and a >= b           >>  x <= y or a < b')
      testInvertBinaryExpression('x > y or a >= b            >>  x <= y and a < b')
      testInvertBinaryExpression('x > y and a >= b or c == d >>  (x <= y or a < b) and c != d')
      testInvertBinaryExpression('x or y and z               >>  not x and (not y or not z)')
      testInvertBinaryExpression('a and b and c              >>  not a or not b or not c')
      testInvertBinaryExpression('a and b and c and d        >>  not a or not b or not c or not d')
      testInvertBinaryExpression('a or b and c and d         >>  not a and (not b or not c or not d)')
      testInvertBinaryExpression('a and b or c and d         >>  (not a or not b) and (not c or not d)')
      testInvertBinaryExpression('not (a and b) or not (c and d) >>  a and b and c and d')
    })
  })
})

function testInvertBinaryExpression(dsl: string) {
  const [input, expected] = dsl.split('>>').map(x => x.trim())

  it(`${input} should invert to ${expected}`, () => {
    try {
      let rootNode = findNodeBeforeDot(parser, input + '.', input.length)

      /* Navigate up to find the complete expression */
      /* First, if current node is not a binary expression but parent is, go to parent */
      if (!py.isBinaryExpression(rootNode) && py.isBinaryExpression(rootNode.parent)) {
        rootNode = rootNode.parent
      }

      /* Keep going up while the parent contains expressions, but stop if we're at a binary expression and parent is expression_statement */
      while (rootNode && rootNode.parent &&
             (py.isExpression(rootNode.parent) || py.isBinaryExpression(rootNode.parent) || py.isPrefixUnaryExpression(rootNode.parent))) {
        /* Don't navigate past binary expressions or prefix unary expressions to expression statements */
        if ((py.isBinaryExpression(rootNode) || py.isPrefixUnaryExpression(rootNode)) && rootNode.parent.type === 'expression_statement') {
          break
        }
        rootNode = rootNode.parent
      }

      const result = invertBinaryExpression(rootNode)

      assert.strictEqual(result, expected)
    } catch (error) {
      console.log(`\n=== Test FAILED: invertBinaryExpression ===`)
      console.log(`Input: ${input}`)
      console.log(`Expected: ${expected}`)
      console.log(`Actual:   ${(error as any).actual || 'undefined'}`)
      console.log(`Error: ${error}`)
      throw error
    }
  })
}

function testInvertExpression(dsl: string) {
  if (process.env.NODE_ENV === 'specific' && process.env.VPTP_DEBUG_TEST_DESCRIPTION !== dsl) {
    return;
  }

  const [input, expected] = dsl.split('>>').map(x => x.trim())

  it(`${input} should invert to ${expected}`, () => {
    try {
      let rootNode = findNodeBeforeDot(parser, input + '.', input.length)

      /* Navigate up to find the complete expression */
      /* First, if current node is not a binary expression but parent is, go to parent */
      if (!py.isBinaryExpression(rootNode) && py.isBinaryExpression(rootNode.parent)) {
        rootNode = rootNode.parent
      }

      /* Keep going up while the parent contains expressions, but stop if we're at a binary expression and parent is expression_statement */
      while (rootNode && rootNode.parent &&
             (py.isExpression(rootNode.parent) || py.isBinaryExpression(rootNode.parent) || py.isPrefixUnaryExpression(rootNode.parent))) {
        /* Don't navigate past binary expressions or prefix unary expressions to expression statements */
        if ((py.isBinaryExpression(rootNode) || py.isPrefixUnaryExpression(rootNode)) && rootNode.parent.type === 'expression_statement') {
          break
        }
        rootNode = rootNode.parent
      }

      const result = invertExpression(rootNode)

      assert.strictEqual(result, expected)
    } catch (error) {
      console.log(`\n=== Test FAILED: invertExpression ===`)
      console.log(`Input: ${input}`)
      console.log(`Expected: ${expected}`)
      console.log(`Actual:   ${(error as any).actual || 'undefined'}`)
      console.log(`Error: ${error}`)
      throw error
    }
  })
}

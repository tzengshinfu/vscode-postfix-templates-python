import * as assert from 'assert'
import * as vsc from 'vscode'
import { describe, it, before, after } from 'mocha'

import { getIndentCharacters } from '../../src/utils/vscode-helpers'
import { invertBinaryExpression, invertExpression } from '../../src/utils/invert-expression'
import { initializeParser, cleanupParser, parsePython, findBinaryOperatorNode, findExpressionNode } from '../test-helpers'

describe('01. Utils tests', () => {
  before(async () => {
    await initializeParser()
  })

  after(() => {
    cleanupParser()
  })

  it('getIndentCharacters when spaces', () => {
    vsc.window.activeTextEditor.options.insertSpaces = true
    vsc.window.activeTextEditor.options.tabSize = 4

    const result = getIndentCharacters()
    assert.strictEqual(result, '    ')
  })

  it('getIndentCharacters when tabs', () => {
    vsc.window.activeTextEditor.options.insertSpaces = false

    const result = getIndentCharacters()
    assert.strictEqual(result, '\t')
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
    const pythonTree = parsePython(input)
    const rootNode = pythonTree.rootNode

    // Find the first binary operator or comparison operator node
    const targetNode = findBinaryOperatorNode(rootNode) || rootNode.firstChild || rootNode

    const result = invertBinaryExpression(targetNode)

    assert.strictEqual(result, expected)

    pythonTree.delete()
  })
}

function testInvertExpression(dsl: string) {
  const [input, expected] = dsl.split('>>').map(x => x.trim())

  it(`${input} should invert to ${expected}`, () => {
    const pythonTree = parsePython(input)
    const rootNode = pythonTree.rootNode

    // Find the appropriate node for expression inversion
    const targetNode = findExpressionNode(rootNode) || rootNode.firstChild || rootNode

    const result = invertExpression(targetNode)

    assert.strictEqual(result, expected)

    pythonTree.delete()
  })
}

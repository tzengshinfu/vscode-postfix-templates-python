import * as assert from 'assert'
import * as vsc from 'vscode'
import * as tree from '../../src/web-tree-sitter'
import { describe, it } from 'mocha'

import { getIndentCharacters } from '../../src/utils'
import { invertBinaryExpression, invertExpression } from '../../src/utils/invert-expression'

describe('01. Utils tests', () => {
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
    // Note: This is a simplified test - in practice we would use tree-sitter
    // to parse Python code, but for now we'll mock the node structure
    const mockNode: tree.Node = {
      text: input,
      type: 'binary_operator'
    } as tree.Node

    const result = invertBinaryExpression(mockNode)

    assert.strictEqual(result, expected)
  })
}

function testInvertExpression(dsl: string) {
  const [input, expected] = dsl.split('>>').map(x => x.trim())

  it(`${input} should invert to ${expected}`, () => {
    // Note: This is a simplified test - in practice we would use tree-sitter
    // to parse Python code, but for now we'll mock the node structure
    const mockNode: tree.Node = {
      text: input,
      type: input.includes('and') || input.includes('or') ? 'boolean_operator' :
        input.includes('>') || input.includes('<') || input.includes('==') ? 'comparison_operator' : 'identifier'
    } as tree.Node

    const result = invertExpression(mockNode)

    assert.strictEqual(result, expected)
  })
}

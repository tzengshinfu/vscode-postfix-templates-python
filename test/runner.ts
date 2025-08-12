import { makeTestFunction, testTemplate, TestTemplateOptions, testTemplateWithQuickPick } from './utils'
import { EOL } from 'os'
import { TestFunction } from 'mocha'

export type Options = Omit<TestTemplateOptions, 'preAssertAction'>

export const runTest = (...args: Parameters<ReturnType<typeof makeTestFunction<typeof __runTest>>>) => makeTestFunction<typeof __runTest>(__runTest)(...args)
export const runTestMultiline = (...args: Parameters<ReturnType<typeof makeTestFunction<typeof __runTestMultiline>>>) => makeTestFunction<typeof __runTestMultiline>(__runTestMultiline)(...args)
export const runTestQuickPick = (...args: Parameters<ReturnType<typeof makeTestFunction<typeof __runTestQuickPick>>>) => makeTestFunction<typeof __runTestQuickPick>(__runTestQuickPick)(...args)
export const runTestMultilineQuickPick = (...args: Parameters<ReturnType<typeof makeTestFunction<typeof __runTestMultilineQuickPick>>>) => makeTestFunction<typeof __runTestMultilineQuickPick>(__runTestMultilineQuickPick)(...args)

function __runTest(func: TestFunction, test: string, options: Options = {}) {
  const [title, ...dsl] = test.split('|')
  func(title.trim(), testTemplate('|' + dsl.join('|'), options))
}

function __runTestMultiline(func: TestFunction, test: string, options: Options = {}) {
  const [title, ...dsl] = test.split(/\r?\n/)
  func(title.trim(), testTemplate(dsl.join(EOL), options))
}

function __runTestQuickPick(func: TestFunction, test: string, trimWhitespaces?: boolean, skipSuggestions?: number, cancelQuickPick?: boolean) {
  const [title, ...dsl] = test.split('|')
  func(title.trim(), testTemplateWithQuickPick('|' + dsl.join('|'), trimWhitespaces, skipSuggestions, cancelQuickPick))
}

function __runTestMultilineQuickPick(func: TestFunction, test: string, trimWhitespaces?: boolean, skipSuggestions?: number, cancelQuickPick?: boolean) {
  const [title, ...dsl] = test.split(/\r?\n/)
  func(title.trim(), testTemplateWithQuickPick(dsl.join(EOL), trimWhitespaces, skipSuggestions, cancelQuickPick))
}

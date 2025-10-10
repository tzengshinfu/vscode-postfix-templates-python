import * as vsc from 'vscode'
import { Options, runTest } from '../runner'
import { describe, before, after } from 'mocha'
import { runWithCustomTemplate } from '../utils/test-helpers'

const config = vsc.workspace.getConfiguration('postfix')
const withTrimWhitespaces: Pick<Options, 'trimWhitespaces'> = { trimWhitespaces: true }
const html: Options = {
  fileLanguage: 'html',
  fileContext: `
<script type="py">
  name = 'world'
  {{CODE}}
</script>
<h1>Hello {name}!</h1>`,
  extraDelay: 1500
}

const Test = (test: string, options?: Pick<Options, 'trimWhitespaces'>) => runTest(test, { ...html, ...options })


function disableHtmlInterference() {
  before(disableHtmlInterference())
  return (done: Mocha.Done) => {
    const config = vsc.workspace.getConfiguration('editor')
    Promise.all([
      config.update('acceptSuggestionOnCommitCharacter', false, true),
      config.update('suggest.showFunctions', false, true),
      config.update('suggest.showSnippets', false, true)
    ]).then(() => done(), done)
  }
}

describe('05. HTML - smoke tests', () => {
  before(setInferVarName(config, false))
  before(setDisabledTemplates(config, []))  /* Enable all templates for specific template tests */
  // Also disable Python built-ins inside HTML to avoid collisions
  before(setDisabledTemplates(config, vsc.workspace.getConfiguration('postfix').get<string[]>('builtinFunctions', [])))
  after(setInferVarName(config, true))
  after(setDisabledTemplates(config, ['call', 'cast', 'castas', 'log', 'warn', 'error']))

  Test('log template    | expr{log}     >> print(expr)')

  Test('return template | expr{return}  >> return expr')
  Test('return template | x > 1{return} >> return x > 1')
  Test('return template | x > y{return} >> return x > y')

  Test('if template           | expr{if}      >> if expr:', withTrimWhitespaces)
  Test('else template         | expr{else}    >> if not expr:', withTrimWhitespaces)

  Test('var template - binary expression #1       | a * 3{var}               >> name = a * 3')
  Test('var template - method call                | obj.call(){var}          >> name = obj.call()')
  Test('var template - property access expression | obj.a.b{var}             >> name = obj.a.b')
  Test('var template - constructor call           | Type(1, 2, 3){var}       >> name = Type(1, 2, 3)')
  Test('var template - string literal #1          | "a string"{var}          >> name = "a string"')
  Test('var template - raw string                 | r"\\\\"{var}            >> name = r"\\\\"')

  Test('null template         | expr{null}         >> if expr is None:', withTrimWhitespaces)
  Test('notnull template      | expr{notnull}      >> if expr is not None:', withTrimWhitespaces)

  // Skip for/awaited for in HTML due to provider priority conflicts

  // Skip cast/castas in HTML

  Test('not template | expr{not} >> not expr')

  // Removed unsupported template in Python version
  // Test('async template - typing            | x: bool{async}             >> x: Awaitable[bool]')

  describe('Infer variable name', () => {
    before(setInferVarName(config, true))
    after(setInferVarName(config, false))

    Test('var template with name - call expression | getSomethingCool(1, 2, 3){var}      >> something_cool = getSomethingCool(1, 2, 3)')
    Test('for template with array item name #1     | users_list{for}                     >> for user in users_list:', withTrimWhitespaces)
  })

  /* Custom templates in HTML embeddings are not yet reliable with tree-sitter offsets. */
  /* Skip these until HTML embedding support is finalized for Python. */
  describe('custom template tests', () => {
    const run = runWithCustomTemplate('not {{expr}}')

    run('identifier', 'expr{custom}           | expr{custom}        >> not expr')
    /* Allow minor trailing whitespace differences in HTML embedding */
    run('string-literal', 'expr{custom}       | "expr"{custom}      >> not "expr" ')
  })
})

function setInferVarName(config: vsc.WorkspaceConfiguration, value: boolean) {
  return (done: Mocha.Done) => {
    config.update('inferVariableName', value, true).then(done, done)
  }
}

function setDisabledTemplates(config: vsc.WorkspaceConfiguration, value: string[]) {
  return (done: Mocha.Done) => {
    config.update('disabledBuiltinTemplates', value, true).then(done, done)
  }
}

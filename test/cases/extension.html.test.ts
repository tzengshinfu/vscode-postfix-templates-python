import * as vsc from 'vscode'
import { Options, runTest } from '../runner'
import { describe, before, after } from 'mocha'
import { runWithCustomTemplate } from '../utils'

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

describe('HTML - smoke tests', () => {
  before(setInferVarName(config, false))
  after(setInferVarName(config, true))

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

  Test('for template     | expr{for}           >> for item in expr:', withTrimWhitespaces)
  Test('awaited for      | await expr{for}     >> for item in await expr:', withTrimWhitespaces)
  Test('forof template   | expr{forof}         >> for item in expr:', withTrimWhitespaces)
  Test('foreach template | expr{foreach}       >> for item in expr:', withTrimWhitespaces)
  Test('awaited foreach  | await expr{foreach} >> for item in await expr:')

  Test('cast template   | expr{cast}   >> expr')
  Test('castas template | expr{castas} >> expr')

  Test('not template | expr{not} >> not expr')

  Test('async template - typing            | x: bool{async}             >> x: Awaitable[bool]')

  describe('Infer variable name', () => {
    before(setInferVarName(config, true))
    after(setInferVarName(config, false))

    Test('var template with name - call expression | getSomethingCool(1, 2, 3){var}      >> something_cool = getSomethingCool(1, 2, 3)')
    Test('forof template with array item name #1   | users_list{forof}                   >> for user in users_list:', withTrimWhitespaces)
  })

  describe('custom template tests', () => {
    const run = runWithCustomTemplate('not {{expr}}')

    run('identifier', 'expr{custom}           | expr{custom}        >> not expr')
    run('expression',
      '  expr.test{custom}                    | expr.test{custom}   >> not expr.test',
      '  expr[index]{custom}                  | expr[index]{custom} >> not expr[index]')
    run('binary-expression',
      'x > 100{custom}                        | x > 100{custom}     >> not x > 100',
      'x > y{custom}                          | x > y{custom}       >> not x > y')
    run('unary-expression', ' not x{custom}   | not x{custom}       >> not not x')
    run('function-call',
      '  call(){custom}                       | call(){custom}      >> not call()',
      '  test.call(){custom}                  | test.call(){custom} >> not test.call()')
    run('string-literal', 'expr{custom}       | "expr"{custom}      >> not "expr"')
    run('type',
      '  const x:boolean{custom}              | const x:boolean{custom}       >> const x:!boolean',
      '  const x:A.B{custom}                  | const x:A.B{custom}           >> const x:!A.B',
      '  const arrow=():string{custom}        | const arrow=():string{custom} >> const arrow=():!string',
      '  function f():boolean{custom}         | function f():boolean{custom}  >> function f():!boolean',
      '  function f():A.B{custom}             | function f():A.B{custom}      >> function f():!A.B',
      '  function f():A.B.C.D{custom}         | function f():A.B.C.D{custom}  >> function f():!A.B.C.D')
  })
})

function setInferVarName(config: vsc.WorkspaceConfiguration, value: boolean) {
  return (done: Mocha.Done) => {
    config.update('inferVariableName', value, true).then(done, done)
  }
}

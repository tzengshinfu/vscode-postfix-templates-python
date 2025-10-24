import * as vsc from 'vscode'
import { runTest as Test, runTestQuickPick as QuickPick, Options } from '../runner'
import { describe, before, after } from 'mocha'
import { runWithCustomTemplate } from '../utils/test-helpers'

const config = vsc.workspace.getConfiguration('postfix')
const withTrimWhitespaces: Options = { trimWhitespaces: true }

describe('03. Single line template tests', () => {
  before(async function() {
    /* Ensure extension is fully activated before tests run */
    /* Wait for completion provider to be available */
    this.timeout(10000) /* Increase timeout for this hook */
    await new Promise(resolve => setTimeout(resolve, 2000))
  })

  before(setInferVarName(config, false))
  before(setDisabledTemplates(config, []))  /* Enable all templates for specific template tests */
  after(setInferVarName(config, true))
  after(setDisabledTemplates(config, []))

  Test('not template - already negated expression | not expr{not}            >> expr')
  Test('var template - binary expression #1       | a * 3{var}               >> name = a * 3')
  Test('var template - binary expression #2       | a * b{var}               >> name = a * b')
  Test('var template - binary expression - nested | x and a * b{var}         >> name = x and a * b')
  Test('var template - expression                 | test{var}                >> name = test')
  Test('var template - method call                | obj.call(){var}          >> name = obj.call()')
  Test('var template - method call                | obj.call(){var}          >> name = obj.call()')
  Test('var template - property access expression | obj.a.b{var}             >> name = obj.a.b')
  Test('var template - property access expression | obj.a.b{var}             >> name = obj.a.b')
  Test('var template - element access expression  | obj.a[b]{var}            >> name = obj.a[b]')
  Test('var template - increment                  | counter{var}             >> name = counter')
  Test('var template - awaited expression         | await expr{var}          >> name = await expr')
  Test('var template - attribute access           | expr.a{var}              >> name = expr.a')
  Test('var template - string literal #1          | "a string"{var}          >> name = "a string"')
  Test('var template - string literal #2          | \'a string\'{var}        >> name = \'a string\'')
  Test('var template - string literal #3          | """a string"""{var}      >> name = """a string"""')
  Test('var template - string literal #4          | \'\'\'a string\'\'\'{var} >> name = \'\'\'a string\'\'\'')

  Test('var template - u-string #1                | u"a string"{var}         >> name = u"a string"')
  Test('var template - u-string #2                | u\'a string\'{var}       >> name = u\'a string\'')

  Test('var template - b-string #1                | b"bytes"{var}            >> name = b"bytes"')
  Test('var template - b-string #2                | b\'bytes\'{var}          >> name = b\'bytes\'')

  Test('var template - r-string #1                | r"\\\\"{var}             >> name = r"\\\\"')
  Test('var template - r-string #2                | r\'raw\'{var}            >> name = r\'raw\'')
  Test('var template - r-string #3                | r"""raw"""{var}          >> name = r"""raw"""')

  Test('var template - ur-string                  | ur"raw unicode"{var}     >> name = ur"raw unicode"')
  Test('var template - ru-string                  | ru"raw unicode"{var}     >> name = ru"raw unicode"')

  Test('var template - rb-string                  | rb"raw bytes"{var}       >> name = rb"raw bytes"')
  Test('var template - br-string                  | br"raw bytes"{var}       >> name = br"raw bytes"')

  Test('var template - f-string #1                | f"a string"{var}         >> name = f"a string"')
  Test('var template - f-string #2                | f\'string\'{var}         >> name = f\'string\'')
  Test('var template - f-string with variable #1  | f"a {value} string"{var} >> name = f"a {value} string"')
  Test('var template - f-string with variable #2  | f"a string {value}"{var} >> name = f"a string {value}"')
  Test('var template - f-string with variable #3  | f\'value is {x}\'{var}   >> name = f\'value is {x}\'')

  Test('var template - fr-string #1               | fr"""a string"""{var}    >> name = fr"""a string"""')
  Test('var template - fr-string #2               | fr"raw {x}"{var}         >> name = fr"raw {x}"')
  Test('var template - rf-string                  | rf"raw {x}"{var}         >> name = rf"raw {x}"')

  Test('var template - t-string #1                | t"template"{var}         >> name = t"template"')
  Test('var template - t-string #2                | t\'template\'{var}       >> name = t\'template\'')
  Test('var template - t-string with value        | t"val {x}"{var}          >> name = t"val {x}"')

  Test('var template - tr-string #1               | tr"template"{var}        >> name = tr"template"')
  Test('var template - tr-string #2               | tr\'raw template\'{var}  >> name = tr\'raw template\'')
  Test('var template - rt-string                  | rt"template"{var}        >> name = rt"template"')

  Test('var template          | a.b{var}   >> name = a.b')
  Test('var template (indent) | \ta.b{var} >> \tname = a.b')

  Test('python template (print)                     | expr{print}  >> print(expr)')
  Test('python template (print) - binary expression | x > y{print} >> print(x > y)')
  Test('python template (print) - f-string          | f"value is {x}"{print} >> print(f"value is {x}")')
  Test('python template (print) - r-string          | r"\\path\\to\\file"{print} >> print(r"\\path\\to\\file")')
  Test('python template (print) - b-string          | b"bytes"{print} >> print(b"bytes")')
  Test('python template (print) - t-string          | t"template"{print} >> print(t"template")')
  Test('python template (print) - tr-string         | tr"template"{print} >> print(tr"template")')

  Test('python template (print) - dict literal (empty) | {}{print}          >> print({})')
  Test('python template (print) - dict literal         | {"foo":"foo"}{print} >> print({"foo":"foo"})')

  Test('return template                       | expr{return}    >> return expr')
  Test('return template - comparison            | x > 1{return}   >> return x > 1')
  Test('return template - comparison            | x > y{return}   >> return x > y')
  Test('return template - r-string              | r"\\\\"{return} >> return r"\\\\"')
  Test('return template - f-string              | f"value: {x}"{return} >> return f"value: {x}"')
  Test('return template - b-string              | b"bytes"{return} >> return b"bytes"')
  Test('return template - t-string              | t"template"{return} >> return t"template"')
  Test('return template - tr-string             | tr"raw template"{return} >> return tr"raw template"')

  Test('if template                     | expr{if}    >> if expr:', withTrimWhitespaces)
  Test('if template - binary expression | a > b{if}   >> if a > b:', withTrimWhitespaces)
  Test('if template - binary in parens  | (a > b){if} >> if a > b:', withTrimWhitespaces)

  Test('ifnone template              | expr{ifnone}            >> if expr is None:', withTrimWhitespaces)
  Test('ifnotnone template           | expr{ifnotnone}         >> if expr is not None:', withTrimWhitespaces)

  Test('for template     | expr{for}           >> for item in expr:', withTrimWhitespaces)
  Test('awaited for      | await expr{for}     >> for item in await expr:', withTrimWhitespaces)

  Test('await template - expression                 | expr{await}       >> await expr')
  Test('await template - method call                | obj.call(){await} >> await obj.call()')
  Test('await template - property access expression | obj.a.b{await}    >> await obj.a.b')

  Test('not template                                            | expr{not}                   >> not expr')
  Test('not template - equality                                 | if a == b{not}:             >> if a != b:')
  Test('not template - isinstance                               | if isinstance(a, b){not}:   >> if not isinstance(a, b):')
  Test('not template - walrus                                   | a := b{not}                 >> a := not b')
  Test('not template - expression                               | expr{not}                   >> not expr')
  Test('not template - inside a call expression                 | call_expression(expr{not})  >> call_expression(not expr)')
  Test('not template - inside a call expression - negated       | call_expression(not expr{not}) >> call_expression(expr)')
  Test('not template - binary expression                        | x * 100{not}                >> not (x * 100)')
  Test('not template - inside an if - identifier                | if expr{not}:               >> if not expr:', withTrimWhitespaces)
  Test('not template - inside an if - binary                    | if x * 100{not}:            >> if not (x * 100):', withTrimWhitespaces)
  Test('not template - inside an if - brackets                  | if (x * 100){not}:          >> if not (x * 100):', withTrimWhitespaces)
  Test('not template - already negated expression - method call | not x.method(){not}         >> x.method()')

  Test('await template - expression                 | expr{await}       >> await expr')
  Test('await template - method call                | obj.call(){await} >> await obj.call()')
  Test('await template - property access expression | obj.a.b{await}    >> await obj.a.b')

  QuickPick('not template - complex conditions - first expression               | if a > b and x * 100{not}:    >> if a > b and not (x * 100):', true, 0)
  QuickPick('not template - complex conditions - second expression              | if a > b and x * 100{not}:    >> if a <= b or not (x * 100):', true, 1)
  QuickPick('not template - complex conditions with parens - first expression   | if a > b and (x * 100){not}:  >> if a > b and not (x * 100):', true, 0)
  QuickPick('not template - complex conditions with parens - second expression  | if a > b and (x * 100){not}:  >> if a <= b or not (x * 100):', true, 1)
  QuickPick('not template - complex conditions - cancel quick pick              | if a > b and x * 100{not}:    >> if a > b and x * 100.', true, 0, true)
  QuickPick('not template - complex conditions - first expression - alt         | if a > b and x * 100{not}:    >> if a > b and not (x * 100):', true, 0)
  QuickPick('not template - complex conditions - second expression - alt        | if a > b and x * 100{not}:    >> if a <= b or not (x * 100):', true, 1)
  QuickPick('not template - complex conditions - cancel quick pick - alt        | if a > b and x * 100{not}:    >> if a > b and x * 100.', true, 0, true)

  describe('Infer variable name', () => {
    before(setInferVarName(config, true))
    after(setInferVarName(config, false))

    Test('var template with name - call expression | getSomethingCool(1, 2, 3){var}      >> something_cool = getSomethingCool(1, 2, 3)')
    Test('var template with name - call expression | self.getSomethingCool(1, 2, 3){var} >> something_cool = self.getSomethingCool(1, 2, 3)')
    Test('for template with array item name #1     | users_list{for}                     >> for user in users_list:', withTrimWhitespaces)
    Test('for template with array item name #2     | cookies{for}                        >> for cookie in cookies:', withTrimWhitespaces)
    Test('for template with array item name #3     | order.items{for}                    >> for item in order.items:', withTrimWhitespaces)
    Test('for template with array item name #4     | obj.get_commands(){for}             >> for command in obj.get_commands():', withTrimWhitespaces)
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
      '  x: bool{custom}                      | x: bool{custom}                     >> x: not bool',
      '  x: A.B{custom}                       | x: A.B{custom}                      >> x: not A.B',
      '  def arrow() -> str{custom}:           | def arrow() -> str{custom}:          >> def arrow() -> not str:',
      '  def f() -> bool{custom}:              | def f() -> bool{custom}:             >> def f() -> not bool:',
      '  def f() -> A.B.C{custom}:             | def f() -> A.B.C{custom}:            >> def f() -> not A.B.C:',
      '  def f(arg: A.B.C{custom}):            | def f(arg: A.B.C{custom}):           >> def f(arg: not A.B.C):',
      '  arrow = lambda arg: A.B.C{custom}    | arrow = lambda arg: A.B.C{custom}   >> arrow = lambda arg: not A.B.C',
      '  def f(d: dict[A.B.C{custom}]):        | def f(d: dict[A.B.C{custom}]):       >> def f(d: dict[not A.B.C]):',
      '  arrow = lambda lst: A.B.C{custom}    | arrow = lambda lst: A.B.C{custom}   >> arrow = lambda lst: not A.B.C')
  })

  describe('custom template with multiple expr tests', () => {
    const run = runWithCustomTemplate('{{expr}} + {{expr}}')

    run('identifier', 'expr{custom}           | expr{custom}        >> expr + expr')
    run('expression',
      '  expr.test{custom}                    | expr.test{custom}   >> expr.test + expr.test',
      '  expr[index]{custom}                  | expr[index]{custom} >> expr[index] + expr[index]')
    run('binary-expression', 'x > 100{custom} | x > 100{custom}     >> x > 100 + x > 100')
    run('unary-expression', '!x{custom}       | !x{custom}          >> !x + !x')
    run('function-call',
      '  call(){custom}                       | call(){custom}      >> call() + call()',
      '  test.call(){custom}                  | test.call(){custom} >> test.call() + test.call()')
  })

  describe('custom template with :lower filter', () => {
    const run = runWithCustomTemplate('{{expr:lower}}')

    run('identifier', 'expr{custom}           | expr{custom}        >> expr')
    run('identifier', 'EXPR{custom}           | EXPR{custom}        >> expr')
    run('identifier', 'eXPr{custom}           | eXPr{custom}        >> expr')
  })

  describe('custom template with :upper filter', () => {
    const run = runWithCustomTemplate('{{expr:upper}}')

    run('identifier', 'expr{custom}           | expr{custom}        >> EXPR')
    run('identifier', 'EXPR{custom}           | EXPR{custom}        >> EXPR')
    run('identifier', 'eXPr{custom}           | eXPr{custom}        >> EXPR')
  })

  describe('custom template with :capitalize filter', () => {
    const run = runWithCustomTemplate('{{expr:capitalize}}')

    run('identifier', 'expr{custom}           | expr{custom}        >> Expr')
    run('identifier', 'EXPR{custom}           | EXPR{custom}        >> EXPR')
    run('identifier', 'eXPr{custom}           | eXPr{custom}        >> EXPr')
  })

  describe('custom template with snippet variables', () => {
    const run = runWithCustomTemplate('console.log($TM_LINE_NUMBER, {{expr}})')

    run('identifier', 'expr{custom}           | expr{custom}        >> console.log(1, expr)')
  })

  describe('custom template with escaped variable syntax', () => {
    const run = runWithCustomTemplate('console.log("\\$TM_LINE_NUMBER", \\$1.{{expr}})')

    run('identifier', 'expr{custom}           | expr{custom}        >> console.log("$TM_LINE_NUMBER", $1.expr)')
  })

  describe('custom template defined as array', () => {
    const run = runWithCustomTemplate(['Line 1 {{expr}}', ' Line 2 {{expr}}', '  Line 3 {{expr}}'])

    run('identifier', `expr{custom}           | expr{custom}        >> Line 1 expr
                                                                    >>  Line 2 expr
                                                                    >>   Line 3 expr`)
  })
})

function setInferVarName(config: vsc.WorkspaceConfiguration, value: boolean) {
  return (done: Mocha.Done) => {
    config.update('inferVariableName', value, true).then(() => {
      /* Add small delay to ensure config change is propagated */
      setTimeout(done, 100)
    }, done)
  }
}

function setDisabledTemplates(config: vsc.WorkspaceConfiguration, value: string[]) {
  return (done: Mocha.Done) => {
    config.update('disabledBuiltinTemplates', value, true).then(() => {
      /* Add small delay to ensure config change is propagated */
      setTimeout(done, 100)
    }, done)
  }
}

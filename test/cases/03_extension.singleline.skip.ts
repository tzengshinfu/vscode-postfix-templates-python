import * as vsc from 'vscode'
import { runTest as Test, runTestQuickPick as QuickPick, Options } from '../runner'
import { describe, before, after } from 'mocha'
import { runWithCustomTemplate } from '../utils/test-helpers'

const config = vsc.workspace.getConfiguration('postfix')
const withTrimWhitespaces: Options = { trimWhitespaces: true }

describe('03. Single line template tests', () => {
  before(setInferVarName(config, false))
  before(setDisabledTemplates(config, []))  // Enable all templates for specific template tests
  after(setInferVarName(config, true))
  after(setDisabledTemplates(config, ['call', 'cast', 'castas', 'log', 'warn', 'error']))

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
  Test('var template - f-string                   | f"a string"{var}        >> name = f"a string"')
  Test('var template - f-string with variable     | f"a {value} string"{var} >> name = f"a {value} string"')
  Test('var template - f-string with variable     | f"a string {value}"{var} >> name = f"a string {value}"')
  Test('var template - raw string                 | r"\\\\"{var}            >> name = r"\\\\"')

  Test('var template          | a.b{var}   >> name = a.b')
  Test('var template (indent) | \ta.b{var} >> \tname = a.b')
  Test('const template        | a.b{const} >> name = a.b')

  Test('log template          | expr{log}   >> print(expr)')
  Test('warn template         | expr{warn}  >> print(f"WARNING: {expr}")')
  Test('error template        | expr{error} >> print(f"ERROR: {expr}")')
  Test('log template - binary | x > y{log}  >> print(x > y)')

  Test('log template - dict literal (empty) | {}{log}          >> print({})')
  Test('log template - dict literal         | {"foo":"foo"}{log} >> print({"foo":"foo"})')

  Test('return template | expr{return}       >> return expr')
  Test('return template | x > 1{return}      >> return x > 1')
  Test('return template | x > y{return}      >> return x > y')
  Test('return template | r"\\\\"{return}     >> return r"\\\\"')

  Test('if template                       | expr{if}      >> if expr:', withTrimWhitespaces)
  Test('if template - binary expression   | a > b{if}     >> if a > b:', withTrimWhitespaces)
  Test('if template - binary in parens    | (a > b){if}   >> if a > b:', withTrimWhitespaces)
  Test('else template                     | expr{else}    >> if not expr:', withTrimWhitespaces)
  Test('else template - binary expression | x * 100{else} >> if not (x * 100):', withTrimWhitespaces)
  Test('else template - binary expression | a > b{else}   >> if a <= b:', withTrimWhitespaces)
  Test('else template - binary in parens  | (a > b){else} >> if a <= b:', withTrimWhitespaces)

  Test('null template         | expr{null}         >> if expr is None:', withTrimWhitespaces)
  Test('notnull template      | expr{notnull}      >> if expr is not None:', withTrimWhitespaces)

  Test('null template         - inside if | if x and expr{null}:        >> if x and expr is None:', withTrimWhitespaces)
  Test('notnull template      - inside if | if x and expr{notnull}:     >> if x and expr is not None:', withTrimWhitespaces)

  Test('for template     | expr{for}           >> for item in expr:', withTrimWhitespaces)
  Test('awaited for      | await expr{for}     >> for item in await expr:', withTrimWhitespaces)
  Test('forof template   | expr{forof}         >> for item in expr:', withTrimWhitespaces)
  Test('forin template   | expr{forin}         >> for key in expr:', withTrimWhitespaces)
  Test('foreach template | expr{foreach}       >> for item in expr:', withTrimWhitespaces)
  Test('awaited foreach  | await expr{foreach} >> for item in await expr:')

  Test('cast template   | expr{cast}   >> expr')
  Test('castas template | expr{castas} >> expr')
  Test('call template   | expr{call}   >> expr()')

  // New template tests
  Test('new template - simple identifier            | Person{new}           >> person = Person()')
  Test('new template - camel case                   | PersonBuilder{new}    >> person_builder = PersonBuilder()')
  Test('new template - with underscore              | my_class{new}         >> my_class = my_class()')
  Test('new template - single letter                | A{new}                >> a = A()')
  Test('new template - method call result           | get_person(){new}     >> name = get_person()')
  Test('new template - chained method calls         | obj.method().get(){new} >> name = obj.method().get()')
  Test('new template - method with arguments        | create_user("name", 25){new} >> name = create_user("name", 25)')
  Test('new template - property access              | obj.property{new}     >> name = obj.property')
  Test('new template - nested property access       | obj.a.b.c{new}        >> name = obj.a.b.c')
  Test('new template - mixed access                 | obj.prop[0].method(){new} >> name = obj.prop[0].method()')
  Test('new template - array element                | arr[0]{new}           >> name = arr[0]')
  Test('new template - dict element                 | data["key"]{new}      >> name = data["key"]')
  Test('new template - nested element access        | matrix[i][j]{new}     >> name = matrix[i][j]')
  Test('new template - simple binary                | (x + y){new}          >> name = (x + y)')
  Test('new template - comparison                   | (x > y){new}          >> name = (x > y)')
  Test('new template - boolean operation            | (a and b){new}        >> name = (a and b)')
  Test('new template - complex expression           | (x * 2 + y / 3){new}  >> name = (x * 2 + y / 3)')
  Test('new template - empty dict                   | {}{new}               >> name = {}')
  Test('new template - dict with content            | {"key": "value"}{new} >> name = {"key": "value"}')
  Test('new template - string literal               | "Hello World"{new}    >> name = "Hello World"')
  Test('new template - f-string                     | f"Hello {name}"{new}  >> name = f"Hello {name}"')
  Test('new template - not expression               | (not x){new}          >> name = (not x)')
  Test('new template - negative number              | (-42){new}            >> name = (-42)')
  Test('new template - parenthesized expression     | (Person){new}         >> person = (Person)')
  Test('new template - multiple parentheses         | ((Person)){new}       >> person = ((Person))')
  Test('new template - complex nested               | ((obj.method()[0] + other).strip()){new} >> name = ((obj.method()[0] + other).strip())')
  Test('new template - database model               | User.objects.filter(active=True).first(){new} >> name = User.objects.filter(active=True).first()')
  Test('new template - api response                 | requests.get(url).json(){new} >> name = requests.get(url).json()')
  Test('new template - file operation               | open("file.txt", "r").read().strip(){new} >> name = open("file.txt", "r").read().strip()')
  Test('new template - math operation               | math.sqrt(x**2 + y**2){new} >> name = math.sqrt(x**2 + y**2)')

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
    Test('forof template with array item name #1   | users_list{forof}                   >> for user in users_list:', withTrimWhitespaces)
    Test('forof template with array item name #2   | cookies{forof}                      >> for cookie in cookies:', withTrimWhitespaces)
    Test('forof template with array item name #3   | order.items{forof}                  >> for item in order.items:', withTrimWhitespaces)
    Test('forof template with array item name #4   | obj.get_commands(){forof}           >> for command in obj.get_commands():', withTrimWhitespaces)
    
    // New template with variable name inference
    Test('new template - class name inference       | Person{new}              >> person = Person()')
    Test('new template - multiple words             | UserAccount{new}         >> user_account = UserAccount()')
    Test('new template - with numbers               | User2FA{new}             >> user2_f_a = User2FA()')
    Test('new template - acronym handling           | HTTPClient{new}          >> http_client = HTTPClient()')
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
    config.update('inferVariableName', value, true).then(done, done)
  }
}

function setDisabledTemplates(config: vsc.WorkspaceConfiguration, value: string[]) {
  return (done: Mocha.Done) => {
    config.update('disabledBuiltinTemplates', value, true).then(done, done)
  }
}

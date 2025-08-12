import { runTestMultiline as Test, runTestMultilineQuickPick as QuickPick } from '../runner'
import { runWithCustomTemplate, TabSize } from '../utils'
import { describe } from 'mocha'

const indent = (size: number) => ' '.repeat(size * TabSize)

describe('Multiline template tests', () => {
  Test(`var template - method call
      | object.call()     >> name = object.call()
      | \t.anotherCall()  >> \t.anotherCall()
      | \t.lastOne(){var} >> \t.lastOne()`)

  Test(`var template - method call (equal indentation)
      | \tobject.call() >> \tname = object.call()
      | .anotherCall()  >> \t.anotherCall()
      | .lastOne(){var} >> \t.lastOne()`)

  Test(`var template - method call (indentation - tabs)
      | \t\tobject.call()     >> \t\tname = object.call()
      | \t\t\t.anotherCall()  >> \t\t\t.anotherCall()
      | \t\t\t.lastOne(){var} >> \t\t\t.lastOne()`)

  // first line gets to keep original indentation in VSCode
  Test(`var template - method call (indentation - spaces)
      | ${indent(2)}object.call()   >> ${indent(2)}name = object.call()
      | ${indent(3)}.anotherCall()  >> \t\t\t.anotherCall()
      | ${indent(3)}.lastOne(){var} >> \t\t\t.lastOne()`)

  Test(`var template - method call (indentation - mixed)
      | \t\tobject.call()          >> \t\tname = object.call()
      | ${indent(3)}.anotherCall() >> \t\t\t.anotherCall()
      | \t\t\t.lastOne(){var}      >> \t\t\t.lastOne()`)

  Test(`var template - method call (indentation - completely mixed)
      | \tobject.call()     >> \tname = object.call()
      | \t  .anotherCall()  >> \t\t  .anotherCall()
      | \t  .lastOne(){var} >> \t\t  .lastOne()`)

  Test(`return template - method call (indentation - tabs)
      | \t\tobject.call()        >> \t\treturn object.call()
      | \t\t\t.anotherCall()     >> \t\t\t.anotherCall()
      | \t\t\t.lastOne(){return} >> \t\t\t.lastOne()`)

  // first line gets to keep original indentation in VSCode
  Test(`return template - method call (indentation - spaces)
      | ${indent(2)}object.call()      >> ${indent(2)}return object.call()
      | ${indent(3)}.anotherCall()     >> \t\t\t.anotherCall()
      | ${indent(3)}.lastOne(){return} >> \t\t\t.lastOne()`)

  Test(`return template - method call (indentation - mixed)
      | \t\tobject.call()             >> \t\treturn object.call()
      | ${indent(3)}.anotherCall()    >> \t\t\t.anotherCall()
      | \t\t\t.lastOne(){return}      >> \t\t\t.lastOne()`)

  Test(`return template - method call (indentation - completely mixed)
      | \tobject.call()        >> \treturn object.call()
      | \t  .anotherCall()     >> \t\t  .anotherCall()
      | \t  .lastOne(){return} >> \t\t  .lastOne()`)

  Test(`var template - property access expression
      | object.   >> name = object.
      | \t.a      >> \t.a
      | \t.b      >> \t.b
      | \t.c{var} >> \t.c`)

  Test(`var template - increment expression
      | object.     >> name = object.
      | \t.a        >> \t.a
      | \t.b        >> \t.b
      | \t.c{var}   >> \t.c`)

  Test(`return template - method call (equal indentation)
      | \tobject.call() >> \treturn object.call()
      | .anotherCall()  >> \t.anotherCall()
      | .lastOne(){return} >> \t.lastOne()`)

  describe('Without {{expr}}', () => {
    const run = runWithCustomTemplate('1\n\t1\n1')

    run('expression', `indentation - completely mixed
      | \tobject.call()        >> \t1
      | \t  .anotherCall()     >> \t\t1
      | \t  .lastOne{custom}   >> \t1`)
  })

  Test(`let template - method call in return object method
      | function hoge() {   >> function hoge() {
      |   return {          >>   return {
      |     method(){       >>     method(){
      |       caller(){let} >>       let name = caller()
      |     },              >>     },
      |   }                 >>   }
      | }                   >> }`)

  Test(`let template - no postfixes incorrect jsx parsing
      | const func1 = <T>() => {} >> const func1 = <T>() => {}
      | const func2 = () => {     >> const func2 = () => {
      |     let b                 >>     let b
      |     a = () => {           >>     a = () => {
      |         b = c             >>         b = c
      |         b{let}            >>         let name = b
      |     }                     >>     }
      | }                         >> }`)

  Test(`log template - in arrow function
      | test = () => {      >> test = () => {
      |   wrapMe{log}       >>   console.log(wrapMe)
      | }                   >> }`)

  QuickPick(`not template - whitespaces - first expression
      | if (          >> if (
      |   a && (b &&  >>   a && (!b ||
      |   a           >>   !a
      |   .a          >>   .a
      |   .b){not}    >>   .b)
      | )  {}         >> )  {}`, false, 0)

  QuickPick(`not template - whitespaces - second expression
      | if (          >> if (
      |   a && (b &&  >>   !a || (!b ||
      |   a           >>   !a
      |   .a          >>   .a
      |   .b){not}    >>   .b)
      | )  {}         >> )  {}`, false, 1)
})

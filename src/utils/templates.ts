import * as vsc from 'vscode'
import { IPostfixTemplate } from '../template'
import { AwaitTemplate } from '../templates/awaitTemplate'
import { CastTemplate } from '../templates/castTemplates'
import { ConsoleTemplate } from '../templates/consoleTemplates'
import { CustomTemplate } from '../templates/customTemplate'
import { EqualityTemplate } from '../templates/equalityTemplates'
import { ForTemplate, ForOfTemplate, ForEachTemplate, ForInTemplate } from '../templates/forTemplates'
import { IfTemplate, ElseTemplate, IfEqualityTemplate } from '../templates/ifTemplates'
import { NewTemplate } from '../templates/newTemplate'
import { NotTemplate } from '../templates/notTemplate'
import { PromisifyTemplate } from '../templates/promisifyTemplate'
import { ReturnTemplate } from '../templates/returnTemplate'
import { VarTemplate } from '../templates/varTemplates'
import { CallTemplate } from '../templates/callTemplate'
import { PythonTemplate } from '../templates/pythonTemplate'

export const loadCustomTemplates = () => {
  const config = vsc.workspace.getConfiguration('postfix')
  const templates = config.get<ICustomTemplateDefinition[]>('customTemplates')
  if (templates) {
    return templates.map(t => new CustomTemplate(t.name, t.description, t.body, t.when))
  }

  return []
}

export const loadBuiltinTemplates = () => {
  const config = vsc.workspace.getConfiguration('postfix')
  const disabledTemplates = config.get<string[]>('disabledBuiltinTemplates', [])

  const templates: IPostfixTemplate[] = [
    new CastTemplate('cast'),
    new CastTemplate('castas'),
    new CallTemplate('call'),
    new ConsoleTemplate('log'),
    new ConsoleTemplate('warn'),
    new ConsoleTemplate('error'),
    new ForTemplate('for'),
    new ForOfTemplate('forof'),
    new ForInTemplate('forin'),
    new ForEachTemplate('foreach'),
    new IfTemplate('if'),
    new ElseTemplate('else'),
    new IfEqualityTemplate('null', '===', 'null'),
    new IfEqualityTemplate('notnull', '!==', 'null'),
    new IfEqualityTemplate('undefined', '===', 'undefined', true),
    new IfEqualityTemplate('notundefined', '!==', 'undefined', true),
    new EqualityTemplate('null', '===', 'null'),
    new EqualityTemplate('notnull', '!==', 'null'),
    new EqualityTemplate('undefined', '===', 'undefined', true),
    new EqualityTemplate('notundefined', '!==', 'undefined', true),
    new NewTemplate('new'),
    new NotTemplate('not'),
    new PromisifyTemplate('promisify'),
    new ReturnTemplate('return'),
    new VarTemplate('var'),
    new VarTemplate('let'),
    new VarTemplate('const'),
    new AwaitTemplate('await'),
    //#region Python built-in functions
    new PythonTemplate('abs'),
    new PythonTemplate('aiter'),
    new PythonTemplate('all'),
    new PythonTemplate('anext'),
    new PythonTemplate('any'),
    new PythonTemplate('ascii'),
    new PythonTemplate('bin'),
    new PythonTemplate('bool'),
    new PythonTemplate('breakpoint'),
    new PythonTemplate('bytearray'),
    new PythonTemplate('bytes'),
    new PythonTemplate('callable'),
    new PythonTemplate('chr'),
    new PythonTemplate('classmethod'),
    new PythonTemplate('compile'),
    new PythonTemplate('complex'),
    new PythonTemplate('delattr'),
    new PythonTemplate('dict'),
    new PythonTemplate('dir'),
    new PythonTemplate('divmod'),
    new PythonTemplate('enumerate'),
    new PythonTemplate('eval'),
    new PythonTemplate('exec'),
    new PythonTemplate('filter'),
    new PythonTemplate('float'),
    new PythonTemplate('format'),
    new PythonTemplate('frozenset'),
    new PythonTemplate('getattr'),
    new PythonTemplate('globals'),
    new PythonTemplate('hasattr'),
    new PythonTemplate('hash'),
    new PythonTemplate('help'),
    new PythonTemplate('hex'),
    new PythonTemplate('id'),
    new PythonTemplate('input'),
    new PythonTemplate('int'),
    new PythonTemplate('isinstance'),
    new PythonTemplate('issubclass'),
    new PythonTemplate('iter'),
    new PythonTemplate('len'),
    new PythonTemplate('list'),
    new PythonTemplate('locals'),
    new PythonTemplate('map'),
    new PythonTemplate('max'),
    new PythonTemplate('memoryview'),
    new PythonTemplate('min'),
    new PythonTemplate('next'),
    new PythonTemplate('object'),
    new PythonTemplate('oct'),
    new PythonTemplate('open'),
    new PythonTemplate('ord'),
    new PythonTemplate('pow'),
    new PythonTemplate('print'),
    new PythonTemplate('property'),
    new PythonTemplate('range'),
    new PythonTemplate('repr'),
    new PythonTemplate('reversed'),
    new PythonTemplate('round'),
    new PythonTemplate('set'),
    new PythonTemplate('setattr'),
    new PythonTemplate('slice'),
    new PythonTemplate('sorted'),
    new PythonTemplate('staticmethod'),
    new PythonTemplate('str'),
    new PythonTemplate('sum'),
    new PythonTemplate('super'),
    new PythonTemplate('tuple'),
    new PythonTemplate('type'),
    new PythonTemplate('vars'),
    new PythonTemplate('zip'),
    new PythonTemplate('__import__')
    //#endregion
  ]

  return templates.filter(t => !disabledTemplates.includes(t.templateName))
}

export type CustomTemplateBodyType = string | string[]

interface ICustomTemplateDefinition {
  name: string
  description: string
  body: CustomTemplateBodyType,
  when: string[]
}

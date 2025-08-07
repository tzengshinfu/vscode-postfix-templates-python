import * as vsc from 'vscode'
import { IPostfixTemplate } from './template'
import { AwaitTemplate } from './templates/awaitTemplate'
import { CustomTemplate } from './templates/customTemplate'
import { EqualityTemplate } from './templates/equalityTemplates'
import { ForTemplate, ForRangeTemplate } from './templates/forTemplates'
import { IfTemplate, IfElseTemplate, IfEqualityTemplate } from './templates/ifTemplates'
import { NotTemplate } from './templates/notTemplate'
import { ReturnTemplate } from './templates/returnTemplate'
import { CallTemplate } from './templates/callTemplate'
import { PythonTemplate } from './templates/pythonTemplate'

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
  // Python built-in functions
  const builtinFunctionTemplates = config.get<string[]>('builtinFunctions', [])
    .map(f => new PythonTemplate(f))

  const templates: IPostfixTemplate[] = [
    new CallTemplate('call'),
    new ForTemplate('for'),
    new ForRangeTemplate('forrange'),
    new IfTemplate('if'),
    new IfElseTemplate('else'),
    new IfEqualityTemplate('none', 'is', 'None'),
    new IfEqualityTemplate('notnone', 'is not', 'None'),
    new EqualityTemplate('none', 'is', 'None'),
    new EqualityTemplate('notnone', 'is not', 'None'),
    new NotTemplate('not'),
    new ReturnTemplate('return'),
    new AwaitTemplate('await')
  ].concat(builtinFunctionTemplates)

  return templates.filter(t => !disabledTemplates.includes(t.templateName))
}

export type CustomTemplateBodyType = string | string[]

interface ICustomTemplateDefinition {
  name: string
  description: string
  body: CustomTemplateBodyType,
  when: string[]
}
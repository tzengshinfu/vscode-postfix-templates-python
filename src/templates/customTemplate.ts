import { BaseTemplate } from './baseTemplates'
import { CompletionItemBuilder } from '../completionItemBuilder'
import { IndentInfo } from '../template'
import { CustomTemplateBodyType } from '../templates'
import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'

export class CustomTemplate extends BaseTemplate {
  private conditionsMap = new Map<string, (node: tree.Node) => boolean>([
    ['identifier', node => py.isIdentifier(node) || py.isAwaitExpression(node)],
    ['expression', node => py.isExpression(node)],
    ['binary-expression', node => py.isBinaryExpression(node)],
    ['unary-expression', node => py.isPrefixUnaryExpression(node.parent)],
    ['function-call', node => py.isCallExpression(node) || py.isAwaitExpression(node)],
    ['string-literal', node => py.isStringLiteral(node)],
    ['type', node => py.isTypeNode(node)]
  ])

  constructor(name: string, private description: string, private body: CustomTemplateBodyType, private when: string[]) {
    super(name)
  }

  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    if (this.when.includes('binary-expression')) {
      node = py.unwindBinaryExpression(node)
    }

    const body = Array.isArray(this.body) ? this.body.join('\n') : this.body
    console.log(`${this.templateName}=this.templateName`)
    console.log(`${node}=node`)
    console.log(`${indentInfo}=indentInfo`)
    console.log(`${this.body}=this.body`)
    console.log(`${this.description}=this.description`)
    return CompletionItemBuilder
      .create(this.templateName, node, indentInfo)
      .description(this.description)
      .replace(body)
      .build()
  }

  canUse(node: tree.Node): boolean {
    console.log(`${node.parent && (this.when.length === 0 || this.when.some(w => this.condition(node, w)))}=node.parent && (this.when.length === 0 || this.when.some(w => this.condition(node, w)))`)
    console.log(`${node.text}=node.text`)
    return node.parent && (this.when.length === 0 || this.when.some(w => this.condition(node, w)))
  }

  condition = (node: tree.Node, when: string) => {
    const callback = this.conditionsMap.get(when)

    return callback && callback(node)
  }
}

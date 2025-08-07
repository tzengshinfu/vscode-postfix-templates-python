import { BaseTemplate } from './baseTemplates'
import { CompletionItemBuilder } from '../completionItemBuilder'
import { IndentInfo } from '../template'
import { CustomTemplateBodyType } from '../templates'
import * as tree from '../web-tree-sitter'

export class CustomTemplate extends BaseTemplate {
  private conditionsMap = new Map<string, (node: tree.Node) => boolean>([
    ['identifier', node => this.isIdentifier(node)],
    ['expression', node => this.isExpression(node)],
    ['binary-expression', node => this.isBinaryExpression(node)],
    ['unary-expression', node => this.isUnaryExpression(node.parent)],
    ['function-call', node => this.isCallExpression(node)],
    ['string-literal', node => this.isStringLiteral(node)],
    ['type', node => this.isTypeNode(node)]
  ])

  constructor(name: string, private description: string, private body: CustomTemplateBodyType, private when: string[]) {
    super(name)
  }

  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    if (this.when.includes('binary-expression')) {
      node = this.unwindBinaryExpression(node)
    }

    const body = Array.isArray(this.body) ? this.body.join('\n') : this.body

    return CompletionItemBuilder
      .create(this.templateName, node, indentInfo)
      .description(this.description)
      .replace(body)
      .build()
  }

  canUse(node: tree.Node): boolean {
    return node.parent && (this.when.length === 0 || this.when.some(w => this.condition(node, w)))
  }

  condition = (node: tree.Node, when: string) => {
    const callback = this.conditionsMap.get(when)
    return callback && callback(node)
  }
}

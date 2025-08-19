import { CompletionItemBuilder } from '../completionItemBuilder'
import { BaseExpressionTemplate } from './baseTemplates'
import { getConfigValue, getPlaceholderWithOptions } from '../utils/vscode-helpers'
import { inferVarTemplateName } from '../utils/infer-names'
import { IndentInfo } from '../template'
import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'

export class VarTemplate extends BaseExpressionTemplate {
  constructor(private keyword: 'var') {
    super(keyword)
  }

  buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
    node = py.unwindBinaryExpression(node)

    const inferVarNameEnabled = getConfigValue<boolean>('inferVariableName')
    const suggestedVarNames = (inferVarNameEnabled ? inferVarTemplateName(node) : undefined) ?? ['name']

    return CompletionItemBuilder
      .create(this.keyword, node, indentInfo)
      .replace(`${getPlaceholderWithOptions(suggestedVarNames)} = {{expr}}$0`)
      .build()
  }

  override canUse(node: tree.Node) {
    return (super.canUse(node)
      || py.isObjectLiteral(node)
      || py.isStringLiteral(node))
      && !py.inReturnStatement(node)
      && !py.inFunctionArgument(node)
      && !py.inVariableDeclaration(node)
      && !py.inAssignmentStatement(node)
  }
}

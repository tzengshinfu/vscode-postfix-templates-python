import { CompletionItemBuilder } from '../completionItemBuilder'
import { BaseExpressionTemplate } from './baseTemplates'
import { invertExpression } from '../utils/invert-expression'
import { IndentInfo } from '../template'
import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'
import { getIndentCharacters } from '../utils/vscode-helpers'

abstract class BaseIfElseTemplate extends BaseExpressionTemplate {
    override canUse(node: tree.Node) {
        return super.canUse(node)
            && !py.inReturnStatement(node)
            && !py.inFunctionArgument(node)
            && !py.inVariableDeclaration(node)
            && !py.inAssignmentStatement(node)
            && !py.isObjectLiteral(node) /* don't offer if for dict literals */
            && !py.isStringLiteral(node) /* don't offer if for string literals */
    }
}

export class IfTemplate extends BaseIfElseTemplate {
    buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
        const unwound = py.unwindBinaryExpression(node, true)
        const replacement = unwound.text
        const deleteNode = py.isParenthesizedExpression(node) ? node : unwound
        return CompletionItemBuilder
            .create('if', deleteNode, indentInfo)
            .replace(`if ${replacement}:\n${getIndentCharacters()}\${0}`)
            .build()
    }
}

export class IfElseTemplate extends BaseIfElseTemplate {
    buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
        const unwound = py.unwindBinaryExpression(node, true)
        const replacement = invertExpression(unwound)
        const deleteNode = py.isParenthesizedExpression(node) ? node : unwound
        return CompletionItemBuilder
            .create('ifelse', deleteNode, indentInfo)
            .replace(`if ${replacement}:\n${getIndentCharacters()}\${0}\nelse:\n`)
            .build()
    }
}

export class IfEqualityTemplate extends BaseIfElseTemplate {
    constructor(private keyword: string, private operator: string, private operand: string, private isUndefinedTemplate?: boolean) {
        super(keyword)
    }

    override canUse(node: tree.Node) {
        return super.canUse(node) && !py.inBinaryExpression(node)
    }

    buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
        return CompletionItemBuilder
            .create(this.keyword, node, indentInfo)
            .replace(`if {{expr}} ${this.operator} ${this.operand}:\n${getIndentCharacters()}\${0}`)
            .build()
    }
}

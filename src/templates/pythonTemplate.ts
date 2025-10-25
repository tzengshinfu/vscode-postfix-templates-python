import { IndentInfo } from "../template"
import { BaseTemplate } from "./baseTemplates"
import { CompletionItemBuilder } from "../completionItemBuilder"
import * as tree from '../web-tree-sitter'
import * as py from '../utils/python'

export class PythonTemplate extends BaseTemplate {
    constructor(private keyword: string) {
        super(keyword)
    }

    override buildCompletionItem(node: tree.Node, indentInfo?: IndentInfo) {
        let deleteNode = node
        let exprText = node.text

        if (py.isParenthesizedExpression(node) && node.firstNamedChild && py.isBinaryExpression(node.firstNamedChild)) {
            deleteNode = node
            exprText = py.unwindBinaryExpression(node, true).text
        } else if (py.inBinaryExpression(node)) {
            const top = py.unwindBinaryExpression(node, true)
            deleteNode = top
            exprText = top.text
        }

        return CompletionItemBuilder
            .create(this.keyword, deleteNode, indentInfo)
            .description('Python built-in functions')
            .replace(`${this.keyword}(${exprText})$0`)
            .build()
    }

    override canUse(node: tree.Node) {
        return !py.inTypeNode(node)
            && (py.isIdentifier(node)
                || py.isExpression(node)
                || py.inPrefixUnaryExpression(node)
                || py.inBinaryExpression(node)
                || py.isCallExpression(node)
                || py.isStringLiteral(node))
    }
}

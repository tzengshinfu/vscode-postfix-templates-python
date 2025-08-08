import _ = require("lodash")
import pluralize = require("pluralize")
import * as tree from '../web-tree-sitter'
import * as py from './python'

const MethodCallRegex = /^(get|read|create|retrieve|select|modify|update|use|find)(?<name>[A-Z].+?)?$/
const CleanNameRegex = /((By|With|From).*$)|(Sync$)|.*(?=Items|Lines$)/

const lowerFirst = (name: string) => name && _.lowerFirst(name)

export const inferVarTemplateName = (node: tree.Node): string[] => {
  if (py.isCallExpression(node)) {
    const methodName = getMethodName(node)
    const name = beautifyMethodName(methodName)
    if (!name) {
      return
    }

    return getUniqueVariants(name).map(lowerFirst)
  }
}

export const inferForVarTemplate = (node: tree.Node): string[] => {
  const subjectName = getForExpressionName(node)
  if (!subjectName) {
    return
  }

  const clean = py.isCallExpression(node)
    ? beautifyMethodName(subjectName)
    : subjectName.replace(/^(?:all)?(.+?)(?:List)?$/, "$1")

  return getUniqueVariants(clean)
    .map(pluralize.singular)
    .filter(x => x !== clean)
    .map(lowerFirst)
}

function getUniqueVariants(name?: string) {
  const cleanerVariant = name?.replace(CleanNameRegex, '')
  const uniqueValues = [...new Set([cleanerVariant, name])]

  return uniqueValues.filter(x => x)
}

function beautifyMethodName(name: string) {
  return MethodCallRegex.exec(name)?.groups?.name
}

function getForExpressionName(node: tree.Node) {
  if (py.isIdentifier(node)) {
    return node.text
  } else if (py.isPropertyAccessExpression(node)) {
    return node.lastNamedChild.text
  } else if (py.isCallExpression(node)) {
    return getMethodName(node)
  }
}

function getMethodName(node: tree.Node) {
  // For Python call expressions, the function being called is the first child
  const functionNode = node.firstNamedChild
  if (!functionNode) {
    return
  }

  if (py.isIdentifier(functionNode)) {
    return functionNode.text
  } else if (py.isPropertyAccessExpression(functionNode)) {
    // For method calls like obj.method(), get the method name
    return functionNode.lastNamedChild?.text
  }
}

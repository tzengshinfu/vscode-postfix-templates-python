import _ = require("lodash")
import pluralize = require("pluralize")
import * as tree from '../web-tree-sitter'
import * as py from './python'

const MethodCallRegex = /^(get|read|create|retrieve|select|modify|update|use|find|watch|load|fetch)(?<name>[A-Z].+?)?$/
const CleanNameRegex = /((By|With|From).*$)|(Sync$)|.*(?=Items|Lines$)/

const snakeCase = (name: string) => name && _.snakeCase(name)

let programmingVerbs: string[] | undefined

/* Helper function to remove verb prefix from method/property names */
const removeVerbPrefix = (name: string): string => {
  if (!programmingVerbs) {
    const { programming } = require('verb-corpus')
    programmingVerbs = programming.filter((v: string) => !['last', 'next'].includes(v))
  }
  const lowerName = name.toLowerCase()
  for (const verb of programmingVerbs!) {
    if (lowerName.startsWith(verb)) {
      if (name.length > verb.length && name[verb.length] === '_') {
        return name.slice(verb.length + 1)
      }
      if (name.length > verb.length && name[verb.length] === name[verb.length].toUpperCase() && name[verb.length] !== name[verb.length].toLowerCase()) {
        return name.slice(verb.length)
      }
      if (verb === 'get' && name.length > 3) {
        return name.slice(3)
      }
    }
  }
  return name
}

/* Helper function to get the function name from constructor calls */
const getConstructorName = (node: tree.Node): string | undefined => {
  if (py.isConstructorCall(node)) {
    const functionNode = node.firstNamedChild
    return functionNode?.text
  }
  return undefined
}

/* Helper function to get the method name from method calls */
const getMethodCallName = (node: tree.Node): string | undefined => {
  if (py.isMethodCall(node)) {
    const attributeNode = node.firstNamedChild /* should be 'attribute' */
    return attributeNode?.lastNamedChild?.text
  }
  return undefined
}

/* Helper function to get property name from property access */
const getPropertyName = (node: tree.Node): string | undefined => {
  if (py.isPropertyAccessExpression(node)) {
    return node.lastNamedChild?.text
  }
  return undefined
}

/* Helper function to get the last method name from chained method calls */
const getChainedMethodName = (node: tree.Node): string | undefined => {
  if (py.isChainedMethodCall(node)) {
    const attributeNode = node.firstNamedChild /* should be 'attribute' */
    return attributeNode?.lastNamedChild?.text
  }
  return undefined
}

export const inferVarTemplateName = (node: tree.Node): string[] => {
  let name: string | undefined

  if (py.isConstructorCall(node)) {
    /* 1. Constructor call: function name to lowercase (strip leading get) */
    const constructorName = getConstructorName(node)
    name = constructorName ? removeVerbPrefix(constructorName) : undefined
  } else if (py.isMethodCall(node)) {
    /* 2. Method call: remove 'get' prefix, function name to lowercase */
    const methodName = getMethodCallName(node)
    name = methodName ? removeVerbPrefix(methodName) : undefined
  } else if (py.isPropertyAccessExpression(node)) {
    /* 3. Property access: remove 'get' prefix, property name to lowercase */
    const propertyName = getPropertyName(node)
    name = propertyName ? removeVerbPrefix(propertyName) : undefined
  } else if (py.isChainedMethodCall(node)) {
    /* 4. Chained method call: last function name, remove 'get' prefix, function name to lowercase */
    const chainedMethodName = getChainedMethodName(node)
    name = chainedMethodName ? removeVerbPrefix(chainedMethodName) : undefined
  } else if (py.isCallExpression(node)) {
    /* Fallback: original logic for backward compatibility */
    const methodName = getMethodName(node)
    name = methodName ? removeVerbPrefix(methodName) : undefined
  } else if (py.isIdentifier(node)) {
    /* 5. Simple identifier: use the identifier text directly */
    name = node.text
  }

  if (!name) {
    return ['name']  /* Changed from 'item' to 'name' as fallback */
  }

  return getUniqueVariants(name).map(snakeCase)
}

export const inferForVarTemplate = (node: tree.Node): string[] => {
  let name: string | undefined

  if (py.isConstructorCall(node)) {
    /* 1. Constructor call: function name to lowercase + plural to singular */
    const constructorName = getConstructorName(node)
    name = constructorName
  } else if (py.isMethodCall(node)) {
    /* 2. Method call: remove 'get' prefix, function name to lowercase + plural to singular */
    const methodName = getMethodCallName(node)
    name = methodName ? removeVerbPrefix(methodName) : undefined
  } else if (py.isPropertyAccessExpression(node)) {
    /* 3. Property access: remove 'get' prefix, property name to lowercase + plural to singular */
    const propertyName = getPropertyName(node)
    name = propertyName ? removeVerbPrefix(propertyName) : undefined
  } else if (py.isChainedMethodCall(node)) {
    /* 4. Chained method call: last function name, remove 'get' prefix, function name to lowercase + plural to singular */
    const chainedMethodName = getChainedMethodName(node)
    name = chainedMethodName ? removeVerbPrefix(chainedMethodName) : undefined
  } else {
    /* Fallback: original logic for backward compatibility */
    const subjectName = getForExpressionName(node)
    if (!subjectName) {
      return ['item']
    }

    const clean = py.isCallExpression(node)
      ? beautifyMethodName(subjectName)
      : subjectName.replace(/^(?:all)?(.+?)(?:List)?$/, "$1")

    const base = getUniqueVariants(clean)
      .map(pluralize.singular)
      .filter(x => x && x !== clean)
      .map(snakeCase)

    if (base.length > 0) return base

    // Extra fallback for names like users_list, cookies, order_items, etc.
    let stem = subjectName.replace(/(?:_list|list)$/i, '')
    const parts = stem.split('_').filter(Boolean)
    stem = parts.pop() || stem.replace(/_+$/,'')
    const alt = pluralize.singular(stem)
    return [snakeCase(alt || 'item')]
  }

  if (!name) {
    return ['item']
  }

  /* Apply plural to singular conversion and filtering */
  const cleanVariants = getUniqueVariants(name)
  const result = cleanVariants
    .map(pluralize.singular)
    .filter(x => x && x !== name) /* Filter out the original name if it's the same */
    .map(snakeCase)
  if (result.length > 0) return result
  // Fallbacks for names like users_list, items, etc.
  let base = name.replace(/(?:_list|list)$/i, '')
  const parts = base.split('_')
  if (parts.length > 1 && parts[parts.length - 1].toLowerCase() === 'list') {
    parts.pop()
  }
  base = parts.pop() || base
  const alt = pluralize.singular(base)
  return [snakeCase(alt || 'item')]
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
  /* For Python call expressions, the function being called is the first child */
  const functionNode = node.firstNamedChild
  if (!functionNode) {
    return
  }

  if (py.isIdentifier(functionNode)) {
    return functionNode.text
  } else if (py.isPropertyAccessExpression(functionNode)) {
    /* For method calls like obj.method(), get the method name */
    return functionNode.lastNamedChild?.text
  }
}

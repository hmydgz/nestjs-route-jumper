import * as ts from 'typescript'

export function getIdentifierName(node: ts.Identifier) {
  return node.escapedText as string
}
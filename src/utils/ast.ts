import * as ts from 'typescript'
import * as fs from 'fs';
import { ImportVarInfo } from '../types'
import { ModuleMetadata } from '@nestjs/common'

export namespace Ast {
  export function getAST(filePath: string) {
    if (!fs.existsSync(filePath)) throw new Error('path does not exist')
    return ts.createSourceFile(
      filePath,
      fs.readFileSync(filePath).toString(),
      ts.ScriptTarget.Latest,
    )
  }
  /**
   * 获取标识符名称
   */
  export function getIdentifierName(node: ts.Identifier) {
    return node.escapedText as string
  }

  /**
   * 获取 import 的变量信息
   */
  export function getImportVar(node: ts.ImportDeclaration) {
    const _node = node as ts.ImportDeclaration
    const _path = (_node.moduleSpecifier as ts.StringLiteral).text
    const importVarMap: Record<string, ImportVarInfo> = {}
    if (_node.importClause?.namedBindings) {
      (_node.importClause?.namedBindings as ts.NamedImports).elements.forEach(v => {
        const _name = getIdentifierName(v.name)
        importVarMap[_name] = { isDefault: false, path: _path, name: _name }
      })
    } else if (_node.importClause?.name) {
      const _name = getIdentifierName(_node.importClause.name)
      importVarMap[_name] = { isDefault: true, path: _path }
    }

    return importVarMap
  }

  /**
   * 遍历
   */
  export const traverse = (ast: ts.Node, callback: (node: ts.Node, next: () => any) => any) => {
    const _traverseAST = (node: ts.Node) => {
      ts.forEachChild(node, (_node) => {
        const next = () => _traverseAST(_node)
        callback(_node, next)
      })
    }
    _traverseAST(ast)
  }

  /**
   * 过滤装饰器
   */
  export const filterDecorator = (_nodes: ts.NodeArray<ts.Node>) => {
    const decorators: Record<string, ts.NodeArray<ts.Node>> = {}
    let isDefault = false
    let isExport = false
    _nodes.forEach(v => {
      switch (v.kind) {
        case ts.SyntaxKind.ExportKeyword:
          isExport = true
          break
        case ts.SyntaxKind.DefaultKeyword:
          isDefault = true
          break
        case ts.SyntaxKind.Decorator: {
          const node = v as ts.Decorator
          const decorator = node.expression as ts.CallExpression
          const name = getIdentifierName(decorator.expression as ts.Identifier)
          decorators[name] = decorator.arguments
        } break
      }
    })

    return { decorators, isDefault, isExport }
  }
}

export namespace NestDecorator {
  export const getModuleArgs = (node: ts.Node) => {
    if (node.kind !== ts.SyntaxKind.ObjectLiteralExpression) return undefined
    const obj: { [key in keyof ModuleMetadata]?: ts.ArrayLiteralExpression } = {}
    const _node = node as ts.ObjectLiteralExpression
    _node.properties.forEach(v => {
      if (v.kind === ts.SyntaxKind.PropertyAssignment) {
        const key = Ast.getIdentifierName(v.name as ts.Identifier) as keyof ModuleMetadata
        obj[key] = v.initializer as ts.ArrayLiteralExpression
      }
    })

    return obj
  }

  export const getControllerArgs = () => {

  }
}
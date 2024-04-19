import * as ts from 'typescript'
import * as fs from 'fs';
import { ImportVarInfo, Methods } from '../types'
import { ControllerOptions, ModuleMetadata } from '@nestjs/common'

export namespace AST {
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

  export function getObj(node: ts.ObjectLiteralExpression) {
    const obj: Record<string, ts.Node> = {}
    node.properties.forEach(v => {
      const key = getIdentifierName(v.name as ts.Identifier)
      const value = (v as any).initializer as unknown as ts.Node
      obj[key] = value
    })

    return obj
  }

  export function getStr(node: ts.StringLiteral) {
    return node.text
  }

  /**
   * 获取 import 的变量信息
   */
  export function getImportVar(node: ts.ImportDeclaration) {
    const _node = node as ts.ImportDeclaration
    const _path = (_node.moduleSpecifier as ts.StringLiteral).text
    const importVarMap: Record<string, ImportVarInfo> = {}
    if (_node.importClause?.namedBindings) {
      // 处理 import { ... } from '...'
      if (_node.importClause?.namedBindings.kind === ts.SyntaxKind.NamedImports) {
        (_node.importClause?.namedBindings as ts.NamedImports).elements.forEach(v => {
          const _name = getIdentifierName(v.name)
          importVarMap[_name] = { isDefault: false, path: _path, name: _name }
        })
      // 处理 import * as ... from '...'
      } else if (_node.importClause?.namedBindings.kind === ts.SyntaxKind.NamespaceImport) {
        const _name = getIdentifierName((_node.importClause?.namedBindings as ts.NamespaceImport).name)
        importVarMap[_name] = { isDefault: false, isNamespace: true, path: _path, name: _name }
      }
    // 处理 import ... from '...'
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
    type DecoratorArgs = ts.NodeArray<ts.Expression>

    const decorators: Record<string, DecoratorArgs> = {}
    let isDefault = false
    let isExport = false
    _nodes.forEach(v => {
      switch (v.kind) {
        case ts.SyntaxKind.ExportKeyword: // 关键字
          isExport = true
          break
        case ts.SyntaxKind.DefaultKeyword: // 关键字
          isDefault = true
          break
        case ts.SyntaxKind.Decorator: { // 装饰器
          const node = v as ts.Decorator
          const decorator = node.expression as ts.CallExpression
          const name = getIdentifierName(decorator.expression as ts.Identifier)
          decorators[name] = decorator.arguments
        } break
      }
    })

    return { decorators, isDefault, isExport }
  }

  export const getStringList = (_node: ts.Node) => {
    let _strings: string[] = []
    switch (_node.kind) {
      case ts.SyntaxKind.StringLiteral: { // 字符串
        _strings.push((_node as ts.StringLiteral).text)
      } break
      case ts.SyntaxKind.ArrayLiteralExpression: { // 字符串数组
        (_node as ts.ArrayLiteralExpression).elements.forEach(v => {
          if (v.kind !== ts.SyntaxKind.StringLiteral) return
          _strings.push((v as ts.StringLiteral).text)
        })
      } break
    }

    return _strings
  }
}

export namespace NestDecorator {
  export namespace Module {
    export const getArgs = (node: ts.Node) => {
      if (node.kind !== ts.SyntaxKind.ObjectLiteralExpression) return undefined
      const obj: { [key in keyof ModuleMetadata]?: ts.ArrayLiteralExpression } = {}
      const _node = node as ts.ObjectLiteralExpression
      _node.properties.forEach(v => {
        if (v.kind === ts.SyntaxKind.PropertyAssignment) {
          const key = AST.getIdentifierName(v.name as ts.Identifier) as keyof ModuleMetadata
          obj[key] = v.initializer as ts.ArrayLiteralExpression
        }
      })
      return obj
    }
  }

  export namespace Controller {
    export const getArgs = (_node: ts.NodeArray<ts.Node>) => {
      const obj: ControllerOptions = {
        path: [],
        version: [],
      }

      if (_node.length === 0) {
        obj.path = ['']
      } else {
        switch (_node[0].kind) {
          case ts.SyntaxKind.StringLiteral:
          case ts.SyntaxKind.ArrayLiteralExpression: {
            obj.path = AST.getStringList(_node[0])
          } break
          case ts.SyntaxKind.ObjectLiteralExpression: {
            const node = _node[0] as ts.ObjectLiteralExpression
            node.properties.forEach(v => {
              const key = AST.getIdentifierName(v.name as ts.Identifier)
              if (
                v.kind === ts.SyntaxKind.PropertyAssignment &&
                obj.hasOwnProperty(key) &&
                [ts.SyntaxKind.StringLiteral, ts.SyntaxKind.ArrayLiteralExpression].includes((v as ts.PropertyAssignment).initializer.kind)
              ) {
                const _v = v as ts.PropertyAssignment
                // @ts-ignore
                obj[key] = AST.getStringList(_v.initializer)
              }
            })
          } break
        }
      }

      return obj
    }
  }

  export namespace RequsetMapping {
    export const ReqMethodSet = new Set(['Get', 'Post', 'Put', 'Delete', 'Patch', 'All', 'Options', 'Head', 'Search'])

    export type Mapping = {
      method: Methods,
      path: string[],
      version: string[],
      fn: ts.MethodDeclaration
      fnName: string
      className: string
      line: {
        start: ts.LineAndCharacter,
        end: ts.LineAndCharacter
      }
    }

    export const getMapping = (classNode: ts.ClassDeclaration, ast: ts.SourceFile) => {
      const mappings: Mapping[] = []
      const className = AST.getIdentifierName(classNode.name!) || ''
      classNode.members.forEach(_member => {
        if (_member.kind !== ts.SyntaxKind.MethodDeclaration) return
        const member = _member as ts.MethodDeclaration
        const { decorators } = AST.filterDecorator(member.modifiers!)
        let version: string[] = []
        if (decorators.hasOwnProperty('Version') && decorators['Version'].length) {
          version = AST.getStringList(decorators['Version'][0])
        }
        const line = {
          start: ts.getLineAndCharacterOfPosition(ast, member.name.getStart(ast)),
          end: ts.getLineAndCharacterOfPosition(ast, member.name.getEnd()),
        }
        const _decorators = Object.entries(decorators)
        for (let index = 0; index < _decorators.length; index++) {
          const [key, args] = _decorators[index];
          if (ReqMethodSet.has(key)) {
            mappings.push({
              method: key as Methods,
              path: args.length ? AST.getStringList(args[0]) : [''],
              version,
              fn: member,
              className,
              fnName: AST.getIdentifierName(member.name as ts.Identifier),
              line,
            })
            break
          }
        }
      })

      return mappings
    }
  }
}
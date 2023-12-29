import * as fs from 'fs';
import * as path from 'path';
import { Project } from './index'
import * as ts from 'typescript'
import { getIdentifierName } from '../utils/ast';

type NestModule = {
  path: string
  isDefault: boolean
  name?: string
}

/**
 * Nestjs App
 */
export class NestjsApp {
  mainFile!: string
  entryFile: string;
  sourceRoot: string;
  project: Project;
  versionSet: Set<string> = new Set();
  moduleMap: Map<string, any> = new Map();
  globalPrefix = '';
  entryModule?: NestModule

  constructor({ sourceRoot, entryFile, project }: {
    sourceRoot: string
    entryFile: string
    project: Project
  }) {
    this.entryFile = entryFile
    this.sourceRoot = sourceRoot
    this.project = project
    fs.readdirSync(sourceRoot, { withFileTypes: true }).forEach(v => {
      if (v.name.startsWith(entryFile)) {
        this.mainFile = path.join(sourceRoot, v.name);
        this.parseMain()
      }
    })
  }

  /**
   * 解析入口文件
   */
  parseMain() {
    const ast = ts.createSourceFile(
      this.mainFile,
      fs.readFileSync(this.mainFile).toString(),
      ts.ScriptTarget.Latest,
    )

    const identifiers = (ast as any).identifiers as Map<string, string>

    if (identifiers.has('NestFactory') && identifiers.has('create')) { // 可能存在 NestFactory.create，需要检查
      this.findAppModule(ast)
    }
  }

  /**
   * 查询app使用的模块
   */
  findAppModule(ast: ts.SourceFile) {
    let appModuleName = undefined
    const importVarMap: Record<string, NestModule> = {}
    function traverseAST(node: ts.Node) {
      ts.forEachChild(node, (node) => {
        switch (node.kind) {
          case ts.SyntaxKind.ImportDeclaration: {
            const _node = node as ts.ImportDeclaration
            const _path = (_node.moduleSpecifier as ts.StringLiteral).text
            if (_node.importClause?.namedBindings) {
              (_node.importClause?.namedBindings as ts.NamedImports).elements.forEach(v => {
                const _name = getIdentifierName(v.name)
                importVarMap[_name] = { isDefault: false, path: _path, name: _name }
              })
            } else if (_node.importClause?.name) {
              const _name = getIdentifierName(_node.importClause.name)
              importVarMap[_name] = { isDefault: true, path: _path }
            }
          } break
          case ts.SyntaxKind.CallExpression: { // 找出 NestFactory.create 使用的 Module
            const _node = node as ts.CallExpression
            if (_node.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
              const obj = _node.expression as ts.PropertyAccessExpression
              if (
                (obj.expression as ts.Identifier).escapedText === 'NestFactory' &&
                obj.name.escapedText === 'create' &&
                _node.arguments[0].kind === ts.SyntaxKind.Identifier
              ) {
                appModuleName = getIdentifierName(_node.arguments[0] as ts.Identifier)
              }
            }
          } break
          default:
            traverseAST(node)
            break
        }
      })
    }

    traverseAST(ast)

    const appModule = importVarMap[appModuleName as unknown as string]
    const appModulePath = this.project.pathResolver(this.mainFile, appModule.path)
    if (appModulePath) {
      appModule.path = appModulePath
      this.findModule(appModule)
    }
  }

  findModule(module: NestModule) {
    console.log('findModule', module)
  }
}
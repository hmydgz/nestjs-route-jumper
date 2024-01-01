import * as fs from 'fs';
import * as path from 'path';
import { Project } from './index'
import * as ts from 'typescript'
import { Ast, NestDecorator } from '../utils/ast';
import { ImportVarInfo } from '../types';

/**
 * Nestjs App
 */
export class NestjsApp {
  mainFile!: string
  entryFile: string;
  sourceRoot: string;
  project: Project;
  // /**
  //  * 模块映射
  //  */
  // moduleMap: Map<string, any> = new Map();
  /**
   * 全局前缀
   */
  globalPrefix = '';
  /**
   * 入口模块
   */
  entryModule?: ImportVarInfo
  /**
   * AST映射
   */
  astMap: Map<string, ts.SourceFile> = new Map();
  /**
   * 是否启用版本控制
   */
  enableVersioning = false

  /**
   * 最近获取过的AST对象文件路径
   */
  private _currentASTFilePath = '';

  importVarMap = new Map<string, Record<string, ImportVarInfo>>()

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

    console.log(this)
  }

  /**
   * 解析入口文件
   */
  parseMain() {
    const ast = this.getAST(this.mainFile)

    const identifiers = (ast as any).identifiers as Map<string, string>

    if (identifiers.has('NestFactory') && identifiers.has('create')) { // 可能存在 NestFactory.create，需要检查
      this.findAppModule(ast)
    }
  }

  /**
   * 获取 AST
   */
  getAST(filePath: string) {
    this._currentASTFilePath = filePath
    if (!this.importVarMap.has(filePath)) this.importVarMap.set(filePath, {})
    if (this.astMap.has(filePath)) return this.astMap.get(filePath) as ts.SourceFile
    const ast = Ast.getAST(filePath)
    this.astMap.set(filePath, ast)
    return ast
  }

  /**
   * 保存 import 的变量
   */
  saveImportVar(node: ts.ImportDeclaration, filePath = this._currentASTFilePath) {
    const map = this.importVarMap.get(filePath)
    Object.assign(map!, Ast.getImportVar(node as ts.ImportDeclaration))
  }

  /**
   * 查询 app 使用的模块
   */
  findAppModule(ast: ts.SourceFile) {
    let appModuleName = undefined

    Ast.traverse(ast, (node, next) => {
      switch (node.kind) {
        case ts.SyntaxKind.ImportDeclaration: {
          this.saveImportVar(node as ts.ImportDeclaration)
        } break
        case ts.SyntaxKind.CallExpression: { // 找出 NestFactory.create 使用的 Module
          const _node = node as ts.CallExpression
          if (_node.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
            const obj = _node.expression as ts.PropertyAccessExpression
            const expressionText = obj.getText(ast).replace(/[\n\s]/g, '')
            // 获取 AppModule
            if (expressionText === 'NestFactory.create') {
              if (_node.arguments[0].kind === ts.SyntaxKind.Identifier) {
                appModuleName = Ast.getIdentifierName(_node.arguments[0] as ts.Identifier)
              }
            // 获取公共前缀
            } else if (expressionText.includes('setGlobalPrefix')) {
              let prefix = _node.arguments[0].getText(ast).replace(/(\')|(\")/g, '')
              if (!prefix.startsWith('/')) prefix = '/' + prefix
              if (prefix.endsWith('/')) prefix = prefix.substring(0, prefix.length - 1)
              this.globalPrefix = prefix
            // 开启版本
            } else if (expressionText.includes('enableVersioning')) {
              const args = _node.arguments
              if (args.length === 0 || args[0].getText(ast).replace(/[\n\s]/g, '').includes('VersioningType.URI')) {
                this.enableVersioning = true
              }
            }
          }
        } break
        default:
          next()
          break
      }
    })

    const appModule = this.importVarMap.get(this.mainFile)![appModuleName as unknown as string]
    const appModulePath = this.project.pathResolver(this.mainFile, appModule.path)
    if (appModulePath) {
      appModule.path = appModulePath
      this.entryModule = appModule
      this.findModule(this.entryModule)
    }
  }

  findModule(_module: ImportVarInfo) {
    const ast = this.getAST(_module.path)
    Ast.traverse(ast, (node, next) => {
      switch (node.kind) {
        case ts.SyntaxKind.ImportDeclaration:
          this.saveImportVar(node as ts.ImportDeclaration)
          break
        case ts.SyntaxKind.ClassDeclaration: {
          const classNode = node as ts.ClassDeclaration
          const name = Ast.getIdentifierName(classNode.name as ts.Identifier)
          const { isDefault, isExport, decorators } = Ast.filterDecorator(classNode.modifiers!)
          if (!isExport || _module.isDefault !== isDefault || _module.name !== name) return
          if ('Module' in decorators) {
            const res = NestDecorator.getModuleArgs(decorators.Module[0])
            console.log(res)
          }
        } break
        default:
          next()
          break
      }
    })
  }

  findController() {

  }
}
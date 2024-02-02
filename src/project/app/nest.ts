import * as fs from 'fs';
import * as path from 'path';
import { Project } from '../index'
import * as ts from 'typescript'
import { AST, NestDecorator } from '../../utils/ast';
import { ImportVarInfo } from '../../types';
import { ControllerOptions } from '@nestjs/common';
import { joinPath } from '../../utils';

type FilePath = string
type ModuleName = string

export namespace Nest {
  export type Controller = Omit<ControllerOptions, 'version'> & {
    version?: string[]
    path?: string[]
    mappings: NestDecorator.RequsetMapping.Mapping[]
    filePath: string
  }

  export type Module = {
    prefixPath: string
    importModules: Module[]
    controllers: Controller[],
    name: string
  }

  export type AppPath = (Omit<NestDecorator.RequsetMapping.Mapping, 'path' | 'version'> & {
    version?: string
    path: string
    filePath: string
  })

  /**
   * Nestjs App
   */
  export class App {
    mainFile!: string
    entryFile: string;
    sourceRoot: string;
    project: Project;
    /**
     * 模块映射
     */
    moduleMap: Map<FilePath, Record<ModuleName, Module>> = new Map();
    /**
     * 全局前缀
     */
    globalPrefix = '';
    /**
     * 入口模块
     */
    entryModule?: Module
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

    importVarMap = new Map<FilePath, Record<ModuleName, ImportVarInfo>>()

    /**
     * Controller 映射
     */
    controllerMap = new Map<FilePath, Record<ModuleName, Controller>>()

    /**
     * 访问集合
     */
    paths?: AppPath[]
    /**
     * 访问映射
     */
    pathMap = new Map<string, AppPath[]>()

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
      const ast = AST.getAST(filePath)
      this.astMap.set(filePath, ast)
      return ast
    }

    /**
     * 保存 import 的变量
     */
    saveImportVar(node: ts.ImportDeclaration, filePath = this._currentASTFilePath) {
      const map = this.importVarMap.get(filePath)
      Object.assign(map!, AST.getImportVar(node as ts.ImportDeclaration))
    }

    /**
     * 查询 app 使用的模块
     */
    findAppModule(ast: ts.SourceFile) {
      let appModuleName = undefined

      AST.traverse(ast, (node, next) => {
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
                if (_node.arguments.length && _node.arguments[0].kind === ts.SyntaxKind.Identifier) {
                  appModuleName = AST.getIdentifierName(_node.arguments[0] as ts.Identifier)
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
        this.entryModule = this.findModule(appModule)
        this.buildPathTree()
      }
    }

    findModule(_moduleInfo: ImportVarInfo, _prefix?: string) {
      if (this.moduleMap.has(_moduleInfo.path)) {
        const cache = this.moduleMap.get(_moduleInfo.path)?.[_moduleInfo.name || 'DefaultExportModule'] as Module
        if (cache) return cache
      }

      const ast = this.getAST(_moduleInfo.path)
      const _importModules: ImportVarInfo[] = []
      const _controllers: ImportVarInfo[] = []
      const module: Module = {
        prefixPath: _prefix ?? '',
        importModules: [],
        controllers: [],
        name: _moduleInfo.name || 'DefaultExportModule',
      }

      const importVarMap = this.importVarMap.get(_moduleInfo.path)!
      const findImportVar = (elements: ts.NodeArray<ts.Expression>, list: ImportVarInfo[]) => {
        elements?.forEach(v => {
          const name = AST.getIdentifierName(v as ts.Identifier)
          if (importVarMap[name]) {
            const _path = this.project.pathResolver(_moduleInfo.path, importVarMap[name].path)
            _path && list.push(Object.assign({}, importVarMap[name], { path: _path }))
          }
        })
      }

      AST.traverse(ast, (node, next) => {
        switch (node.kind) {
          case ts.SyntaxKind.ImportDeclaration:
            this.saveImportVar(node as ts.ImportDeclaration)
            break
          case ts.SyntaxKind.ClassDeclaration: {
            const classNode = node as ts.ClassDeclaration
            const name = AST.getIdentifierName(classNode.name as ts.Identifier)
            const { isDefault, isExport, decorators } = AST.filterDecorator(classNode.modifiers!)
            if (!isExport || _moduleInfo.isDefault !== isDefault || (!_moduleInfo.isDefault && _moduleInfo.name !== name)) return
            if ('Module' in decorators) {
              const args = NestDecorator.Module.getArgs(decorators.Module[0])
              findImportVar(args?.imports?.elements!, _importModules)
              findImportVar(args?.controllers?.elements!, _controllers)
            }
          } break
          default:
            next()
            break
        }
      })

      _importModules.forEach(v => module.importModules.push(this.findModule(v)))
      _controllers.forEach(v => module.controllers.push(this.findController(v)))

      if (!this.moduleMap.has(_moduleInfo.path)) this.moduleMap.set(_moduleInfo.path, {})
      this.moduleMap.get(_moduleInfo.path)![_moduleInfo.name || 'DefaultExportModule'] = module

      return module
    }

    findController(_moduleInfo: ImportVarInfo) {
      if (this.controllerMap.has(_moduleInfo.path)) {
        const cache = this.controllerMap.get(_moduleInfo.path)?.[_moduleInfo.name || 'DefaultExportModule'] as Controller
        if (cache) return cache
      }

      const ast = this.getAST(_moduleInfo.path)
      const controller: Controller = { mappings: [], filePath: _moduleInfo.path }

      AST.traverse(ast, (node, next) => {
        switch (node.kind) {
          case ts.SyntaxKind.ImportDeclaration:
            this.saveImportVar(node as ts.ImportDeclaration)
            break
          case ts.SyntaxKind.ClassDeclaration: {
            const classNode = node as ts.ClassDeclaration
            const name = AST.getIdentifierName(classNode.name as ts.Identifier)
            const { isDefault, isExport, decorators } = AST.filterDecorator(classNode.modifiers!)
            if (!isExport || _moduleInfo.isDefault !== isDefault || (!_moduleInfo.isDefault && _moduleInfo.name !== name)) return
            // 找到指定 Controller
            if (decorators.hasOwnProperty('Controller')) {
              const options = NestDecorator.Controller.getArgs(decorators.Controller)
              Object.assign(controller, options)
              controller.mappings = NestDecorator.RequsetMapping.getMapping(classNode, ast)
            }
          } break
          default:
            next()
            break
        }
      })

      if (!this.controllerMap.has(_moduleInfo.path)) this.controllerMap.set(_moduleInfo.path, {})
      this.controllerMap.get(_moduleInfo.path)![_moduleInfo.name || 'DefaultExportModule'] = controller

      return controller
    }

    buildPathTree() {
      if (!this.entryModule) return
      const paths: ReturnType<typeof App.prototype.getControllerPath> = []
      const pathSet = new Set<string>()

      const traverse = (_module: Module) => {
        _module.controllers.forEach(v => {
          const _paths = this.getControllerPath(v)
          _paths.forEach(v => {
            const key = `${v.filePath}-${v.path}-${v.fnName}-${v.method}-${v.version}`
            if (pathSet.has(key)) return
            pathSet.add(key)
            let prefix = this.globalPrefix || ''
            if (this.enableVersioning && v.version) prefix += `/v${v.version}`
            if (prefix) v.path = prefix + v.path
            if (!this.pathMap.has(v.path)) this.pathMap.set(v.path, [])
            this.pathMap.get(v.path)?.push(v)
            paths.push(v)
          })
        })

        _module.importModules.forEach(v => traverse(v))
      }

      traverse(this.entryModule)
      this.paths = paths
    }

    getControllerPath(_controller: Controller, _prefix = '') {
      const paths: AppPath[] = []
      _controller.path?.forEach(v => {
        const prefix = joinPath(_prefix, v)
        _controller.mappings.forEach(mapping => {
          mapping.path.forEach(path => {
            let _path = joinPath(prefix, path)
            if (!_path.endsWith('/')) _path += '/'
            const { version, ...rest } = mapping
            const _versions = [...new Set([...version, ...(_controller.version ?? [])])]
            if (!_versions.length) _versions.push('')
            _versions.forEach(_version => {
              paths.push({
                ...rest,
                version: _version,
                path: _path,
                filePath: _controller.filePath
              })
            })
          })
        })
      })

      return paths
    }
  }
}
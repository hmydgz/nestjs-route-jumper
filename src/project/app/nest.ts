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

/**
 * 默认导出
 */
const DEFAULT_KEY = '__DEFAULT__'
/**
 * 匿名变量
 */
const ANONYMOUS_KEY = '__ANONYMOUS__'

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
        // 读缓存时需要修改前缀，所以需要创建新对象
        if (cache) return { ...cache, prefixPath: _prefix ?? '' }
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
          switch (v.kind) {
            case ts.SyntaxKind.Identifier: {
              const name = AST.getIdentifierName(v as ts.Identifier)
              if (importVarMap[name]) {
                const _path = this.project.pathResolver(_moduleInfo.path, importVarMap[name].path)
                _path && list.push(Object.assign({}, importVarMap[name], { path: _path }))
              }
            } break
            case ts.SyntaxKind.CallExpression: {
              const node = v as ts.CallExpression
              if (node.expression.getText(ast).replace(/(\')|(\")/g, '') === 'RouterModule.register') {
                const RouterModule = importVarMap.RouterModule
                if (!RouterModule.isDefault && RouterModule.path === '@nestjs/core') {
                  node.arguments.length === 1 && traverseRouters(node.arguments[0], _prefix ?? '')
                }
              }
            } break
          }
        })
      }

      const routerModules = <ImportVarInfo[]>[]

      const traverseRouters = (routeNode: ts.Node, __prefix: string) => {
        if (routeNode.kind === ts.SyntaxKind.ArrayLiteralExpression) {
          const arr = routeNode as ts.ArrayLiteralExpression
          arr.elements.forEach(_node => {
            if (_node.kind === ts.SyntaxKind.ObjectLiteralExpression) {
              const obj = AST.getObj(_node as ts.ObjectLiteralExpression)
              const _path = obj?.path.kind === ts.SyntaxKind.StringLiteral ? AST.getStr(obj.path as ts.StringLiteral) : ''
              const prefix = _path ? joinPath(__prefix, _path) : __prefix
              if (obj?.module?.kind === ts.SyntaxKind.Identifier) {
                const name = AST.getIdentifierName(obj.module as ts.Identifier)
                const _module = importVarMap[name]
                if (_module) {
                  const _filePath = this.project.pathResolver(_moduleInfo.path, _module.path)
                  module.importModules.push(this.findModule(Object.assign({}, _module, { path: _filePath }), prefix))
                  routerModules.push(_module)
                }
              } else if (obj.children) {
                traverseRouters(obj.children, _path ? joinPath(__prefix, _path) : __prefix)
              }
            } else if (_node.kind === ts.SyntaxKind.Identifier) {
              const name = AST.getIdentifierName(_node as ts.Identifier)
              const _module = importVarMap[name]
              if (_module) {
                const _filePath = this.project.pathResolver(_moduleInfo.path, _module.path)
                module.importModules.push(this.findModule(Object.assign({}, _module, { path: _filePath }), __prefix))
                routerModules.push(_module)
              }
            }
          })
        }
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

      _importModules // 过滤使用路由模块进行注册的模块
        .filter(v => routerModules.every(_v => (v.name ?? '') !== (_v.name ?? '')))
        .forEach(v => module.importModules.push(this.findModule(v)))
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

      const extendsClassNameMap: Map<string, string> = new Map()
      const importVarMap = this.importVarMap.get(_moduleInfo.path)!
      const classMap = new Map<string, ts.Node>()

      const handleClassDeclaration = (node: ts.Node) => {
        const classNode = node as ts.ClassDeclaration
        // 可能是匿名类
        const name = classNode.name ? AST.getIdentifierName(classNode.name as ts.Identifier) : ANONYMOUS_KEY
        const { isDefault, isExport, decorators } = AST.filterDecorator(classNode.modifiers!)
        classMap.set(isDefault ? DEFAULT_KEY : name, node)
        // 仅目标类需要继续读取信息
        if (!isExport || _moduleInfo.isDefault !== isDefault || (!_moduleInfo.isDefault && _moduleInfo.name !== name)) return
        // 有 Controller 装饰器
        if (decorators.hasOwnProperty('Controller')) {
          const options = NestDecorator.Controller.getArgs(decorators.Controller)
          Object.assign(controller, options)
          controller.mappings.push(...NestDecorator.RequsetMapping.getMapping(classNode, ast, _moduleInfo.path))
        }

        // 继承的类，子类不管有没有 Controller 装饰器都需要加上继承的 Mapping
        classNode.heritageClauses?.forEach(v => {
          // TODO: 类只有单继承，可以链式继承(之后再实现链式继承)
          extendsClassNameMap.set(name, AST.getIdentifierName(v.types[0].expression as ts.Identifier))
        })
      }

      AST.traverse(ast, (node, next) => {
        switch (node.kind) {
          case ts.SyntaxKind.ImportDeclaration:
            this.saveImportVar(node as ts.ImportDeclaration)
            break
          case ts.SyntaxKind.ClassDeclaration: { // 类声明
            handleClassDeclaration(node)
          } break
          default:
            next()
            break
        }
      })

      if (extendsClassNameMap.size) { // 处理继承
        const className = _moduleInfo.isDefault ? DEFAULT_KEY : _moduleInfo.name!
        // 从入参的目标类上开始找父类
        const parentName = extendsClassNameMap.get(className)!
        if (classMap.has(parentName)) { // 在当前文件中
          const parentClassNode = classMap.get(parentName) as ts.ClassDeclaration
          const { decorators } = AST.filterDecorator(parentClassNode.modifiers!)
          if (decorators.hasOwnProperty('Controller')) { // 父类是 Controller
            const options = NestDecorator.Controller.getArgs(decorators.Controller)
            if (!controller.path && options.path) {
              controller.path = Array.isArray(options.path) ? options.path : [options.path]
            }
            controller.mappings.push(...NestDecorator.RequsetMapping.getMapping(parentClassNode, ast, _moduleInfo.path))
            controller.mappings = NestDecorator.RequsetMapping.mergeMapping(
              controller.mappings,
              NestDecorator.RequsetMapping.getMapping(
                classMap.get(className)! as ts.ClassDeclaration,
                ast,
                _moduleInfo.path
              )
            )
          } else { // TODO 父类不是 Controller，需要看整个继承链，先不管

          }
        } else if (importVarMap[parentName]) { // TODO 从其他地方导入的

        }
      }

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
          const _paths = this.getControllerPath(v, _module.prefixPath)
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
            const { version, filePath, ...rest } = mapping
            const _versions = [...new Set([...version, ...(_controller.version ?? [])])]
            if (!_versions.length) _versions.push('')
            _versions.forEach(_version => {
              paths.push({
                ...rest,
                version: _version,
                path: _path,
                filePath: filePath || _controller.filePath,
              })
            })
          })
        })
      })

      return paths
    }
  }
}
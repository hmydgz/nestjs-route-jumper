import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { NestCliConfig, ProjectType } from '../types';
import { Nest } from './app';
import * as ts from 'typescript'
import { createMatchPath, MatchPath } from 'tsconfig-paths'
import { getIndexFilePath } from '../utils';

// 忽略的目录
const ignoreDirs = ['node_modules', '.git', '.github', '.vscode', '.idea']
const ignoreDirsReg = new RegExp(ignoreDirs.map(v => `(${v})`).join('|'), 'g')

/**
 * 项目分析
 */
export class ProjectAnalysis {
  projectMap: Map<string, Project> = new Map();

  constructor() {
    vscode.workspace.workspaceFolders?.forEach((workspace) => {
      this.scanProject(workspace.uri.fsPath)
    });
  }

  async scanProject(filePath: string) {
    const dirs: string[] = []
    const links = await fs.promises.readdir(filePath, { withFileTypes: true })
    links.forEach(link => {
      const _path = path.join(filePath, link.name)
      if (link.isDirectory() && !(ignoreDirsReg.test(_path))) {
        dirs.push(_path)
      } else if (link.name === 'package.json') {
        this.projectMap.set(filePath, new Project(filePath))
      }
    })

    await Promise.all(dirs.map(dir => this.scanProject(dir)))
  }
}

/**
 * 项目
 */
export class Project {
  projectType: ProjectType = ProjectType.UNKNOW
  appMap: Map<string, Nest.App> = new Map()
  private dependencies = new Set<string>()

  /**
   * 别名路径缓存
   */
  private cacheAliasPathMap = new Map<string, string>()
  private _pathResolver!: MatchPath

  constructor(public dirPath: string) {
    this.initPathResolve()
    this.getProjectType()
    this.scanApp()
    this.updateDependencies()
  }

  private initPathResolve() {
    // 获取 tsconfig.json 的路径
    const tsconfigPath = ts.findConfigFile(this.dirPath, ts.sys.fileExists)
    let basePath = this.dirPath
    let paths = {}
    if (tsconfigPath) {
      const { config } = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
      basePath = path.resolve(this.dirPath, config.compilerOptions.baseUrl || '.')
      paths = config.compilerOptions.paths ?? {}
    }
    this._pathResolver = createMatchPath(basePath, paths)
  }

  updateDependencies() {
    const _package = JSON.parse(fs.readFileSync(path.join(this.dirPath, 'package.json'), 'utf-8'))
    Object.keys(Object.assign({}, _package.dependencies, _package.devDependencies)).forEach(v => {
      this.dependencies.add(v)
    })
  }

  pathResolver(filePath: string, _path: string) {
    const hasSuffix = _path.endsWith('.ts')
    // 判断是否是 npm 包路径
    let subPath = ''
    for (const v of _path.split('/')) {
      subPath ? (subPath += '/' + v) : (subPath = v)
      // 是 npm 包就直接返回 undefined
      if (this.dependencies.has(subPath)) return undefined
    }

    // 判断是否是相对路径
    const dirPath = path.resolve(filePath, '../')
    const relativePaths = [ // 假设是相对路径
      path.resolve(dirPath, _path),
      dirPath + _path,
    ]
    relativePaths.push(...(hasSuffix ? [] : relativePaths.map(v => v + '.ts')))
    for (const v of relativePaths) {
      if (fs.existsSync(v)) {
        const _filePath = getIndexFilePath(v)
        if (_filePath) return _filePath
      }
    }

    // 检查别名路径缓存
    if (this.cacheAliasPathMap.has(_path)) return this.cacheAliasPathMap.get(_path)
    // 判断是否是别名路径
    const possiblePaths = [_path]
    if (!hasSuffix) possiblePaths.push(_path + '.ts')
    for (const v of possiblePaths) {
      const value = this._pathResolver(v)
      if (value && fs.existsSync(value) && fs.lstatSync(value).isFile()) {
        this.cacheAliasPathMap.set(_path, value)
        return value
      }
    }

    return undefined
  }

  getProjectType() {
    // 留点扩展空间，方便以后支持其他类型的项目
    const nestCliPath = path.join(this.dirPath, 'nest-cli.json')
    if (fs.existsSync(nestCliPath)) {
      this.projectType = ProjectType.NESTJS
    }
  }

  scanApp() {
    switch (this.projectType) {
      case ProjectType.NESTJS:
        this.scanNestjsApp()
        break
    }
  }

  scanNestjsApp() {
    const configPath = path.join(this.dirPath, 'nest-cli.json')
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as NestCliConfig.Coordinate
    config.projects && Object.entries(config.projects).forEach(([appName, project]) => {
      if (!project.sourceRoot) return
      this.appMap.set(appName, new Nest.App({
        sourceRoot: path.resolve(configPath, '../', project.sourceRoot),
        entryFile: project.entryFile as string,
        project: this
      }))
    })

    if (!config.monorepo) {
      this.appMap.set('main', new Nest.App({
        sourceRoot: path.resolve(configPath, '../', config.sourceRoot || 'src'),
        entryFile: config.entryFile ||'main',
        project: this
      }))
    }
  }
}
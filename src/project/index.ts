import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { EventType, NestCliConfig, ProjectType, ReqMsgJumpToMethod, RequestMessage, Res } from '../types';
import { Nest } from './app/nest';
import * as ts from 'typescript'
import { createMatchPath, MatchPath } from 'tsconfig-paths'
import { debounce, getIndexFilePath } from '../utils';
import { postMessage } from '../utils/postMessage';

// 忽略的目录
const ignoreDirs = ['node_modules', '.git', '.github', '.vscode', '.idea', 'dist']
const ignoreDirsSet = new Set([...ignoreDirs])
const ignoreDirsReg = new RegExp(`(${ignoreDirs.join('|')})`, 'g')

/**
 * 项目分析
 */
export class ProjectAnalysis {
  projectMap: Map<string, Project> = new Map();

  constructor() {
    ;(async() => {
      postMessage({ type: EventType.START_SCAN_PROJECT })
      await Promise.all((vscode.workspace.workspaceFolders ?? []).map((workspace) => this.scanProject(workspace.uri.fsPath)))
      postMessage({ type: EventType.WEIVIEW_REFRESH })
    })()
  }

  async scanProject(filePath: string) {
    const dirs: string[] = []
    const links = await fs.promises.readdir(filePath, { withFileTypes: true })
    links.forEach(link => {
      if (ignoreDirsSet.has(link.name)) return
      const _path = path.join(filePath, link.name)
      const __path = _path.split(path.sep).join('/')
      if (link.isDirectory() && !(ignoreDirsReg.test(__path))) {
        dirs.push(_path)
      } else if (link.name === 'package.json') {
        this.projectMap.set(filePath, new Project(filePath))
      }
    })

    await Promise.all(dirs.map(dir => this.scanProject(dir)))
  }

  async onMessage(e: RequestMessage) {
    let res: any = null
    try {
      switch (e.type) {
        case EventType.JUMP_TO_METHOD:
          res = await this.handleJumperToMethod(e)
          break
        case EventType.GET_BASE_PATH:
          res = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
          break
        case EventType.GET_PROJECTS:
          res = this.handleGetProject()
          break
      }
    } catch (error) {}
    postMessage({ ...e, data: res ?? 0 })
  }

  handleGetProject() {
    const projects: Res.Project[] = []
    this.projectMap.forEach((v, key) => {
      const _projects: Res.Project = {
        dirPath: key,
        type: v.projectType,
        apps: [],
      }
      v.appMap.forEach((v, appName) => {
        _projects.apps.push({
          name: appName,
          path: v.entryFile,
          mappings: v.paths?.length ? (v.paths).map(({ fn, ...rest }) => rest) : []
        })
      })
      projects.push(_projects)
    })
    return projects
  }

  async handleJumperToMethod(e: ReqMsgJumpToMethod) {
    const { data: { filePath, line } } = e
    const uri = vscode.Uri.file(filePath)
    const doc = await vscode.workspace.openTextDocument(uri)
    await vscode.window.showTextDocument(doc, {
      selection: new vscode.Range(
        line.start.line,
        line.start.character,
        line.end.line,
        line.end.character
      )
    })
  }
}

/**
 * 项目
 */
export class Project {
  projectType: ProjectType = ProjectType.UNKNOW
  appMap: Map<string, Nest.App> = new Map()
  private dependencies = new Set<string>()
  private appConfig = new Map<string, any>()
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
    this.watchSaveFile()
  }

  private watchSaveFile() {
    vscode.workspace.onDidSaveTextDocument((e: vscode.TextDocument) => {
      for (const [appName, app] of this.appMap) {
        if (app.astMap.has(e.fileName)) {
          this.updateApp(appName)
          return
        }
      }
    })
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

    const createApp = (appName: string, sourceRoot: string, entryFile: string) => {
      this.appConfig.set(appName, {
        sourceRoot: sourceRoot,
        entryFile: entryFile,
        project: this
      })
      this.appMap.set(appName, new Nest.App(this.appConfig.get(appName)))
    }

    config.projects && Object.entries(config.projects).forEach(([appName, project]) => {
      if (!project.sourceRoot) return
      createApp(
        appName,
        path.resolve(configPath, '../', project.sourceRoot),
        project.entryFile as string
      )
    })

    if (!config.monorepo) {
      createApp(
        'main',
        path.resolve(configPath, '../', config.sourceRoot || 'src'),
        config.entryFile || 'main'
      )
    }
  }

  private _updateAppTimerMap = new Map<string, () => void>()
  private updateApp(appName: string) {
    console.log('updateApp', appName);

    if (!this._updateAppTimerMap.has(appName)) {
      this._updateAppTimerMap.set(appName, debounce(() => {
        switch (this.projectType) {
          case ProjectType.NESTJS: {
            const config = this.appConfig.get(appName)
            if (config) {
              this.appMap.set(appName, new Nest.App(config))
              postMessage({ type: EventType.WEIVIEW_REFRESH })
            }
          } break
        }
      }, 500))
    }

    this._updateAppTimerMap.get(appName)?.()
  }
}
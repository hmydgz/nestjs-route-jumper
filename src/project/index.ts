import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { NestCliConfig, ProjectType } from '../types';
import { NestjsApp } from './app';

/**
 * 项目分析
 */
export class ProjectAnalysis {
  hasNestjsProject: boolean = false;
  projectMap: Map<string, any> = new Map();

  constructor() {
    vscode.workspace.workspaceFolders?.forEach(async (workspace) => {
      await this.scanProject(workspace.uri.fsPath);
      console.log(this.projectMap)
    });
  }

  async scanProject(filePath: string) {
    const dirs: string[] = []
    const links = await fs.promises.readdir(filePath, { withFileTypes: true })
    links.forEach(link => {
      const _path = path.join(filePath, link.name)
      if (link.isDirectory() && !(/(node_modules)|(.git)/g.test(_path))) {
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
  appMap: Map<string, NestjsApp> = new Map()

  constructor(public dirPath: string) {
    this.getProjectType()
  }

  getProjectType() {
    const nestCliPath = path.join(this.dirPath, 'nest-cli.json')
    if (fs.existsSync(nestCliPath)) {
      this.projectType = ProjectType.NESTJS
      this.scanNestjsApp(nestCliPath)
    } else {
      this.projectType = ProjectType.UNKNOW
    }
  }

  scanNestjsApp(configPath: string) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as NestCliConfig.Coordinate
    config.projects && Object.entries(config.projects).forEach(([appName, project]) => {
      if (!project.sourceRoot) return
      this.appMap.set(appName, new NestjsApp(path.resolve(configPath, '../', project.sourceRoot), project.entryFile as string))
    })

    if (!config.monorepo) {
      this.appMap.set('main', new NestjsApp(path.resolve(configPath, '../', config.sourceRoot || 'src'), config.entryFile || 'main'))
    }
  }
}
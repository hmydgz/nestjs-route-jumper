import * as fs from 'fs';
import * as path from 'path';
import { Project } from './index'

// type DependencyTree = any

/**
 * Nestjs App
 */
export class NestjsApp {
  mainFile?: string
  entryFile: string;
  sourceRoot: string;
  project: Project;

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
      }
    })
  }
}
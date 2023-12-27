import * as fs from 'fs';
import * as path from 'path';
import { Project } from './index'
import * as ts from 'typescript'

/**
 * Nestjs App
 */
export class NestjsApp {
  mainFile!: string
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
        this.parseMain()
      }
    })
  }

  parseMain() {
    const ast = ts.createSourceFile(
      this.mainFile,
      fs.readFileSync(this.mainFile).toString(),
      ts.ScriptTarget.Latest,
    )

    // ts.forEachChild(ast, (node) => {
    //   console.log(`Node: ${ts.SyntaxKind[node.kind]}`, node);
    // });

    const identifiers = (ast as any).identifiers as Map<string, string>

    if (identifiers.has('NestFactory') && identifiers.has('create')) { // 可能存在 NestFactory.create，需要检查
      console.log(this.mainFile, identifiers)
    }
  }
}
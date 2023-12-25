import * as fs from 'fs';
import * as path from 'path';

// type DependencyTree = any

/**
 * Nestjs App
 */
export class NestjsApp {
  // dependencyTree: DependencyTree;
  mainFile?: string;

  constructor(
    public sourceRoot: string,
    public entryFile: string,
  ) {
    fs.readdirSync(sourceRoot, { withFileTypes: true }).forEach(v => {
      if (v.name.startsWith(entryFile)) {
        this.mainFile = path.join(sourceRoot, v.name);
      }
    })
  }
}
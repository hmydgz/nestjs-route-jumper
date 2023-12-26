export type RequestMessage = any;

export enum ProjectType {
  UNKNOW = 'UNKNOW',
  NESTJS = 'NESTJS',
}

/**
 * nest-cli.json json schema 生成的类型
 */
export namespace NestCliConfig {
  export interface Coordinate {
    /**
     * Points at the collection of schematics used to generate components. you generally should
     * not change this value.
     */
    collection?: string;
    compilerOptions?: CompilerOptions;
    /**
     * The entry file where 'nest start' work with. Default to 'main'.
     */
    entryFile?: string;
    generateOptions?: GenerateOptions;
    language?: string;
    /**
     * (monorepo only) For a monorepo mode structure, this value is always true.
     */
    monorepo?: boolean;
    projects?: { [key: string]: ProjectConfiguration };
    /**
     * (monorepo only) Points at the project root of the default project.
     */
    root?: string;
    /**
     * Points at the root of the source code for the single project in standard mode structures,
     * or the default project in monorepo mode structures.
     */
    sourceRoot?: string;
    [property: string]: any;
  }

  /**
   * A map with keys specifying compiler options and values specifying the option setting. See
   * https://docs.nestjs.com/cli/monorepo#global-compiler-options for details
   */
  export interface CompilerOptions {
    /**
     * Enables automatically distributing non-TypeScript assets whenever a compilation step
     * begins (asset distribution does not happen on incremental compiles in --watch mode).
     * Accept glob-like string and object. See https://docs.nestjs.com/cli/monorepo#assets for
     * details.
     */
    assets?: Array<AssetsOptionsClass | string>;
    builder?: Type | BuilderObject;
    /**
     * If true, whenever the compiler is invoked, it will first remove the compilation output
     * directory (as configured in tsconfig.json, where the default is ./dist).
     */
    deleteOutDir?: boolean;
    /**
     * If true, enables the shortcut `rs` to manually restart the server.
     */
    manualRestart?: boolean;
    plugins?: Array<PluginItemsObject | string>;
    /**
     * (monorepo only) Points at the file containing the tsconfig.json settings that will be
     * used when nest build or nest start is called without a project option (e.g., when the
     * default project is built or started). 'nest build' will not work as expected without this
     * file.
     */
    tsConfigPath?: string;
    /**
     * If true, enable type checking (when SWC is used). See
     * https://docs.nestjs.com/recipes/swc#type-checking for details.
     */
    typeCheck?: boolean;
    /**
     * If true, run in watch-mode, watching all non-TypeScript assets. Setting watchAssets in a
     * top-level compilerOptions property overrides any watchAssets settings within the assets
     * property.
     */
    watchAssets?: boolean;
    /**
     * If true, use webpack compiler (deprecated option, use `builder` instead). If false or not
     * present, use tsc. In monorepo mode, the default is true (use webpack), in standard mode,
     * the default is false (use tsc). See https://docs.nestjs.com/cli/monorepo#cli-properties
     * for details.
     */
    webpack?: boolean;
    /**
     * Points at a webpack options file. If not specified, Nest looks for the file
     * webpack.config.js.
     */
    webpackConfigPath?: string;
  }

  export interface AssetsOptionsClass {
    /**
     * Glob-like file specifications for the assets to be excluded from the include list.
     */
    exclude?: string;
    /**
     * Glob-like file specifications for the assets to be distributed.
     */
    include?: string;
    /**
     * A string specifying the path (relative to the root folder) where the assets should be
     * distributed. Defaults to the same output directory configured for compiler output.
     */
    outDir?: string;
    /**
     * If true, run in watch mode watching specified assets. Setting watchAssets in a top-level
     * compilerOptions property overrides any watchAssets settings within the assets property.
     */
    watchAssets?: boolean;
  }

  /**
   * Builder to be used (tsc, webpack, swc). For details on how to configure `SWC` see
   * https://docs.nestjs.com/recipes/swc#getting-started
   */
  export enum Type {
    Swc = "swc",
    Tsc = "tsc",
    Webpack = "webpack",
  }

  export interface BuilderObject {
    options?: Options;
    /**
     * Builder to be used (tsc, webpack, swc). For details on how to configure `SWC` see
     * https://docs.nestjs.com/recipes/swc#getting-started
     */
    type?: Type;
    [property: string]: any;
  }

  export interface Options {
    /**
     * Whether to copy files or not.
     */
    copyFiles?: boolean;
    /**
     * Array of file extensions to be considered.
     */
    extensions?: string[];
    /**
     * Array of filenames to be included.
     */
    filenames?: string[];
    /**
     * Whether to include dotfiles or not.
     */
    includeDotfiles?: boolean;
    /**
     * The directory to output files.
     */
    outDir?: string;
    /**
     * Whether to suppress logs or not.
     */
    quiet?: boolean;
    /**
     * Whether to synchronize files or not.
     */
    sync?: boolean;
    /**
     * Whether to watch files for changes or not.
     */
    watch?: boolean;
    [property: string]: any;
  }

  export interface PluginItemsObject {
    /**
     * The npm package name of the cli plugin, eg @nestjs/swagger.
     */
    name?: string;
    options?: PluginOptions;
    [property: string]: any;
  }

  export interface PluginOptions {
    /**
     * If set to true, plugin will generate descriptions and example values for properties based
     * on comments.
     */
    introspectComments?: boolean;
    /**
     * (GraphQL Only) GraphQL types files suffix. Default value: ['.input.ts', '.args.ts',
     * '.entity.ts', '.model.ts']. See
     * https://docs.nestjs.com/graphql/cli-plugin#using-the-cli-plugin for details.
     */
    typeFileNameSuffix?: any[];
    /**
     * (Swagger Only) If set to true, the module will reuse class-validator validation
     * decorators (e.g. @Max(10) will add max: 10 to schema definition). See
     * https://docs.nestjs.com/openapi/cli-plugin#using-the-cli-plugin for details
     */
    classValidatorShim?: boolean;
    /**
     * (Swagger Only) Controller files suffix. See
     * https://docs.nestjs.com/openapi/cli-plugin#using-the-cli-plugin for details
     */
    controllerFileNameSuffix?: string;
    /**
     * (Swagger Only) The property key to set the comment text to on ApiOperation. See
     * https://docs.nestjs.com/openapi/cli-plugin#using-the-cli-plugin for details
     */
    controllerKeyOfComment?: string;
    /**
     * (Swagger Only) DTO (Data Transfer Object) files suffix. Default value: ['.dto.ts',
     * '.entity.ts']. See https://docs.nestjs.com/openapi/cli-plugin#using-the-cli-plugin for
     * details
     */
    dtoFileNameSuffix?: string[];
    /**
     * (Swagger Only) The property key to set the comment text to on ApiProperty. See
     * https://docs.nestjs.com/openapi/cli-plugin#using-the-cli-plugin for details
     */
    dtoKeyOfComment?: string;
    [property: string]: any;
  }

  /**
   * A map with keys specifying global generate options and values specifying the option
   * setting. See https://docs.nestjs.com/cli/monorepo#global-generate-options for details
   */
  export interface GenerateOptions {
    baseDir?: string;
    flat?: boolean;
    spec?: boolean | GenerateSpecOptionsClass;
  }

  export interface GenerateSpecOptionsClass {
    /**
     * Alias for sub-app
     */
    app?: boolean;
    /**
     * Generate spec file for application schematics or not.
     */
    application?: boolean;
    /**
     * Alias for class
     */
    cl?: boolean;
    /**
     * Disable spec file generation for class schematics.
     */
    class?: boolean;
    /**
     * Alias for controller
     */
    co?: boolean;
    /**
     * Alias for configuration
     */
    config?: boolean;
    /**
     * Generate spec file for configuration schematics or not.
     */
    configuration?: boolean;
    /**
     * Generate spec file for controller schematics or not.
     */
    controller?: boolean;
    /**
     * Alias for decorator
     */
    d?: boolean;
    /**
     * Generate spec file for decorator schematics or not.
     */
    decorator?: boolean;
    /**
     * Alias for filter
     */
    f?: boolean;
    /**
     * Generate spec file for filter schematics or not.
     */
    filter?: boolean;
    /**
     * Alias for gateway
     */
    ga?: boolean;
    /**
     * Generate spec file for gateway schematics or not.
     */
    gateway?: boolean;
    /**
     * Alias for guard
     */
    gu?: boolean;
    /**
     * Generate spec file for guard schematics or not.
     */
    guard?: boolean;
    /**
     * Alias for interceptor
     */
    in?: boolean;
    /**
     * Generate spec file for interceptor schematics or not.
     */
    interceptor?: boolean;
    /**
     * Generate spec file for interface schematics or not.
     */
    interface?: boolean;
    /**
     * Alias for library
     */
    lib?: boolean;
    /**
     * Generate spec file for library schematics or not.
     */
    library?: boolean;
    /**
     * Alias for middleware
     */
    mi?: boolean;
    /**
     * Generate spec file for middleware schematics or not.
     */
    middleware?: boolean;
    /**
     * Alias for module
     */
    mo?: boolean;
    /**
     * Generate spec file for module schematics or not.
     */
    module?: boolean;
    /**
     * Alias for pipe
     */
    pi?: boolean;
    /**
     * Generate spec file for pipe schematics or not.
     */
    pipe?: boolean;
    /**
     * Alias for provider
     */
    pr?: boolean;
    /**
     * Generate spec file for provider schematics or not.
     */
    provider?: boolean;
    /**
     * Alias for resolver
     */
    r?: boolean;
    /**
     * Alias for resource
     */
    res?: boolean;
    /**
     * Generate spec file for resolver schematics or not.
     */
    resolver?: boolean;
    /**
     * Generate spec file for resource schematics or not.
     */
    resource?: boolean;
    /**
     * Alias for resolver
     */
    s?: boolean;
    /**
     * Generate spec file for service schematics or not.
     */
    service?: boolean;
    /**
     * Generate spec file for sub-app schematics or not.
     */
    "sub-app"?: boolean;
  }

  export interface ProjectConfiguration {
    compilerOptions?: CompilerOptions;
    entryFile?: string;
    generateOptions?: GenerateOptions;
    root?: string;
    sourceRoot?: string;
    type?: string;
  }
}
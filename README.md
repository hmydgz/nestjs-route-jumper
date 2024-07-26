# Nestjs Route Jumper

[![Visual Studio Marketplace](https://flat.badgen.net/vs-marketplace/i/hmydgz.nestjs-route-jumper?icon=visualstudio)](https://marketplace.visualstudio.com/items?itemName=hmydgz.nestjs-route-jumper)

English | [简体中文](./README.zh_CN.md)

A plugin provided for the `Nest` project to quickly jump to code blocks through interface addresses

By querying the access path for matching `Controllers` and `Methods`, it is possible to jump to the corresponding function definition

![priview](https://github.com/hmydgz/nestjs-route-jumper/raw/main/doc/images/priview.gif)

## Usage

Open it through the Nest icon in the sidebar, where you can enter the interface access path in the input box above and press `Enter` to search

## Illustrate

Currently supported queries for routing-related functionality
1. routes declared by the `@Controller` `@Get` `@Post` `@Put` `@Patch` `@Delete` `@Options` `@Head` `@All` `@Version` decorator exported from `@nestjs/common`.
2. routes handled by the [Router module](https://docs.nestjs.com/recipes/router-module) in `nest`. ![priview](https://github.com/hmydgz/nestjs-route-jumper/raw/main/doc/images/router_module.png)
3. single inheritance for classes that support `@Controller`. ![priview](https://github.com/hmydgz/nestjs-route-jumper/raw/main/doc/images/controller_extend.png)
4. Supports the [standard mode / monorepo mode](https://docs.nestjs.com/cli/monorepo#monorepo-mode).

## Visual Studio Marketplace

This extension is available on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=hmydgz.nestjs-route-jumper) for Visual Studio Code.

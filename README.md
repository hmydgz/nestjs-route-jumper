# Nestjs Route Jumper

English | [简体中文](./README.zh_CN.md)

A plugin provided for the `Nest` project to quickly jump to code blocks through interface addresses

By querying the access path for matching Controllers and Methods, it is possible to jump to the corresponding function definition

![priview](https://github.com/hmydgz/nestjs-route-jumper/raw/main/doc/images/priview.gif)

## Usage

Open it through the Nest icon in the sidebar, where you can enter the interface access path in the input box above and press `Enter` to search

## Illustrate

Currently, it supports querying routes explicitly declared by decorators exported using `@nestjs/common`, as well as [Router module](https://docs.nestjs.com/recipes/router-module), Custom decorators and third-party packages are currently not supported

## Visual Studio Marketplace

This extension is available on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=hmydgz.nestjs-route-jumper) for Visual Studio Code.

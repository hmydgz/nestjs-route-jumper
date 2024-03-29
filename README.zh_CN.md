# Nestjs Route Jumper

[![Visual Studio Marketplace](https://flat.badgen.net/vs-marketplace/i/hmydgz.nestjs-route-jumper?icon=visualstudio)](https://marketplace.visualstudio.com/items?itemName=hmydgz.nestjs-route-jumper)

简体中文 | [English](./README.md)

为 `Nest` 项目提供的一个通过接口访问路径快速跳转到代码块的插件

通过访问路径查询对可匹配的 Controller 和 Method，可跳转到对应的函数定义处

![priview](https://github.com/hmydgz/nestjs-route-jumper/raw/main/doc/images/priview.gif)

## 使用方法

通过侧边栏的 Nest 图标打开，可在上方输入框中输入接口访问路径，回车搜索

## 说明

目前支持查询使用 `@nestjs/common` 导出的装饰器显式声明的路由，和 [Router module](https://docs.nestjs.com/recipes/router-module)，自定义装饰器与第三方包暂不支持

## Visual Studio Marketplace

此扩展可在 Visual Studio Code 的 [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=hmydgz.nestjs-route-jumper) 上找到

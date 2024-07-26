# Nestjs Route Jumper

[![Visual Studio Marketplace](https://flat.badgen.net/vs-marketplace/i/hmydgz.nestjs-route-jumper?icon=visualstudio)](https://marketplace.visualstudio.com/items?itemName=hmydgz.nestjs-route-jumper)

简体中文 | [English](./README.md)

为 `Nest` 项目提供的一个通过接口访问路径快速跳转到代码块的插件

通过访问路径查询对可匹配的 `Controller` 和 `Method`，可跳转到对应的函数定义处

![priview](https://github.com/hmydgz/nestjs-route-jumper/raw/main/doc/images/priview.gif)

## 使用方法

通过侧边栏的 Nest 图标打开，可在上方输入框中输入接口访问路径，回车搜索

## 说明

目前支持查询的路由相关功能
1. 通过从 `@nestjs/common` 导出的 `@Controller` `@Get` `@Post` `@Put` `@Patch` `@Delete` `@Options` `@Head` `@All` `@Version` 装饰器声明的路由;
2. `nest` 中的 [Router module](https://docs.nestjs.com/recipes/router-module) 处理的路由; ![priview](https://github.com/hmydgz/nestjs-route-jumper/raw/main/doc/images/router_module.png)
3. 支持 `@Controller` 的类的单继承; ![priview](https://github.com/hmydgz/nestjs-route-jumper/raw/main/doc/images/controller_extend.png)
4. 支持 [standard mode / monorepo mode](https://docs.nestjs.com/cli/monorepo#monorepo-mode);

## Visual Studio Marketplace

此扩展可在 Visual Studio Code 的 [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=hmydgz.nestjs-route-jumper) 上找到

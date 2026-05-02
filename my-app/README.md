# Spring Boot 4 RBAC 系统 - 前端应用

这是 Spring Boot 4 RBAC 系统的前端 React 应用。后端是一个基于 Spring Boot 4.1.0-M3 和 Java 21 虚拟线程的完整 RBAC（基于角色的访问控制）权限管理系统。

## 项目概述

- **前端**: React 19 (Create React App)
- **后端**: Spring Boot 4.1.0-M3, Java 21, PostgreSQL, Redis, MyBatis Plus
- **认证**: HTTP Basic 认证 (测试), OAuth2/JWT (生产)
- **虚拟线程**: 全面支持 Java 21 虚拟线程
- **数据库**: PostgreSQL (localhost:5432)
- **缓存**: Redis (localhost:6379)

## 功能特性

1. **用户认证** - 登录、注册、会话管理
2. **用户管理** - 用户 CRUD、批量操作、分页查询、统计
3. **角色管理** - 角色创建、分配、权限映射
4. **权限管理** - 细粒度权限控制 (API、菜单、按钮、数据)
5. **Redis 操作** - 键值对、哈希、列表、集合等操作
6. **虚拟线程演示** - Java 21 虚拟线程功能演示
7. **健康检查** - 各服务健康状态监控

## 快速开始

首先确保后端服务正在运行：
- 后端地址: `http://localhost:8080`
- 需要 PostgreSQL 和 Redis 服务

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm start
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动。

### 构建生产版本

```bash
npm run build
```

## 默认用户

- **管理员**: `admin` / `password` (ROLE_ADMIN)
- **普通用户**: `user` / `password` (ROLE_USER)

## 项目结构

```
src/
├── services/           # API 服务层
│   ├── api.js         # Axios 配置和拦截器
│   ├── authService.js # 认证服务
│   ├── userService.js # 用户服务
│   ├── roleService.js # 角色服务
│   ├── permissionService.js # 权限服务
│   ├── redisService.js     # Redis 服务
│   └── demoService.js      # 演示服务
├── components/         # React 组件
│   ├── auth/          # 认证组件
│   ├── users/         # 用户管理组件
│   ├── roles/         # 角色管理组件
│   ├── permissions/   # 权限管理组件
│   ├── redis/         # Redis 操作组件
│   └── demo/          # 演示组件
├── pages/             # 页面组件
│   └── Home.js       # 首页
└── utils/             # 工具函数
```

## API 文档

完整的 API 接口文档位于 `../docs/API_DOCUMENTATION.md`。

## 技术栈

- **前端框架**: React 19, React Router DOM 6
- **HTTP 客户端**: Axios
- **样式**: CSS3, Flexbox, Grid
- **构建工具**: Create React App, Webpack, Babel
- **代码质量**: ESLint, Prettier (React App 默认配置)

## 注意事项

1. 后端服务必须先运行在 `http://localhost:8080`
2. 需要 PostgreSQL 和 Redis 服务
3. 开发环境下使用 HTTP Basic 认证
4. 生产环境建议配置 OAuth2/JWT 认证

---

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

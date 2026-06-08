# Spring Boot 4 RBAC 权限管理系统

基于 **Spring Boot 4.1** + **Java 21 虚拟线程** + **React 19** 的 RBAC 权限管理系统。

---

## 📋 项目说明

- **后端**：Spring Boot 4.1.0-M3, Java 21, PostgreSQL, Redis, MyBatis Plus, Spring Security
- **前端**：React 19, React Router 6, Axios, ECharts
- **认证**：HTTP Basic（开发测试）/ OAuth2 + JWT（生产）

## 🚀 快速开始

```bash
cd my-app
npm install
npm start
```

访问 [http://localhost:3000](http://localhost:3000)

默认用户：`admin` / `password` (管理员)，`user` / `password` (普通用户)

## 📁 项目结构

```
├── my-app/                  # React 前端应用
│   └── src/
│       ├── components/      # 业务组件（用户/角色/权限/菜单/支付/监控等）
│       ├── services/        # API 服务层
│       ├── pages/           # 页面
│       └── utils/           # 工具函数
├── scripts/                 # 工具脚本
│   └── sync_menus.mjs       # 菜单同步到后端数据库
└── docs/                    # 文档
```

## ✨ 功能特性

- 用户 / 角色 / 权限 / 部门 / 菜单完整 CRUD
- 支付管理与对账
- JVM / 数据库 / 服务器 / 日志实时监控
- Redis 操作面板
- Java 21 虚拟线程演示
- 调度任务管理
- AI 助手集成

## 📄 许可协议

本项目采用**双重许可**模式：

| 用途 | 许可 |
|------|------|
| ✅ 学习、研究、个人使用 | 免费 (MIT) |
| ✅ Fork、提交 PR | 免费 (MIT) |
| ❌ 商业用途 | **需购买授权** |
| ❌ 提供收费服务 | **需购买授权** |
| ❌ 售卖源码 | **需购买授权** |

📧 **商业授权联系作者**：[your-email@example.com]

详见 [LICENSE](LICENSE) 和 [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md)

---

⭐ 如果这个项目对你有帮助，欢迎 Star！

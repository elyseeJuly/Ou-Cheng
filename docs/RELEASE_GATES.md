# 偶成 (Ou Cheng) — 发布门禁与质量检查清单 (RELEASE_GATES.md)

**版本**：v0.5.1  
**定位**：自动化与手动发布校验指导。

---

## 一、 自动化 CI 门禁命令

在提交 PR 或准备发布候选版本时，必须通过以下脚本：

```bash
# 1. 运行本地边界、React Smoke、真实 Chrome 核心旅程、TypeScript、覆盖率、构建与 Cloudflare 适配
npm run verify

# 2. 运行 iOS Capacitor 构建与 Web 相对路径检查
npm run verify:ios-build

# 3. 单独运行真实 Chrome 核心旅程
npm run verify:browser

# 4. 单独运行静态边界与 React 挂载 Smoke
npm run verify:smoke
```

---

## 二、 关键测试质量指标

* **TypeScript**：`strict: true` 下 0 报错；
* **Vitest Coverage**：Statements >= 65%, Branches >= 55%, Functions >= 60%, Lines >= 70%；
* **Playwright**：核心创作旅程必须在 Chrome 下通过，并验证草稿刷新恢复与 IndexedDB 作品主仓；
* **Audit 安全漏洞**：0 High / Critical vulnerabilities。

---

## 三、 iOS App Store 提交候选单

提交 iOS 构建前的确认事项：
- [ ] 原生 Filesystem + Share 分享导出链在 WKWebView 下唤起成功；
- [ ] 资源相对路径 `base: './'` 在 Xcode 部署后无白屏；
- [ ] Xcode 模拟器与真机冷启动无死锁与渲染卡顿。

仅 `verify:ios-build` 和 `sync:ios` 通过不能将版本标记为 App Store 提交候选；缺任一原生证据时保持 YELLOW。

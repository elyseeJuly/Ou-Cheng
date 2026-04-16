#!/bin/zsh
# ──────────────────────────────────────────
#  偶成 (Ou-Cheng) 启动器
#  双击此文件即可启动应用
# ──────────────────────────────────────────

# 获取脚本所在目录，确保从项目根目录运行
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  偶成 · 启动中…"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 加载 nvm
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh"
else
  echo "❌ 未找到 nvm，请先安装 Node.js："
  echo "   https://nodejs.org"
  read -r -p "按 Enter 退出…"
  exit 1
fi

# 使用 .nvmrc 指定版本（如有），否则使用已安装的最新版
if [ -f ".nvmrc" ]; then
  nvm use
else
  nvm use --lts 2>/dev/null || nvm use node
fi

# 检查 npm 是否可用
if ! command -v npm &>/dev/null; then
  echo "❌ npm 不可用，请检查 Node.js 安装"
  read -r -p "按 Enter 退出…"
  exit 1
fi

echo "✅ Node $(node -v)  /  npm $(npm -v)"
echo ""

# 安装依赖（如果 node_modules 不存在）
if [ ! -d "node_modules" ]; then
  echo "📦 首次运行，正在安装依赖…"
  npm install
  echo ""
fi

# 检查 .env 文件中是否有 API Key
if [ ! -f ".env" ] || ! grep -q "GEMINI_API_KEY" .env 2>/dev/null; then
  echo "⚠️  未检测到 GEMINI_API_KEY"
  echo "   如需使用 AI 功能，请在项目根目录创建 .env 文件："
  echo "   GEMINI_API_KEY=你的密钥"
  echo ""
fi

# 启动开发服务器（Vite 会自动打开浏览器）
echo "🚀 启动开发服务器…"
echo "   地址：http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
npm run dev

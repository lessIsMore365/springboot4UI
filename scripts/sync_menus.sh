#!/bin/bash
# 将前端静态菜单同步到后端数据库
set -e

BASE="http://localhost:8080"
CT="Content-Type: application/json"

echo "=== 1. 获取 access_token ==="
# Try OAuth2 client credentials
TOKEN_RESP=$(curl -s -X POST "$BASE/oauth2/token" \
  -u "admin:password" \
  -d "grant_type=client_credentials" \
  -H "Accept: application/json")

ACCESS_TOKEN=$(echo "$TOKEN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || echo "")

if [ -n "$ACCESS_TOKEN" ]; then
  AUTH="Authorization: Bearer $ACCESS_TOKEN"
  echo "Using Bearer token"
else
  AUTH="Authorization: Basic $(echo -n 'admin:password' | base64)"
  echo "Using Basic auth"
fi

echo ""
echo "=== 2. 创建菜单结构 ==="

create() {
  local PARENT="$1" NAME="$2" PATH="$3" ICON="$4" TYPE="$5" SORT="$6" PERM="${7:-}"
  local RESP=$(curl -s -X POST "$BASE/api/menus" \
    -H "$CT" -H "$AUTH" \
    -d "{\"parentId\":$PARENT,\"name\":\"$NAME\",\"path\":\"$PATH\",\"component\":\"\",\"icon\":\"$ICON\",\"sortOrder\":$SORT,\"menuType\":\"$TYPE\",\"permission\":\"$PERM\",\"visible\":1,\"status\":1}")
  local ID=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id', 0))" 2>/dev/null || echo 0)
  if [ "$ID" -gt 0 ] 2>/dev/null; then
    echo "  ✅ $NAME (id=$ID)"
  else
    echo "  ❌ $NAME: $RESP"
  fi
  echo "$ID"
}

# ---- 系统管理 ----
SYS_ID=$(create 0 "系统管理" "/system" "⚙️" "M" 1 "")
create "$SYS_ID" "用户管理" "/users" "👥" "C" 1 ""
create "$SYS_ID" "角色管理" "/roles" "👑" "C" 2 ""
create "$SYS_ID" "权限管理" "/permissions" "🔑" "C" 3 ""
create "$SYS_ID" "字典管理" "/dict" "📖" "C" 4 ""
create "$SYS_ID" "菜单管理" "/menus" "📋" "C" 5 ""

# ---- 业务功能 ----
BIZ_ID=$(create 0 "业务功能" "/business" "📋" "M" 2 "")
create "$BIZ_ID" "支付管理" "/payment" "💰" "C" 1 ""
create "$BIZ_ID" "对帐管理" "/reconciliation" "📈" "C" 2 ""

# ---- 数据服务 ----
DATA_ID=$(create 0 "数据服务" "/data" "🗄️" "M" 3 "")
create "$DATA_ID" "Redis" "/redis" "🗃️" "C" 1 ""

# ---- 开发工具 ----
DEV_ID=$(create 0 "开发工具" "/devtools" "🔧" "M" 4 "")
create "$DEV_ID" "Java 21" "/java21" "☕" "C" 1 ""
create "$DEV_ID" "JVM 监控" "/jvm?tab=app" "📈" "C" 2 ""
create "$DEV_ID" "数据库监控" "/db-monitor" "🗄️" "C" 3 ""
create "$DEV_ID" "服务器监控" "/server-monitor" "🖥️" "C" 4 ""
create "$DEV_ID" "日志管理" "/logs" "📜" "C" 5 ""
create "$DEV_ID" "操作日志" "/operlog" "📋" "C" 6 ""
create "$DEV_ID" "在线用户" "/online" "🟢" "C" 7 ""
create "$DEV_ID" "AI 助手" "/ai" "🤖" "C" 8 ""

# ---- 独立菜单 ----
create 0 "演示" "/demo" "⚡" "C" 99 ""

echo ""
echo "=== 3. 分配菜单给 admin 角色 ==="
# 获取 admin 角色 ID
ROLE_RESP=$(curl -s "$BASE/api/roles?page=1&size=50" -H "$AUTH")
ADMIN_ROLE_ID=$(echo "$ROLE_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
roles = d.get('data',{}).get('records', d.get('data',[]))
for r in roles:
    if r.get('roleCode') == 'ROLE_ADMIN':
        print(r.get('id'))
        break
" 2>/dev/null || echo "")

if [ -z "$ADMIN_ROLE_ID" ]; then
  echo "⚠️  未找到 ROLE_ADMIN 角色，跳过分配"
else
  echo "Admin 角色 ID: $ADMIN_ROLE_ID"

  # 获取所有菜单 ID
  MENU_RESP=$(curl -s "$BASE/api/menus/tree" -H "$AUTH")
  ALL_IDS=$(echo "$MENU_RESP" | python3 -c "
import sys,json
def collect(menus):
    ids = []
    for m in menus:
        ids.append(m['id'])
        if m.get('children'):
            ids.extend(collect(m['children']))
    return ids
d = json.load(sys.stdin)
print(json.dumps(collect(d.get('data',[]))))
" 2>/dev/null || echo "[]")

  echo "分配菜单 IDs: $ALL_IDS"

  ASSIGN_RESP=$(curl -s -X PUT "$BASE/api/menus/role/$ADMIN_ROLE_ID" \
    -H "$CT" -H "$AUTH" \
    -d "$ALL_IDS")
  echo "分配结果: $ASSIGN_RESP"
fi

echo ""
echo "=== Done ==="
echo "刷新页面即可看到动态菜单"

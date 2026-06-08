// 将前端菜单同步到后端数据库
// 用法: node scripts/sync_menus.mjs
// 注意: snowflake ID 超过 JS 安全整数，parentId 必须保持字符串，不可用 Number() 转换！
const BASE = "http://localhost:8080";
const AUTH = "Basic " + Buffer.from("admin:password").toString("base64");
const CT = { "Content-Type": "application/json", "Authorization": AUTH };

async function req(method, path, body) {
  const opts = { method, headers: { ...CT } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json();
}

async function getTree() {
  return (await req("GET", "/api/menus/tree")).data || [];
}

function flatTree(tree) {
  const r = [];
  for (const m of tree) { r.push(m); if (m.children?.length) r.push(...flatTree(m.children)); }
  return r;
}

async function createMenu({ parentId, name, path, icon, menuType, sortOrder }) {
  const res = await req("POST", "/api/menus", {
    parentId, name, path: path || "", component: "", icon,
    sortOrder, menuType, permission: "", visible: 0, status: 0,
  });
  if (res.success !== false && res.data?.id) {
    console.log(`  ✅ ${name} (id=${res.data.id})`);
    return String(res.data.id);
  }
  console.log(`  ❌ ${name}: ${res.message || JSON.stringify(res)}`);
  return null;
}

async function updateMenu(id, { parentId, name, path, icon, menuType, sortOrder }) {
  await req("PUT", "/api/menus", {
    id: String(id), parentId, name, path: path || "", component: "", icon,
    sortOrder, menuType, permission: "", visible: 0, status: 0,
  });
  console.log(`  🔄 ${name} (id=${id})`);
}

async function syncMenu(parentId, name, path, icon, menuType, sortOrder, existing) {
  const key = `${parentId}:${name}`;
  const ex = existing.find(m => String(m.parentId || 0) === String(parentId) && m.name === name);
  if (ex) {
    if (ex.path !== path || ex.icon !== icon || ex.sortOrder !== sortOrder) {
      await updateMenu(ex.id, { parentId, name, path, icon, menuType, sortOrder });
    } else {
      console.log(`  ⏭️  ${name} (已同步)`);
    }
    return String(ex.id);
  }
  return await createMenu({ parentId, name, path, icon, menuType, sortOrder });
}

const DESIRED_MENUS = {
  // parentId: 0 = root
  roots: [
    { name: "系统管理", path: "/system", icon: "⚙️", menuType: "M", sortOrder: 1, children: [
      { name: "用户管理", path: "/users", icon: "👥", menuType: "C", sortOrder: 1 },
      { name: "角色管理", path: "/roles", icon: "👑", menuType: "C", sortOrder: 2 },
      { name: "权限管理", path: "/permissions", icon: "🔑", menuType: "C", sortOrder: 3 },
      { name: "部门管理", path: "/dept", icon: "🏢", menuType: "C", sortOrder: 4 },
      { name: "字典管理", path: "/dict", icon: "📖", menuType: "C", sortOrder: 5 },
      { name: "菜单管理", path: "/menus", icon: "📋", menuType: "C", sortOrder: 6 },
    ]},
    { name: "支付管理", path: "/payment", icon: "💰", menuType: "M", sortOrder: 2, children: [
      { name: "支付订单", path: "/payment?tab=order", icon: "📋", menuType: "C", sortOrder: 1 },
      { name: "对帐管理", path: "/reconciliation", icon: "📈", menuType: "C", sortOrder: 2 },
      { name: "支付统计", path: "/payment-stats", icon: "📊", menuType: "C", sortOrder: 3 },
    ]},
    { name: "数据服务", path: "/data", icon: "🗄️", menuType: "M", sortOrder: 3, children: [
      { name: "Redis", path: "/redis", icon: "🗃️", menuType: "C", sortOrder: 1 },
    ]},
    { name: "监控管理", path: "/monitor", icon: "🔧", menuType: "M", sortOrder: 4, children: [
      { name: "Java 21", path: "/java21", icon: "☕", menuType: "C", sortOrder: 1 },
      { name: "JVM 监控", path: "/jvm?tab=app", icon: "📈", menuType: "C", sortOrder: 2 },
      { name: "数据库监控", path: "/db-monitor", icon: "🗄️", menuType: "C", sortOrder: 3 },
      { name: "服务器监控", path: "/server-monitor", icon: "🖥️", menuType: "C", sortOrder: 4 },
      { name: "日志管理", path: "/logs", icon: "📜", menuType: "C", sortOrder: 5 },
      { name: "操作日志", path: "/operlog", icon: "📋", menuType: "C", sortOrder: 6 },
      { name: "在线用户", path: "/online", icon: "🟢", menuType: "C", sortOrder: 7 },
      { name: "AI 助手", path: "/ai", icon: "🤖", menuType: "C", sortOrder: 8 },
    ]},
  ],
  standalone: [
    { name: "调度任务", path: "/scheduler", icon: "⏰", menuType: "C", sortOrder: 98 },
    { name: "演示", path: "/demo", icon: "⚡", menuType: "C", sortOrder: 99 },
  ],
};

async function main() {
  console.log("=== 同步菜单到后端 ===\n");

  let tree = await getTree();
  let allFlat = flatTree(tree);
  console.log(`当前菜单: ${allFlat.length} 个\n`);

  // 同步所有分类和子菜单
  for (const cat of DESIRED_MENUS.roots) {
    console.log(`--- ${cat.name} ---`);
    const catId = await syncMenu("0", cat.name, cat.path, cat.icon, cat.menuType, cat.sortOrder, allFlat);
    if (catId && cat.children) {
      for (const child of cat.children) {
        await syncMenu(catId, child.name, child.path, child.icon, child.menuType, child.sortOrder, allFlat);
      }
    }
    // Re-fetch after each category to pick up new IDs
    tree = await getTree();
    allFlat = flatTree(tree);
    console.log();
  }

  // 独立菜单
  console.log("--- 独立菜单 ---");
  for (const item of DESIRED_MENUS.standalone) {
    await syncMenu("0", item.name, item.path, item.icon, item.menuType, item.sortOrder, allFlat);
  }

  // 分配角色
  console.log("\n=== 分配菜单给 admin 角色 ===");
  tree = await getTree();
  allFlat = flatTree(tree);

  const roleRes = await req("GET", "/api/roles?page=1&size=50");
  const adminRole = (roleRes.data || []).find(r => r.code === "ROLE_ADMIN");
  if (!adminRole) { console.log("⚠️  未找到 ROLE_ADMIN"); return; }

  const ids = allFlat.map(m => String(m.id));
  console.log(`${ids.length} 个菜单, Admin 角色 ID: ${adminRole.id}`);
  const assignRes = await req("PUT", `/api/menus/role/${adminRole.id}`, ids);
  console.log("分配:", assignRes.success ? "✅ 成功" : JSON.stringify(assignRes));

  // 最终展示
  console.log("\n=== 最终菜单树 ===");
  tree = await getTree();
  function show(ms, indent = 0) {
    for (const m of ms) {
      console.log("  ".repeat(indent) + `${m.icon || '📄'} ${m.name} → ${m.path || '-'}`);
      if (m.children?.length) show(m.children, indent + 1);
    }
  }
  show(tree);
  console.log(`\n共 ${flatTree(tree).length} 个菜单`);
}

main().catch(e => { console.error(e); process.exit(1); });

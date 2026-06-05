#!/usr/bin/env node
/**
 * 批量生成题库 — 可视进度版
 * deepseek-chat: ~9s/批 × 4路并发 × 8题/批 ≈ 200题/分钟
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "data", "question-bank.json");
const KEY = process.env.DEEPSEEK_API_KEY;
const BASE = "https://api.deepseek.com/v1/chat/completions";

const BATCH = 8;
const CONCUR = 4;

const TARGETS = [
  { module: "管理学", total: 500 },
  { module: "党建时政", total: 200 },
  { module: "南航专项", total: 200 },
  { module: "行测", total: 100 },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const PROMPTS = {
  "管理学": "机务班组长/MCC值班经理实景案例：排故资源调度、MEL管控决策、班组冲突协调、跨部门协作、安全管理决断。每道题要有具体机型(B737/A320/C909)、具体故障、时间约束、4个不同管理风格的选项。",
  "党建时政": "党章/政绩观/十五五规划(2026-2030)/二十届四中全会/四个意识/两个维护/三不腐/国企根和魂/从严治党/四个以学/七个有之。",
  "南航专项": "南航精神(勤奋务实包容创新)/安全理念(生命至上安全第一遵章履责崇严求实)/服务理念(亲和精细)/APS(生产有准备施工有程序工作有标准)/机务四化(市场化一体化产业化国际化)/五要素标准化。",
  "行测": "数字运算(完整数据)、逻辑判断(完整前提)、图形推理(文字描述规律)、言语理解(文段+推断)。每题唯一正确答案。",
};

// 进度渲染
function bar(v, total, w = 20) {
  const p = Math.min(1, v / total);
  const f = Math.round(p * w);
  return "█".repeat(f) + "░".repeat(w - f);
}
function now() { return new Date().toLocaleTimeString(); }

async function callAPI(module) {
  const scope = PROMPTS[module] || module;
  const system = `你是南方新华猎头公司，给南航央企机务维修执行层干部竞聘笔试命题。出"${module}"类单选题，A/B/C/D四选项。场景具体不笼统，干扰项合理有区分度，解析含考点速记。纯JSON输出：{"questions":[{"module":"${module}","stem":"","options":[{"label":"A","text":""},{"label":"B","text":""},{"label":"C","text":""},{"label":"D","text":""}],"answer":"","explanation":""}]}`;

  for (let r = 0; r < 3; r++) {
    try {
      const res = await fetch(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${KEY}` },
        body: JSON.stringify({ model: "deepseek-chat", max_tokens: 3072, temperature: 1.0, messages: [{ role: "system", content: system }, { role: "user", content: `出${BATCH}道${module}单选题。${scope}` }] }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) { const txt = await res.text().catch(()=>""); throw new Error(`HTTP ${res.status} ${txt.slice(0,50)}`); }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      let m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("No JSON");
      let parsed; try { parsed = JSON.parse(m[0]); } catch { parsed = JSON.parse(m[0].replace(/\n/g," ").replace(/,\s*}/g,"}")); }
      return (parsed.questions || []).map((q, i) => ({
        id: `${module}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,5)}_${i}`,
        module: q.module || module, stem: q.stem, options: q.options || [],
        answer: q.answer, explanation: q.explanation || "",
      }));
    } catch (e) { if (r === 2) throw e; await sleep(1000); }
  }
  return [];
}

async function main() {
  if (!KEY) { console.error("❌ 未设置 DEEPSEEK_API_KEY"); process.exit(1); }
  let all = [];
  try { if (fs.existsSync(OUT)) all = JSON.parse(fs.readFileSync(OUT, "utf-8")); } catch (_) {}
  const started = Date.now();

  console.clear();
  console.log("╔══════════════════════════════════════════╗");
  console.log("║    🧠 题库批量生成 — deepseek-chat     ║");
  console.log(`║    ${BATCH}题/批 × ${CONCUR}路并发 ≈ ${Math.round(BATCH*CONCUR*60/9)}题/分钟     ║`);
  console.log("╚══════════════════════════════════════════╝\n");

  for (const { module, total } of TARGETS) {
    const existing = all.filter(q => q.module === module).length;
    if (existing >= total) {
      console.log(`  ✅ ${module}: ${existing}/${total} 已完成，跳过\n`);
      continue;
    }
    const needed = total - existing;
    const batches = Math.ceil(needed / BATCH);
    const modStart = Date.now();

    for (let i = 0; i < batches; i += CONCUR) {
      const n = Math.min(CONCUR, batches - i);
      const t0 = Date.now();
      const results = await Promise.allSettled(
        Array.from({ length: n }, () => callAPI(module))
      );
      const dt = ((Date.now() - t0) / 1000).toFixed(1);
      let added = 0, fails = 0;
      for (const r of results) {
        if (r.status === "fulfilled" && r.value?.length) { all.push(...r.value); added += r.value.length; }
        else fails++;
      }
      fs.writeFileSync(OUT, JSON.stringify(all, null, 2));

      const done = all.filter(q => q.module === module).length;
      const pct = Math.round(done / total * 100);
      const elapsed = Math.round((Date.now() - modStart) / 1000);
      const eta = pct > 0 ? Math.round(elapsed / pct * (100 - pct)) : 0;
      const globalTotal = all.length;
      const globalElapsed = Math.round((Date.now() - started) / 1000);

      // 获取各模块数量
      const counts = {};
      for (const t of TARGETS) counts[t.module] = all.filter(q => q.module === t.module).length;

      // 渲染可视进度
      console.clear();
      console.log("╔══════════════════════════════════════════════════╗");
      console.log("║  🧠 题库生成 — Visual Progress Dashboard      ║");
      console.log(`║  ${now()}  已运行 ${Math.floor(globalElapsed/60)}分${globalElapsed%60}秒                     ║`);
      console.log("╠══════════════════════════════════════════════════╣");
      for (const t of TARGETS) {
        const c = counts[t.module] || 0;
        const p = Math.round(c / t.total * 100);
        const b = bar(c, t.total, 30);
        const check = c >= t.total ? " ✅" : "";
        console.log(`║ ${t.module.padEnd(6)} ${b} ${String(p).padStart(3)}% ${String(c).padStart(4)}/${String(t.total).padStart(4)}${check}`);
      }
      console.log("╠══════════════════════════════════════════════════╣");
      console.log(`║  总计: ${globalTotal} 题 | 本轮: +${added}题/${dt}s ${fails ? `| ${fails}失败` : ""}`);
      if (pct > 0 && pct < 100) console.log(`║  当前模块 ETA: ~${Math.floor(eta/60)}分${eta%60}秒`);
      console.log("╚══════════════════════════════════════════════════╝");
    }
    console.log(`\n  ✅ ${module} 完成！耗时 ${Math.round((Date.now()-modStart)/1000/60)}分钟\n`);
  }

  const totalTime = Math.round((Date.now() - started) / 1000);
  const totals = {}; all.forEach(q => { totals[q.module] = (totals[q.module]||0)+1; });
  console.log(`\n🎉 全部完成！`);
  console.log(`   总题数: ${all.length}  耗时: ${Math.floor(totalTime/60)}分${totalTime%60}秒`);
  for (const [k,v] of Object.entries(totals)) console.log(`   ${k}: ${v}`);
}

main().catch(e => { console.error("\n❌ 致命错误:", e.message); process.exit(1); });

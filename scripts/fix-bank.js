#!/usr/bin/env node
/**
 * 题库质量修复脚本
 * 功能：1.去重 2.答案分布均衡化 3.行测错误解析标记
 * 用法：node scripts/fix-bank.js
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "public", "data", "question-bank.json");
const BAK = path.join(__dirname, "..", "public", "data", "question-bank.bak.json");

let all = JSON.parse(fs.readFileSync(SRC, "utf-8"));
console.log(`📦 原始题库: ${all.length} 道\n`);

// ─── 1. 备份原始题库 ───────────────────────────────────────
fs.writeFileSync(BAK, JSON.stringify(all, null, 2));
console.log("✅ 已备份至 question-bank.bak.json");

// ─── 2. 去重（题干前30字相同视为重复，保留第一条）────────────
const seen = new Set();
const deduped = [];
let dupCount = 0;
for (const q of all) {
  const key = q.stem.slice(0, 30);
  if (seen.has(key)) { dupCount++; continue; }
  seen.add(key);
  deduped.push(q);
}
console.log(`🗑  去重: 移除 ${dupCount} 道重复题，剩余 ${deduped.length} 道`);
all = deduped;

// ─── 3. 答案分布均衡化 ────────────────────────────────────
const LABELS = ["A", "B", "C", "D"];

function rotateOptions(q, newAnswerLabel) {
  const oldIdx = LABELS.indexOf(q.answer);
  const newIdx = LABELS.indexOf(newAnswerLabel);
  if (oldIdx === newIdx) return q;
  const opts = q.options.map(o => ({ ...o }));
  const tmp = opts[newIdx].text;
  opts[newIdx].text = opts[oldIdx].text;
  opts[oldIdx].text = tmp;
  return { ...q, options: opts, answer: newAnswerLabel };
}

const countByAnswer = (arr) => arr.reduce((acc, q) => {
  acc[q.answer] = (acc[q.answer] || 0) + 1; return acc;
}, {});

console.log("\n📊 均衡前答案分布:", countByAnswer(all));

const target = Math.floor(all.length / 4);
const counts = { A: 0, B: 0, C: 0, D: 0 };
all.forEach(q => { if (counts[q.answer] !== undefined) counts[q.answer]++; });

const balanced = all.map(q => {
  const cur = q.answer;
  if (!LABELS.includes(cur)) return q;
  const under = LABELS.filter(l => l !== cur && counts[l] < target);
  if (under.length === 0) return q;
  under.sort((a, b) => counts[a] - counts[b]);
  const newLabel = under[0];
  counts[cur]--;
  counts[newLabel]++;
  return rotateOptions(q, newLabel);
});

console.log("📊 均衡后答案分布:", countByAnswer(balanced));
all = balanced;

// ─── 4. 标记行测解析存在计算矛盾的题目 ───────────────────────
let flagged = 0;
all = all.map(q => {
  if (q.module === "行测") {
    const suspicious = ["选项无", "检查：", "重新计算", "有误", "笔误"];
    if (suspicious.some(kw => q.explanation?.includes(kw))) {
      flagged++;
      return { ...q, flagged: true, flagReason: "解析存在计算矛盾，需人工复核" };
    }
  }
  return q;
});
console.log(`\n⚠️  标记行测可疑题目: ${flagged} 道（已加 flagged:true 字段）`);

// ─── 5. 写回文件 ──────────────────────────────────────────
fs.writeFileSync(SRC, JSON.stringify(all, null, 2));
console.log(`\n🎉 修复完成！最终题库: ${all.length} 道`);

const modCount = all.reduce((acc, q) => {
  acc[q.module] = (acc[q.module] || 0) + 1; return acc;
}, {});
console.log("📦 模块分布:", modCount);

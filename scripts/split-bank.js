#!/usr/bin/env node
/** 将题库按模块拆分为独立文件，加快前端按需加载 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "public", "data", "question-bank.json");
const OUT_DIR = path.join(__dirname, "..", "public", "data");

const all = JSON.parse(fs.readFileSync(SRC, "utf-8"));
const MODULES = ["管理学", "党建时政", "南航专项", "行测"];

// 按模块写入独立文件
MODULES.forEach((mod) => {
  const questions = all.filter((q) => q.module === mod);
  const outPath = path.join(OUT_DIR, `bank-${mod}.json`);
  fs.writeFileSync(outPath, JSON.stringify(questions, null, 2));
  console.log(`✅ ${mod}: ${questions.length} 题 → bank-${mod}.json`);
});

// 写入汇总索引（含 id/module/stem/answer，轻量用于搜索页）
const index = all.map(({ id, module, stem, answer, explanation }) => ({
  id, module, stem, answer,
  explanation: explanation?.slice(0, 80) || "",
}));
fs.writeFileSync(path.join(OUT_DIR, "bank-index.json"), JSON.stringify(index, null, 2));
console.log(`\n📦 索引文件: ${index.length} 条 → bank-index.json`);

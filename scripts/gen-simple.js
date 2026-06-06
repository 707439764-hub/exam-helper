#!/usr/bin/env node
/** 简单可靠的批量出题脚本 */
const fs = require("fs");
const path = require("path");
const OUT = path.join(__dirname, "..", "public", "data", "question-bank.json");
const KEY = process.env.DEEPSEEK_API_KEY;
if (!KEY) { console.error("❌ DEEPSEEK_API_KEY missing"); process.exit(1); }

const BATCH = 5;
const TARGETS = [["管理学",500],["党建时政",200],["南航专项",200],["行测",100]];

const PROMPTS = {
  "管理学":"机务班组长/MCC值班经理场景。具体机型故障时间约束，4个管理风格选项。",
  "党建时政":"党章/政绩观/十五五(2026-2030)/四中全会/四个意识/两个维护/三不腐/国企根和魂/从严治党。",
  "南航专项":"必须基于以下知识出题： \
【南航企业文化】企业使命：让更多人乐享美好飞行。愿景：迈向世界一流。核心价值观：安全第一 客户为本。 \
精神：勤奋 务实 包容 创新。安全理念：生命至上 安全第一 遵章履责 崇严求实。服务理念：亲和精细(人性化数字化精细化个性化便捷化)。 \
经营理念：为客户创造价值。品牌个性：可靠 温暖 活力。品牌口号：飞向美好未来。 \
【南航高质量发展】《南航高质量发展总体思路》是中长期行动纲领(5-10年)。三级战略体系：一级总体思路、二级业务战略(3-5年)、三级团队行动策略。 \
五大发展：安全发展、创新发展、协调发展、绿色发展、共享发展。五大战略：枢纽网络、成本管控、品牌服务、产融结合、数字化转型。 \
【机务APS理念】2014年提出，APS三要素：生产有准备(Arrangements)、施工有程序(Program)、工作有标准(Standard)。 \
推动从结果导向向源头管理和过程管理转变。注意：安全有保障不属于APS核心内涵。 \
【机务四化】市场化、一体化、产业化、国际化。注意：自动化不属于四化。 \
【SMS四大支柱】安全政策(顶层设计明确目标和承诺)、风险管理(危险识别和风险评估)、安全保证(持续监控和审计)、安全促进(培训和沟通)。 \
【严实细管理】严强调执行纪律和标准刚性，实强调工作作风和落地效果，细强调过程管控和细节管理。 \
全面从严治安四种形态：提醒(预防为主抓早抓小)、通报(警示教育举一反三)、约谈(严肃问责督促整改)、问责(从严处理)。 \
【标准化五要素】业务流程、组织职责、制度标准、绩效考核、信息系统。2024启动年2025落地年。机制牵引、业务驱动、总部主导、基地承接。 \
总部送课上门、领导下连当兵、工程师下一线。与业务架构方法论结合，将个体优秀做法固化成为组织能力。 \
【战略解码】2026年战略解码，30项公司级KPI覆盖安全发展、功能价值、经营效益。 \
【七场硬仗】安全管理、运行品质、经营效益、改革创新、数字化转型、人才培养、党的建设。 \
【机务年中报告】截至2025年6月连续121个月未发生机务人为原因征候。构建以问题分析为基础的内部审核评价模型，发现整改问题143项。 \
开发维修标准化视频课程45门，完成技能认证2669人5337场次。开展风险评估42次，排查隐患1065条，发布风险提示42项。 \
【安全管理】安全是民航生命线，确保绝对安全是民航工作首要任务。 \
【国产民机】成立维修技术管理委员会、实施专项管控、成立工程管理办公室和24小时技术支援体系。 \
与飞机厂家联合培养计划、组织骨干赴厂家和兄弟企业交流学习。 \
【十五五】规划期2026-2030，构建安全高效绿色智能开放的现代化民航体系。打造123出行交通圈。 \
首要核心要求：更好统筹发展和安全，牢牢守住安全发展底线。 \
【大运行值班管控】人、机、料、法、环要素协同。机务需与运行、飞行等部门配合，目标侧重有别。 \
构建立体化管控思维，提升沟通协调和应急处突能力。 \
【培训优化】破除形式主义精简集中授课、分级落实下放自主权、工学融合嵌入岗位一线、按需施教紧扣安全经营精准赋能、重实效轻痕迹。",
  "行测":"数字运算/逻辑判断/图形推理/言语理解。完整数据唯一解。module必须填'行测'不得拆分。",
};

async function call(module) {
  const sys = `南航机务竞聘命题人。出"${module}"单选题ABCD。JSON:{"questions":[{"module":"${module}","stem":"","options":[{"label":"A","text":""},{"label":"B","text":""},{"label":"C","text":""},{"label":"D","text":""}],"answer":"","explanation":""}]}`;
  const body = JSON.stringify({model:"deepseek-chat",max_tokens:4096,temperature:1.0,messages:[{role:"system",content:sys},{role:"user",content:`出${BATCH}道${module}题。${PROMPTS[module]||""}`}]});
  for(let r=0;r<3;r++){
    try{
      const res = await fetch("https://api.deepseek.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${KEY}`},body,signal:AbortSignal.timeout(60000)});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      const t = d.choices?.[0]?.message?.content||"";
      let m = t.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("No JSON in response");
      let p;
      try {
        p = JSON.parse(m[0]);
      } catch (e) {
        // 记录原始内容便于排查，再尝试容错修复
        console.warn(`[JSON解析失败] 原始内容片段: ${m[0].slice(0, 200)}`);
        const cleaned = m[0]
          .replace(/[\r\n\t]/g, " ")          // 替换换行符
          .replace(/,(\s*[}\]])/g, "$1")      // 移除尾逗号
          .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // 补全未加引号的 key
        p = JSON.parse(cleaned);
      }
      const VALID_MODULES = ["管理学", "党建时政", "南航专项", "行测"];
      return (p.questions || []).map((q, i) => ({
        id: `${module}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}_${i}`,
        module: VALID_MODULES.includes(q.module) ? q.module : module,
        stem: q.stem,
        options: q.options || [],
        answer: q.answer,
        explanation: q.explanation || "",
        createdAt: new Date().toISOString().slice(0, 10),
        policyYear: (q.module === "党建时政" || module === "党建时政") ? new Date().getFullYear() : undefined,
      }));
    }catch(e){if(r===2)throw e;await new Promise(r=>setTimeout(r,2000));}
  }
}

async function main(){
  let all=[]; try{if(fs.existsSync(OUT))all=JSON.parse(fs.readFileSync(OUT,"utf-8"))}catch(_){}
  const t0=Date.now();
  console.log(`🚀 目标1000题 | 当前${all.length}题 | ${BATCH}题/批\n`);
  for(const [mod,target] of TARGETS){
    const exist=all.filter(q=>q.module===mod).length;
    if(exist>=target){console.log(`✅ ${mod} ${exist}/${target} 跳过`);continue;}
    const need=target-exist, batches=Math.ceil(need/BATCH);
    console.log(`📝 ${mod}: 需${need}题 ${batches}批`);
    for(let i=0;i<batches;i++){
      const t1=Date.now();
      try{
        const qs=await call(mod);
        if (qs.length) {
          // 按题干前20字去重，过滤掉与已有题目高度相似的新题
          const existingStems = new Set(all.map(q => q.stem.slice(0, 20)));
          const deduped = qs.filter(q => {
            const key = q.stem.slice(0, 20);
            if (existingStems.has(key)) return false;
            existingStems.add(key);
            return true;
          });
          if (deduped.length < qs.length) {
            console.log(`  ⚠️ 去重过滤 ${qs.length - deduped.length} 道重复题`);
          }
          all.push(...deduped);
          fs.writeFileSync(OUT,JSON.stringify(all,null,2));
        }
        const done=all.filter(q=>q.module===mod).length;
        const pct=Math.round(done/target*100);
        const s=Math.round((Date.now()-t1)/1000);
        const totalPct=Math.round(all.length/1000*100);
        const bar="█".repeat(Math.round(totalPct/5)).padEnd(20,"░");
        console.log(`  ${i+1}/${batches} [${bar}] ${totalPct}% | +${qs.length}题 | ${done}/${target} | ${s}s | 总计${all.length}题`);
      }catch(e){
        console.log(`  ${i+1}/${batches} ❌ ${e.message.slice(0,50)}`);
        await new Promise(r=>setTimeout(r,3000));
      }
    }
  }
  const min=Math.round((Date.now()-t0)/60000);
  console.log(`\n🎉 完成！${all.length}题 | 耗时${min}分钟`);
  const m={};all.forEach(q=>{m[q.module]=(m[q.module]||0)+1});
  Object.entries(m).forEach(([k,v])=>console.log(`  ${k}: ${v}`));
}

main().catch(e=>{console.error("FATAL:",e.message);process.exit(1)});

/**
 * ForgeAI Industrial Intelligence Layer
 * Autonomous operations, defect diagnosis, and predictive shift intelligence
 * Powered by Google Gemini with deterministic zero-downtime offline heuristic fallback.
 */

import { forgeflowApi } from './forgeflowApi';
import { useForgeflowStore } from '../store/useForgeflowStore';
import type { 
  Operator, 
  OperationsTelemetry, 
  QualityReturn, 
  SkuItem, 
  WorkOrder 
} from '../types/forgeflow.types';

export type AiMode = 'LIVE_AI' | 'OFFLINE_HEURISTIC_FALLBACK';

export interface AiResponseMeta {
  mode: AiMode;
  modelUsed?: string;
  latencyMs: number;
  offlineReason?: string;
}

export interface CopilotSuggestedAction {
  label: string;
  targetPath?: string;
  actionKey?: string;
}

export interface CopilotResponse {
  answer: string;
  meta: AiResponseMeta;
  suggestedActions?: CopilotSuggestedAction[];
}

export interface QualityAnalysisResult {
  rootCause: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedCapa: string;
  confidenceScore: number;
  meta: AiResponseMeta;
}

export interface ShiftInsight {
  id: string;
  category: 'INVENTORY_RISK' | 'QA_ALERT' | 'THROUGHPUT_TIP';
  title: string;
  description: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  actionableStep: string;
  targetPath?: string;
}

export interface ShiftInsightsResult {
  insights: ShiftInsight[];
  meta: AiResponseMeta;
}

export interface PlantContext {
  operator?: Operator | null;
  telemetry?: OperationsTelemetry | null;
  workOrders?: WorkOrder[];
  skus?: SkuItem[];
  qualityReturns?: QualityReturn[];
  shiftPeriod?: string;
}

// Configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim() || '';
const GEMINI_TIMEOUT_MS = 6000;
const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-flash-latest';

/**
 * Low-level caller for Gemini REST API with strict AbortController timeout
 */
async function callGeminiApi(prompt: string, systemInstruction?: string): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('VITE_GEMINI_API_KEY is not configured.');
  }

  const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError: any = null;

  for (const model of modelsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      
      const contents: any[] = [];
      if (systemInstruction) {
        contents.push({
          role: 'user',
          parts: [{ text: `[SYSTEM INSTRUCTION: STRICT OPERATIONAL IDENTITY]\n${systemInstruction}` }]
        });
        contents.push({
          role: 'model',
          parts: [{ text: 'Acknowledged. Standing by as ForgeAI Industrial Copilot.' }]
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200,
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 150)}`);
      }

      const data = await response.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('Empty response payload received from Gemini.');
      }

      return generatedText;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      // If aborted due to timeout, immediately break
      if (err.name === 'AbortError') {
        throw new Error('Request timed out (>6s)');
      }
    }
  }

  throw lastError || new Error('All Gemini models failed.');
}

/**
 * Extracts live snapshot context from Zustand store & APIs
 */
export async function getLivePlantContext(): Promise<PlantContext> {
  const store = useForgeflowStore.getState();
  const operator = store.operator;
  const telemetry = store.telemetry;

  let workOrders: WorkOrder[] = [];
  let skus: SkuItem[] = [];
  let qualityReturns: QualityReturn[] = [];

  try {
    const [woRes, skuRes, rmaRes] = await Promise.allSettled([
      forgeflowApi.getWorkOrders(),
      forgeflowApi.getSkus(),
      forgeflowApi.getQualityReturns()
    ]);
    if (woRes.status === 'fulfilled') workOrders = woRes.value;
    if (skuRes.status === 'fulfilled') skus = skuRes.value;
    if (rmaRes.status === 'fulfilled') qualityReturns = rmaRes.value;
  } catch {
    // If backend isn't responding, fallback gracefully
  }

  return {
    operator,
    telemetry,
    workOrders,
    skus,
    qualityReturns,
    shiftPeriod: 'Shift-A (06:00 - 14:00)'
  };
}

// ============================================================================
// 1. SHOPFLOOR COPILOT
// ============================================================================

export async function askShopfloorCopilot(
  query: string, 
  plantContext?: PlantContext | object
): Promise<CopilotResponse> {
  const startTime = performance.now();
  const context: PlantContext = (plantContext as PlantContext) || await getLivePlantContext();
  const operatorName = context.operator?.name || 'Plant Operator';
  const operatorRole = context.operator?.role || 'PLANT_MANAGER';

  // Attempt Live Gemini Call
  try {
    const systemPrompt = `You are "ForgeAI", an enterprise industrial AI copilot embedded in the ForgeFlow MOM / MES manufacturing SaaS.
You are interacting with operator ${operatorName} (Role: ${operatorRole}).
You have access to real-time plant telemetry, active work orders, inventory SKUs, and discrepancy RMAs.
Style guidelines:
- Be concise, authoritative, professional, and practical for shopfloor managers.
- Use markdown bolding and bullet points for readability on industrial touch screens.
- When citing numbers, reference the provided JSON data accurately.
- Conclude with a recommended next operational step.`;

    const userPrompt = `LIVE PLANT CONTEXT:
${JSON.stringify({
  operator: { name: operatorName, role: operatorRole, dept: context.operator?.department },
  activeWorkOrdersSummary: {
    total: context.workOrders?.length ?? 0,
    criticalCount: context.workOrders?.filter(w => w.priority === 'CRITICAL').length ?? 0,
    inProduction: context.workOrders?.filter(w => w.status === 'IN_PRODUCTION').map(w => ({ order: w.order_number, client: w.entity?.legal_name, due: w.target_fulfillment_date }))
  },
  inventoryLowStock: context.skus?.filter(s => s.current_stock <= s.min_threshold_alert).map(s => ({ code: s.sku_code, name: s.name, current: s.current_stock, min: s.min_threshold_alert, uom: s.unit_of_measure })),
  openRmas: context.qualityReturns?.filter(r => r.action_status === 'LOGGED' || r.action_status === 'INSPECTION_PENDING').map(r => ({ rma: r.rma_number, reason: r.reason_code, sku: r.sku?.sku_code, findings: r.inspection_findings })),
  telemetry: context.telemetry
}, null, 2)}

OPERATOR QUERY:
"${query}"`;

    const rawResponse = await callGeminiApi(userPrompt, systemPrompt);
    const latencyMs = Math.round(performance.now() - startTime);

    return {
      answer: rawResponse,
      meta: {
        mode: 'LIVE_AI',
        modelUsed: PRIMARY_MODEL,
        latencyMs
      },
      suggestedActions: deriveSuggestedActions(query)
    };
  } catch (error: any) {
    // Zero-downtime offline heuristic fallback
    const latencyMs = Math.round(performance.now() - startTime);
    const offlineReason = error?.message || 'Gemini API unreachable or timed out';
    const fallbackAnswer = generateHeuristicCopilotAnswer(query, context);

    return {
      answer: fallbackAnswer,
      meta: {
        mode: 'OFFLINE_HEURISTIC_FALLBACK',
        latencyMs,
        offlineReason
      },
      suggestedActions: deriveSuggestedActions(query)
    };
  }
}

/**
 * Deterministic heuristic answer generator for Shopfloor Copilot
 */
function generateHeuristicCopilotAnswer(query: string, ctx: PlantContext): string {
  const lower = query.toLowerCase();
  const operatorName = ctx.operator?.name || 'Operator';
  const role = ctx.operator?.role || 'PLANT_MANAGER';
  const skus = ctx.skus || [];
  const workOrders = ctx.workOrders || [];
  const rmas = ctx.qualityReturns || [];
  const telemetry = ctx.telemetry;

  // 1. Low stock / Safety buffer query
  if (lower.includes('buffer') || lower.includes('safety') || lower.includes('stock') || lower.includes('shortage') || lower.includes('reorder')) {
    const lowStockItems = skus.filter(s => s.current_stock <= s.min_threshold_alert);
    
    if (lowStockItems.length === 0) {
      return `### 📦 SKU Safety Buffer Status: Nominal\n\n` +
        `All active catalog items are currently operating **above their minimum safety thresholds**.\n\n` +
        `* **Total SKUs Tracked:** ${skus.length || 18}\n` +
        `* **Healthy Stock Ratio:** 100%\n` +
        `* **Total Inventory Valuation:** ₹${((telemetry?.inventoryHealth.totalStockValuation || 4850000) / 100000).toFixed(1)} Lakhs\n\n` +
        `**Recommendation:** Normal production dispatch cycle can proceed without procurement holds.`;
    }

    const itemsList = lowStockItems.slice(0, 4).map(s => 
      `* **${s.sku_code}** (${s.name}): Current stock is **${s.current_stock} ${s.unit_of_measure}** (Safety threshold: ${s.min_threshold_alert} ${s.unit_of_measure}). Deficit: **${(s.min_threshold_alert - s.current_stock).toFixed(1)} ${s.unit_of_measure}**.`
    ).join('\n');

    return `### ⚠️ Safety Buffer Deficit Analysis\n\n` +
      `ForgeAI has detected **${lowStockItems.length} SKU item(s)** below safety buffer reserves:\n\n` +
      `${itemsList}\n\n` +
      `**Immediate Operational Directives:**\n` +
      `1. Log a **Material Inward Movement** or issue an emergency purchase requisition to primary steel mills.\n` +
      `2. Verify whether any queued work orders require these specific alloys before releasing billets to roughing stands.\n` +
      `3. Staging buffer days remaining: **~1.8 production shifts**.`;
  }

  // 2. Quality RMAs / Discrepancies
  if (lower.includes('rma') || lower.includes('quality') || lower.includes('defect') || lower.includes('rejection') || lower.includes('scrap')) {
    const openRmas = rmas.filter(r => r.action_status === 'LOGGED' || r.action_status === 'INSPECTION_PENDING');
    const totalCredit = rmas.reduce((sum, r) => sum + Number(r.credit_note_value || 0), 0);
    const scrapCount = rmas.filter(r => r.action_status === 'SCRAPPED').length;

    return `### 🛡️ Quality Discrepancy & Rejection Summary\n\n` +
      `* **Active Open Cases:** ${openRmas.length} RMA(s) in quarantine evaluation.\n` +
      `* **Total Credited Settlement Value:** ₹${totalCredit.toLocaleString('en-IN')}\n` +
      `* **Scrapped Lots This Period:** ${scrapCount} unrecoverable batch lot(s).\n\n` +
      `**Key Flagged Deviations:**\n` +
      (openRmas.length > 0
        ? openRmas.slice(0, 3).map(r => `* **${r.rma_number}**: ${r.sku?.name || 'Structural Steel'} — *${r.reason_code.replace(/_/g, ' ')}* (${r.inspection_findings || 'Awaiting lab testing'})`).join('\n')
        : `* No pending quarantine holds recorded. Last flagged issue was dimensional tolerance variance on HEB 300 beams.`) +
      `\n\n**Recommended QA Action:** Expedite metallurgical tensile coupons in QA Lab Bay 3 and clear credit notes for verified fabricator claims.`;
  }

  // 3. Work Order Bottlenecks / Throughput
  if (lower.includes('bottleneck') || lower.includes('work order') || lower.includes('delay') || lower.includes('capacity') || lower.includes('throughput')) {
    const critical = workOrders.filter(w => w.priority === 'CRITICAL' && w.status !== 'FULFILLED');
    const inProduction = workOrders.filter(w => w.status === 'IN_PRODUCTION');

    return `### ⚙️ Floor Run Sequencing & Bottleneck Diagnosis\n\n` +
      `* **Active Batch Orders:** ${workOrders.length || 8} total orders in queue.\n` +
      `* **Runs In Floor Fabrication:** ${inProduction.length || 3} line(s) active on CNC plasma and hydraulic roll stands.\n` +
      `* **Critical Priority Escalations:** **${critical.length || 2} order(s)** requiring immediate shift prioritization.\n\n` +
      `**Identified Chokepoints:**\n` +
      `1. **Fabrication Bay 2 Cutting Table:** Heavy plate shearing is running at 94% capacity due to simultaneous beveling operations.\n` +
      `2. **Quarantine Staging:** Batch runs awaiting final ultrasonic weld inspection before transport dispatch.\n\n` +
      `**Suggested Action:** Resequence critical jobs to high-speed CNC Submerged Arc line and hold non-expedited standard runs until shift handover.`;
  }

  // 4. Shift Handover Brief
  if (lower.includes('shift') || lower.includes('handover') || lower.includes('brief') || lower.includes('summary')) {
    return `### 📋 Shift-A Handover Intelligence Brief\n\n` +
      `**Logged-In Supervisor:** ${operatorName} (${role.replace(/_/g, ' ')})\n` +
      `**Plant Velocity Index:** ${telemetry?.fulfillmentVelocityPercent || 88}% on-time dispatch SLA\n\n` +
      `**1. Floor Run Status:**\n` +
      `* Active Work Orders: **${telemetry?.activeWorkOrders.total || workOrders.length || 8}** (${telemetry?.activeWorkOrders.inProduction || 3} in production, ${telemetry?.activeWorkOrders.staged || 2} staged).\n` +
      `* Urgent batches due today: Order **WO-2026-089** (JSW Infra Structural Beams) at 75% completion.\n\n` +
      `**2. Critical Inventory Warnings:**\n` +
      `* ${telemetry?.inventoryHealth.stockoutRiskCount || 2} SKU(s) flagged at or below buffer reserves.\n\n` +
      `**3. Quality Quarantine:**\n` +
      `* Open RMAs: **${rmas.filter(r => r.action_status !== 'ACCEPTED_CREDITED').length || 2}** lot(s) under review.\n\n` +
      `**Shift-B Directive:** Re-verify CNC plasma calibration on Plate 25mm E350 and confirm flatbed crane availability for 16:30 dispatch.`;
  }

  // 5. General Fallback
  return `### 🤖 ForgeAI Assistant: Shift Operations Status\n\n` +
    `Hello **${operatorName}**, plant telemetry is synchronized. Here is an overview for your clearance level (**${role}**):\n\n` +
    `* **Active Orders on Floor:** ${workOrders.length || 8} batch runs (${workOrders.filter(w => w.priority === 'CRITICAL').length} marked CRITICAL).\n` +
    `* **Catalog Stock Health:** ${telemetry?.inventoryHealth.healthyStockCount || 16} / ${telemetry?.inventoryHealth.totalSkus || 18} SKUs nominal.\n` +
    `* **Monthly Output Tonnage:** ${(telemetry?.monthlyProductionThroughput?.[0]?.producedTonnage || 312)} MT fabricated of 350 MT target.\n\n` +
    `You can ask me to evaluate **safety buffer deficits**, **summarize open Quality RMAs**, **identify work order bottlenecks**, or **generate a shift handover brief**.`;
}

function deriveSuggestedActions(query: string): CopilotSuggestedAction[] {
  const lower = query.toLowerCase();
  if (lower.includes('stock') || lower.includes('buffer') || lower.includes('inventory')) {
    return [
      { label: 'View Low-Stock SKUs', targetPath: '/inventory' },
      { label: 'Log Material Inward', actionKey: 'LOG_INWARD' }
    ];
  }
  if (lower.includes('rma') || lower.includes('quality') || lower.includes('defect')) {
    return [
      { label: 'Open Quality RMA Console', targetPath: '/quality-returns' },
      { label: 'Log New Discrepancy', actionKey: 'NEW_RMA' }
    ];
  }
  if (lower.includes('work order') || lower.includes('bottleneck') || lower.includes('shift')) {
    return [
      { label: 'Manage Floor Queue', targetPath: '/work-orders' },
      { label: 'Inspect Telemetry', targetPath: '/dashboard' }
    ];
  }
  return [
    { label: 'Inspect Inventory', targetPath: '/inventory' },
    { label: 'Review Work Orders', targetPath: '/work-orders' }
  ];
}

// ============================================================================
// 2. QUALITY ROOT-CAUSE & CAPA ANALYZER
// ============================================================================

export async function analyzeQualityDefect(
  defectDescription: string,
  materialGrade?: string,
  reasonCode?: string
): Promise<QualityAnalysisResult> {
  const startTime = performance.now();

  // Attempt Live Gemini Analysis
  try {
    const systemPrompt = `You are an expert Metallurgical & Welding Quality Engineer for steel fabrication and manufacturing.
Analyze the user's recorded defect findings and return ONLY valid JSON matching this schema:
{
  "rootCause": "Clear explanation of metallurgical, tooling, or handling cause",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "recommendedCapa": "Specific Corrective and Preventive Action steps for shopfloor",
  "confidenceScore": number (e.g. 94)
}`;

    const userPrompt = `Material Grade: ${materialGrade || 'IS 2062 E250 / Structural Steel'}
Reason Code: ${reasonCode || 'DIMENSIONAL_OUT_OF_TOLERANCE'}
Defect Findings:
"${defectDescription || 'Web thickness variance and surface micro-cracking observed after cooling pass.'}"

Provide strictly formatted JSON.`;

    const rawResponse = await callGeminiApi(userPrompt, systemPrompt);
    const latencyMs = Math.round(performance.now() - startTime);

    // Parse JSON safely
    const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      rootCause: parsed.rootCause || 'Root cause determined by metallurgical model.',
      severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(parsed.severity) ? parsed.severity : 'HIGH',
      recommendedCapa: parsed.recommendedCapa || 'Quarantine lot and review welding procedure specification (WPS).',
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 93,
      meta: {
        mode: 'LIVE_AI',
        modelUsed: PRIMARY_MODEL,
        latencyMs
      }
    };
  } catch (error: any) {
    // Deterministic Heuristic Fallback
    const latencyMs = Math.round(performance.now() - startTime);
    const offlineReason = error?.message || 'Gemini API unreachable or timed out';
    const fallback = generateHeuristicQualityCapa(defectDescription, materialGrade, reasonCode);

    return {
      ...fallback,
      meta: {
        mode: 'OFFLINE_HEURISTIC_FALLBACK',
        latencyMs,
        offlineReason
      }
    };
  }
}

/**
 * Deterministic metallurgical & manufacturing heuristic rules
 */
function generateHeuristicQualityCapa(
  desc: string = '', 
  grade: string = 'IS 2062', 
  reasonCode: string = ''
): Omit<QualityAnalysisResult, 'meta'> {
  const text = (desc + ' ' + reasonCode + ' ' + grade).toLowerCase();

  // 1. Dimensional / Thickness / Tolerance
  if (text.includes('dimension') || text.includes('thickness') || text.includes('tolerance') || text.includes('mm') || text.includes('flange') || text.includes('web') || text.includes('gauge')) {
    return {
      rootCause: `Roll pass wear and guide misalignment on finishing stand #4 during continuous hot-rolling, causing cross-sectional web/flange deviation exceeding IS 808 tolerance limits.`,
      severity: 'HIGH',
      recommendedCapa: `1. Quarantine the affected heat lot in Bay-QC. 2. Halt rolling line and recalibrate laser thickness calipers & roughing roll screwdowns. 3. Perform 100% dial gauge inspection on preceding 5 billets. 4. Authorize milling rework if thickness is salvageable above minimum design threshold.`,
      confidenceScore: 94
    };
  }

  // 2. Cracks / Brittleness / Chemistry / Tensile / Inclusions
  if (text.includes('crack') || text.includes('brittle') || text.includes('fracture') || text.includes('carbon') || text.includes('sulfur') || text.includes('inclusion') || text.includes('tensile') || text.includes('yield')) {
    return {
      rootCause: `Excessive non-metallic inclusions and accelerated cooling rate through the austenite-ferrite transformation window, inducing thermal micro-stress and brittle martensitic grain boundary segregation.`,
      severity: 'CRITICAL',
      recommendedCapa: `1. Issue immediate Quarantine Scrap Hold. 2. Extract metallurgical coupon and perform optical emission spectroscopy (OES) + Charpy V-notch impact test. 3. Dispatch formal Non-Conformance Report (NCR) to primary billet supplier. 4. Adjust cooling bed conveyor velocity to achieve controlled normalization.`,
      confidenceScore: 96
    };
  }

  // 3. Surface finish / Rust / Paint / Pitting / Blistering
  if (text.includes('rust') || text.includes('surface') || text.includes('paint') || text.includes('pitting') || text.includes('corrosion') || text.includes('scale') || text.includes('blister')) {
    return {
      rootCause: `Inadequate shot-blasting surface profile (< SA 2.5) combined with high ambient humidity during the intermediate primer flash-off period, resulting in premature intercoat adhesion failure.`,
      severity: 'MEDIUM',
      recommendedCapa: `1. Re-blast structural members with steel grit G40 to achieve 50–70 micron anchor profile. 2. Check ambient shopfloor dew point prior to re-coating (mandate surface temperature >= 3°C above dew point). 3. Apply 75µm two-pack zinc phosphate epoxy primer under calibrated wet-film gauge monitoring.`,
      confidenceScore: 92
    };
  }

  // 4. Transit / Rigging / Handling / Bend
  if (text.includes('transit') || text.includes('bend') || text.includes('dent') || text.includes('rigging') || text.includes('handling') || text.includes('crane') || text.includes('trailer')) {
    return {
      rootCause: `Improper wooden dunnage support spacing (>2.5m span) and dynamic shock loading during flatbed trailer road transport, causing camber deflection and mechanical flange distortion.`,
      severity: 'MEDIUM',
      recommendedCapa: `1. Hydraulic cold-straightening under certified press brake with deflection dial indicators. 2. Revise Dispatch Standard Operating Procedure (SOP): enforce 1.5m maximum dunnage spacing with rubber edge corner guards and heavy-duty ratchet webbing.`,
      confidenceScore: 89
    };
  }

  // General default fallback
  return {
    rootCause: `Mechanical tooling deflection and localized thermal accumulation under sustained high-feed machining duty cycle, leading to off-spec physical tolerances.`,
    severity: 'MEDIUM',
    recommendedCapa: `1. Inspect CNC tooling insert wear and spindle runout. 2. Increase synthetic coolant delivery flow by 20%. 3. Perform first-piece CMM dimensional verification before clearing the batch run.`,
    confidenceScore: 88
  };
}

// ============================================================================
// 3. PREDICTIVE SHIFT INSIGHTS
// ============================================================================

export async function generateShiftInsights(
  telemetryContext?: OperationsTelemetry | object
): Promise<ShiftInsightsResult> {
  const startTime = performance.now();
  const store = useForgeflowStore.getState();
  const telemetry = (telemetryContext as OperationsTelemetry) || store.telemetry;

  // Attempt Live Gemini Insights
  try {
    const systemPrompt = `You are ForgeAI, an industrial predictive analytics agent for ForgeFlow MOM/MES.
Given current plant telemetry and inventory metrics, generate exactly 3 prioritized operational alerts:
1. One INVENTORY_RISK alert
2. One QA_ALERT alert
3. One THROUGHPUT_TIP alert

Return strictly JSON matching:
{
  "insights": [
    {
      "id": "insight-1",
      "category": "INVENTORY_RISK",
      "title": "Concise risk title",
      "description": "2 sentence explanation with metric reference",
      "severity": "CRITICAL" | "WARN" | "INFO",
      "actionableStep": "Exact operational command"
    },
    ...
  ]
}`;

    const userPrompt = `CURRENT PLANT TELEMETRY:
${JSON.stringify(telemetry || {
  activeWorkOrders: { total: 8, inProduction: 3, staged: 2, criticalPriority: 2 },
  fulfillmentVelocityPercent: 88,
  inventoryHealth: { totalSkus: 18, stockoutRiskCount: 2, healthyStockCount: 16, totalStockValuation: 4850000 },
  monthlyProductionThroughput: [{ period: 'Oct 2026', producedTonnage: 312, targetTonnage: 350 }]
}, null, 2)}

Generate 3 prioritized shift insights in JSON.`;

    const rawResponse = await callGeminiApi(userPrompt, systemPrompt);
    const latencyMs = Math.round(performance.now() - startTime);

    const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (Array.isArray(parsed.insights) && parsed.insights.length >= 3) {
      return {
        insights: parsed.insights.slice(0, 3),
        meta: {
          mode: 'LIVE_AI',
          modelUsed: PRIMARY_MODEL,
          latencyMs
        }
      };
    }
    throw new Error('Invalid JSON structure returned by Gemini.');
  } catch (error: any) {
    // Deterministic Heuristic Fallback
    const latencyMs = Math.round(performance.now() - startTime);
    const offlineReason = error?.message || 'Gemini API unreachable or timed out';
    const fallbackInsights = generateHeuristicShiftInsights(telemetry);

    return {
      insights: fallbackInsights,
      meta: {
        mode: 'OFFLINE_HEURISTIC_FALLBACK',
        latencyMs,
        offlineReason
      }
    };
  }
}

/**
 * Deterministic heuristic insights generator
 */
function generateHeuristicShiftInsights(telemetry?: OperationsTelemetry | null): ShiftInsight[] {
  const stockoutRiskCount = telemetry?.inventoryHealth?.stockoutRiskCount ?? 2;
  const criticalOrdersCount = telemetry?.activeWorkOrders?.criticalPriority ?? 2;
  const velocity = telemetry?.fulfillmentVelocityPercent ?? 88;

  return [
    {
      id: 'insight-inv-1',
      category: 'INVENTORY_RISK',
      title: stockoutRiskCount > 0 ? 'Raw Steel Billet Buffer Below 48h SLA' : 'Catalog Reserves Nominal',
      description: stockoutRiskCount > 0
        ? `${stockoutRiskCount} primary structural SKU categories are operating at or below critical buffer thresholds, creating an imminent fabrication starvation risk.`
        : 'All 18 SKU categories maintain safe inventory buffers for the upcoming 72 hours of scheduled fabrication.',
      severity: stockoutRiskCount > 0 ? 'CRITICAL' : 'INFO',
      actionableStep: stockoutRiskCount > 0
        ? 'Issue emergency indent to primary stockyards or transfer coils from auxiliary yard.'
        : 'Maintain standard weekly reorder cadence.',
      targetPath: '/inventory'
    },
    {
      id: 'insight-qa-2',
      category: 'QA_ALERT',
      title: 'Quarantine RMA Verification Pending in Lab',
      description: 'Multiple fabricated lot samples in Bay-3 require ultrasonic non-destructive testing (NDT) to prevent dispatch hold escalations.',
      severity: 'WARN',
      actionableStep: 'Direct Quality Inspector to clear pending metallurgical certificates before 14:00 logistics dispatch cut-off.',
      targetPath: '/quality-returns'
    },
    {
      id: 'insight-tp-3',
      category: 'THROUGHPUT_TIP',
      title: `Fabrication Bay Throughput: ${velocity}% Target Velocity`,
      description: criticalOrdersCount > 0 
        ? `${criticalOrdersCount} critical-priority batch run(s) are queued behind standard orders on CNC Line 1, risking on-time penalty clauses.`
        : 'Production velocity is tracking cleanly toward the 350 Metric Tonne monthly target.',
      severity: criticalOrdersCount > 0 ? 'WARN' : 'INFO',
      actionableStep: criticalOrdersCount > 0
        ? 'Resequence floor priority queue to expedite critical batch cutting before standard structural runs.'
        : 'Continue dual-shift cutting schedule across primary plasma bays.',
      targetPath: '/work-orders'
    }
  ];
}

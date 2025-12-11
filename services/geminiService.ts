import { GoogleGenAI } from "@google/genai";
import { Equipment } from "../types";

const apiKey = process.env.API_KEY || '';

// We use gemini-2.5-flash for fast, responsive text advice
const MODEL_NAME = 'gemini-2.5-flash';

export const getMaintenanceAdvice = async (query: string, equipmentContext?: Equipment[]) => {
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  
  let contextStr = "";
  if (equipmentContext && equipmentContext.length > 0) {
    contextStr = `
    Context - Current Equipment List:
    ${JSON.stringify(equipmentContext.map(e => ({ name: e.name, type: e.type, lubricant: e.lubricant, nextDue: e.nextLubricated })))}
    `;
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `用户问题: ${query}\n${contextStr}`,
    config: {
      systemInstruction: "你是一位精通摩擦学和润滑可靠性的工业维护专家。请用中文提供简洁、可操作的建议。如果用户询问上下文中提到的特定设备，请分析提供的数据。"
    }
  });

  return response.text;
};

export const analyzeSchedule = async (equipment: Equipment[]) => {
  if (!apiKey) return "API Key missing";

  const ai = new GoogleGenAI({ apiKey });

  const overdue = equipment.filter(e => {
    const today = new Date().toISOString().split('T')[0];
    return e.nextLubricated < today;
  });

  const prompt = `
  分析以下润滑状态:
  设备总数: ${equipment.length}
  逾期设备数: ${overdue.length}
  逾期详情: ${JSON.stringify(overdue.map(e => ({ name: e.name, daysOverdue: e.nextLubricated })))}
  
  请提供一份简短的、分条列出的行政摘要，评估风险等级并提出建议的立即采取措施。请用中文回答。
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });

  return response.text;
}
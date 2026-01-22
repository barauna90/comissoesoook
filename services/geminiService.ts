
import { GoogleGenAI } from "@google/genai";
import { Commission, Installment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialInsights = async (commissions: Commission[], installments: Installment[]) => {
  const prompt = `
    Analise os seguintes dados de comissões de um vendedor:
    Comissões: ${JSON.stringify(commissions)}
    Parcelas: ${JSON.stringify(installments)}
    
    Por favor, forneça um breve resumo (máximo 3 parágrafos) sobre a saúde financeira do vendedor, 
    destacando meses de pico, riscos de inadimplência (se houver muitas parcelas pendentes antigas) 
    e uma dica estratégica para aumentar o faturamento. Use um tom profissional e encorajador, como um consultor financeiro de banco.
    Responda em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Não foi possível gerar insights no momento. Tente novamente mais tarde.";
  }
};

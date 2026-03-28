import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { Bill } from '@/app/types';
import { v4 as uuidv4 } from 'uuid';

// Define the Schema for the LLM to strictly follow
const LineItemSchema = z.object({
    description: z.string(),
    code: z.string().optional(),
    date: z.string().optional(),
    amount: z.number(),
});

const BillSchema = z.object({
    providerName: z.string(),
    patientName: z.string().optional(),
    billDate: z.string().optional(),
    totalBilled: z.number(),
    lineItems: z.array(LineItemSchema),
});

// Define Issue Schema for AI Auto-Detection
const IssueSchema = z.object({
    type: z.enum(['DUPLICATE', 'UPCODING', 'UNBUNDLING', 'CODING_ERROR', 'OTHER']),
    confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    explanation: z.string(),
    savingsPotential: z.number(),
});

const AnalysisSchema = z.object({
    issues: z.array(IssueSchema)
});

export class LLMService {
    private openai: OpenAI | null = null;

    constructor() {
        // Only initialize if key exists
        const key = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
        if (key) {
            this.openai = new OpenAI({
                apiKey: key,
                dangerouslyAllowBrowser: true
            });
        } else {
            console.warn("⚠️ LLMService: No OpenAI API Key found. AI features will be disabled.");
        }
    }

    // ... parseBill ...

    async parseBill(rawText: string, fileName: string): Promise<Partial<Bill> | null> {
        if (!this.openai) return null;

        try {
            // Cast to any to bypass Beta type definition mismatch in editor
            const completion = await (this.openai as any).beta.chat.completions.parse({
                model: "gpt-4o-2024-08-06",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert Medical Bill Auditor. Extract structured data from the OCR text of a medical bill. Be precise with amounts and codes. If a CPT code is missing but implied by the description, try to infer it or leave empty if unsure."
                    },
                    {
                        role: "user",
                        content: rawText
                    },
                ],
                response_format: zodResponseFormat(BillSchema, "bill_analysis"),
            });
            const extracted = completion.choices[0].message.parsed;
            if (!extracted) return null;

            return {
                providerName: extracted.providerName,
                patientName: extracted.patientName,
                billDate: extracted.billDate,
                totalBilled: extracted.totalBilled,
                lineItems: extracted.lineItems.map((item: any) => ({
                    id: uuidv4(),
                    description: item.description,
                    code: item.code || 'UNKNOWN',
                    date: item.date || extracted.billDate || new Date().toISOString(),
                    quantity: 1,
                    amountBilled: item.amount
                }))
            };
        } catch (e) {
            console.error("LLM Extraction Failed:", e);
            return null;
        }
    }

    async analyzeErrors(bill: Bill): Promise<import('@/app/types').Issue[]> {
        if (!this.openai) return [];

        try {
            // Prepare a simplified context for the AI
            const billContext = JSON.stringify({
                provider: bill.providerName,
                total: bill.totalBilled,
                lines: bill.lineItems.map(l => ({
                    desc: l.description,
                    code: l.code,
                    amount: l.amountBilled
                }))
            });

            const completion = await (this.openai as any).beta.chat.completions.parse({
                model: "gpt-4o-2024-08-06",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert Medical Bill Auditor. Analyze the provided bill data for errors. specific focus: 1. Upcoding (e.g. Level 5 ER code 99285 for minor descriptions). 2. Unbundling (charging for parts of a procedure that should be included). 3. Excessive charges compared to standard Medicare rates. Return a list of issues found."
                    },
                    {
                        role: "user",
                        content: billContext
                    },
                ],
                response_format: zodResponseFormat(AnalysisSchema, "bill_analysis_issues"),
            });

            const extracted = completion.choices[0].message.parsed;
            if (!extracted) return [];

            return extracted.issues.map((iss: any) => ({
                id: uuidv4(),
                type: iss.type,
                confidence: iss.confidence,
                explanation: iss.explanation,
                evidence: ["AI Detected based on code/description mismatch"],
                savingsPotential: iss.savingsPotential
            }));

        } catch (error) {
            console.error("LLM Analysis Failed:", error);
            return [];
        }
    }
}

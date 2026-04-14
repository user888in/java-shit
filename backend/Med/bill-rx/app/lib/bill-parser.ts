import { Bill, BillLineItem } from '@/app/types';
import { v4 as uuidv4 } from 'uuid';
import { LLMService } from './llm-service';

export class BillParser {
    // In a real app, this would use AI/LLM or advanced regex patterns.
    // For MVP with MockOCR, we use a targeted deterministic parser for our specific mock format.

    async parse(rawText: string, fileName: string): Promise<Bill> {
        // 1. Try LLM Extraction (The Brain)
        try {
            const llm = new LLMService();
            const intelligentParse = await llm.parseBill(rawText, fileName);

            if (intelligentParse) {
                // Merge with required fields
                return {
                    id: uuidv4(),
                    fileName,
                    uploadDate: new Date().toISOString(),
                    rawText,
                    // Ensure required fields exist (LLM returns Partial)
                    providerName: intelligentParse.providerName || 'Unknown Provider',
                    patientName: intelligentParse.patientName,
                    billDate: intelligentParse.billDate || new Date().toISOString(),
                    totalBilled: intelligentParse.totalBilled || 0,
                    lineItems: intelligentParse.lineItems || []
                };
            }
        } catch (e) {
            console.warn("LLM Parse failed, falling back to regex engine:", e);
        }

        // 2. Fallback: Heuristic Regex Parser (The Old Way)
        const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

        const bill: Bill = {
            id: uuidv4(),
            fileName,
            uploadDate: new Date().toISOString(),
            lineItems: [],
            rawText: rawText,
        };

        // ... (Keep existing regex logic below for safety) ...
        const providerLine = lines.find(l => l.toUpperCase().includes('HOSPITAL') || l.toUpperCase().includes('CLINIC'));
        if (providerLine) bill.providerName = providerLine;

        const patientLine = lines.find(l => l.startsWith('PATIENT:'));
        if (patientLine) bill.patientName = patientLine.replace('PATIENT:', '').trim();

        const dateLine = lines.find(l => l.startsWith('DATE:') || l.includes('/20'));
        if (dateLine) {
            const dateMatch = dateLine.match(/\d{2}\/\d{2}\/\d{4}/);
            if (dateMatch) bill.billDate = dateMatch[0];
        }

        // Line Item Extraction
        let inLineSection = false;
        for (const line of lines) {
            if (line.startsWith('TOTAL CHARGES:')) {
                const amountStr = line.replace('TOTAL CHARGES:', '').trim();
                bill.totalBilled = parseFloat(amountStr.replace(/[$,]/g, ''));
                inLineSection = false;
                continue;
            }

            if (line.includes('DESCRIPTION') && line.includes('AMOUNT')) {
                inLineSection = true;
                continue;
            }
            if (line.startsWith('------')) continue;

            if (inLineSection) {
                const match = line.match(/^(.+?)\s+([A-Z0-9]{5})\s+(\d{2}\/\d{2}\/\d{4})\s+(\$[\d,]+\.\d{2})/);
                if (match) {
                    const [, desc, code, date, amountStr] = match;
                    const amount = parseFloat(amountStr.replace(/[$,]/g, ''));
                    bill.lineItems.push({
                        id: uuidv4(),
                        description: desc.trim(),
                        code,
                        date,
                        quantity: 1,
                        amountBilled: amount,
                    });
                }
            }
        }

        return bill;
    }
}

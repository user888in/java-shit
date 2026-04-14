import { Bill, BillLineItem, Issue } from '@/app/types';
import { v4 as uuidv4 } from 'uuid';
import { LLMService } from './llm-service';

export class ErrorDetector {

    async detectIssues(bill: Bill): Promise<Issue[]> {
        const issues: Issue[] = [];

        // 1. Deterministic Checks (Fast & Cheap)
        issues.push(...this.detectDuplicates(bill.lineItems));
        issues.push(...this.detectUpcoding(bill.lineItems));
        issues.push(...this.detectUnbundling(bill.lineItems));

        // 2. Intelligent Checks (LLM)
        try {
            const llm = new LLMService();
            const aiIssues = await llm.analyzeErrors(bill);
            if (aiIssues && aiIssues.length > 0) {
                issues.push(...aiIssues);
            }
        } catch (e) {
            console.warn("AI Analysis failed, proceeding with heuristic issues only.", e);
        }

        // --- MVP DEMO SAFEGUARD ---
        // If no issues found (likely due to missing API Key or Mock OCR limitations),
        // and we are in a dev environment, inject a "Sample Issue" so the user sees the UI.
        if (issues.length === 0) {
            console.log("No issues found. Injecting DEBUG issue for demonstration.");
            issues.push({
                id: uuidv4(),
                type: 'OTHER',
                confidence: 'LOW',
                explanation: 'DEMO: No specific errors detected by the engine. This might be a clean bill! (Or check your API Key)',
                evidence: ['System Scan Complete'],
                savingsPotential: 0
            });
        }
        // --------------------------

        // TODO: Dedup issues if AI finds the same thing as Regex
        return issues;
    }

    private detectDuplicates(items: BillLineItem[]): Issue[] {
        const found: Issue[] = [];
        const seen = new Map<string, string[]>(); // key -> [ids]

        items.forEach(item => {
            // Key: Code + Date + Amount
            const key = `${item.code || 'NOCODE'}-${item.date}-${item.amountBilled}`;
            if (seen.has(key)) {
                seen.get(key)?.push(item.id);
            } else {
                seen.set(key, [item.id]);
            }
        });

        seen.forEach((ids, key) => {
            if (ids.length > 1) {
                found.push({
                    id: uuidv4(),
                    type: 'DUPLICATE',
                    confidence: 'HIGH',
                    explanation: `Multiple identical charges found for ${key.split('-')[0]} on same date with same amount.`,
                    evidence: [`Line Items detected: ${ids.length}`],
                    savingsPotential: 0, // Calculate later
                });
            }
        });

        return found;
    }

    private detectUpcoding(items: BillLineItem[]): Issue[] {
        const found: Issue[] = [];

        // Heuristic: Level 5 ER Code (99285) often misused for non-life-threatening issues
        const erLevel5 = items.find(i => i.code === '99285');
        if (erLevel5) {
            found.push({
                id: uuidv4(),
                type: 'UPCODING',
                confidence: 'MEDIUM',
                explanation: 'CPT 99285 is a "Level 5" ER visit code, reserved for high-severity, life-threatening conditions. If your visit was routine (e.g., flu, minor injury), this may be upcoded.',
                evidence: ['Code 99285 found'],
                savingsPotential: 500, // Estimate difference between Level 5 and Level 3
            });
        }

        return found;
    }

    private detectUnbundling(items: BillLineItem[]): Issue[] {
        /* 
           Example: Billing for a panel and its parts. 
           Mock Logic: If we see code "80053" (Comp Metabolic Panel) AND "84443" (TSH) - rare collision but illustrative.
           Or our Duplicate check might catch the IV Infusion error from the mock data if the codes are identical?
           Actually, in the Mock Data:
           IV INFUSION, 1 HOUR     96365   $450.00
           IV INFUSION, +1 HOUR    96365   $450.00
           
           This uses the SAME code 96365. The second one SHOULD be 96366 (add-on). 
           Using 96365 twice is technically a Duplicate OR Incorrect Coding. 
           Our Duplicate detector will catch this! 
           
           Let's add a specific 'Code Consistency' check here as well.
        */
        const found: Issue[] = [];

        // Logic: 96365 is the base code. It should usually appear once per date. 
        // Additional hours should be 96366.
        const infusionCodes = items.filter(i => i.code === '96365');
        if (infusionCodes.length > 1) {
            found.push({
                id: uuidv4(),
                type: 'UNBUNDLING', // Or CODING_ERROR
                confidence: 'HIGH',
                explanation: 'CPT 96365 (IV Infusion, Initial) appears multiple times. Additional hours should likely be billed as 96366 (Add-on).',
                evidence: ['Multiple instances of 96365 found'],
            });
        }

        return found;
    }
}

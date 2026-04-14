import { OCRService } from './ocr-service';

export class MockOCRService implements OCRService {
    async extractText(file: File): Promise<string> {
        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Return sample bill text (mimicking raw OCR output)
        return `
      MERCY GENERAL HOSPITAL
      123 HEALING WAY
      CITY, STATE, 90210
      
      PATIENT: JANE DOE
      ACCOUNT: 100055522
      DATE: 01/15/2025
      
      DESCRIPTION             CPT     DATE        AMOUNT
      --------------------------------------------------
      EMERGENCY DEPT VISIT    99285   01/15/2025  $3,500.00
      IV INFUSION, 1 HOUR     96365   01/15/2025  $450.00
      IV INFUSION, +1 HOUR    96365   01/15/2025  $450.00
      CT SCAN HEAD/BRAIN      70450   01/15/2025  $2,200.00
      TYLENOL 500MG           A9150   01/15/2025  $15.00
      
      TOTAL CHARGES: $6,615.00
      INSURANCE ADJ: $0.00
      PATIENT OWES:  $6,615.00
    `;
    }
}

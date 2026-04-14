import jsPDF from 'jspdf';
import { Bill, Issue } from '@/app/types';

export const MANDATORY_DISCLAIMER = "DISCLAIMER: This document was generated using automated analysis and is intended for informational purposes only. It does not constitute legal, medical, or financial advice. The user is responsible for validating all claims before submission. BillRx and its affiliates are not liable for errors or omissions.";

export class PDFGenerator {
    generateDisputeLetter(bill: Bill, issue: Issue): void {
        const doc = new jsPDF();
        const margin = 20;
        let yPos = 20;

        // Header
        doc.setFontSize(16);
        doc.text("Medical Bill Dispute Inquiry", margin, yPos);
        yPos += 15;

        // Metada
        doc.setFontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPos);
        yPos += 10;
        doc.text(`Provider: ${bill.providerName || 'Unknown Provider'}`, margin, yPos);
        yPos += 10;
        doc.text(`Bill Ref/Account: ${bill.id.substring(0, 8)}...`, margin, yPos); // Mock account ref
        yPos += 20;

        // Body
        doc.setFontSize(12);
        const bodyText = `To the Billing Department,\n\nI am writing to dispute a charge on my recent bill (Service Date: ${bill.billDate || 'N/A'}).\n\nIssue Detected: ${issue.type}\n\nExplanation: ${issue.explanation}\n\nPlease review this charge against standard billing guidelines and provide an itemized explanation or adjustment.\n\nSincerely,\n${bill.patientName || '[Your Name]'}`;

        const splitBody = doc.splitTextToSize(bodyText, 170); // Wrap text
        doc.text(splitBody, margin, yPos);

        // Footer / Disclaimer (Safety Layer)
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(150);
        const disclaimerSplit = doc.splitTextToSize(MANDATORY_DISCLAIMER, 170);
        doc.text(disclaimerSplit, margin, pageHeight - 20);

        // Save
        doc.save(`Dispute_Letter_${bill.id.substring(0, 6)}.pdf`);
    }
}

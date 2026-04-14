import { OCRService } from './ocr-service';
import { createWorker } from 'tesseract.js';

export class TesseractOCRService implements OCRService {
    async extractText(file: File): Promise<string> {
        const worker = await createWorker('eng');

        try {
            const ret = await worker.recognize(file);
            const text = ret.data.text;
            return text;
        } catch (error) {
            console.error("Tesseract OCR Error:", error);
            throw new Error("Failed to extract text from image.");
        } finally {
            await worker.terminate();
        }
    }
}

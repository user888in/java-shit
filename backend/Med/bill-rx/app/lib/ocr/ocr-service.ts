export interface OCRService {
    extractText(file: File): Promise<string>;
}

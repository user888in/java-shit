'use client';

import * as React from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Card } from './ui/card';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    isProcessing?: boolean;
}

export function FileUpload({ onFileSelect, isProcessing }: FileUploadProps) {
    const [dragActive, setDragActive] = React.useState(false);
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const validateFile = (file: File) => {
        // 10MB Limit
        if (file.size > 10 * 1024 * 1024) {
            setError("File is too large (Max 10MB)");
            return false;
        }
        // Type check (Images/PDF)
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
            setError("Invalid file type. Please upload PDF, JPG, or PNG.");
            return false;
        }
        return true;
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        setError(null);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
                onFileSelect(file);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
                onFileSelect(file);
            }
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <Card
                className={cn(
                    "relative flex flex-col items-center justify-center p-10 border-2 border-dashed transition-all duration-200 ease-in-out cursor-pointer",
                    dragActive ? "border-primary bg-primary/5" : "border-zinc-200 hover:border-primary/50 hover:bg-zinc-50",
                    isProcessing ? "opacity-50 pointer-events-none" : ""
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload-input')?.click()}
            >
                <input
                    id="file-upload-input"
                    type="file"
                    className="hidden"
                    onChange={handleChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={isProcessing}
                />

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <UploadCloud className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900">Upload Medical Bill</h3>
                        <p className="text-sm text-zinc-500 mt-1">
                            Drag & drop or click to browse
                        </p>
                    </div>
                    <p className="text-xs text-zinc-400">
                        PDF, JPG, PNG (Max 10MB)
                    </p>
                </div>

                {selectedFile && !error && (
                    <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center z-10 p-6 rounded-lg backdrop-blur-sm">
                        <FileText className="w-10 h-10 text-primary mb-2" />
                        <p className="font-medium text-sm text-center truncate w-full px-4">{selectedFile.name}</p>
                        <p className="text-xs text-zinc-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {isProcessing && <p className="text-sm text-primary mt-4 font-medium animate-pulse">Analyzing...</p>}
                    </div>
                )}
            </Card>

            {error && (
                <p className="mt-3 text-sm text-red-500 text-center flex items-center justify-center gap-2">
                    <X className="w-4 h-4" /> {error}
                </p>
            )}
        </div>
    );
}

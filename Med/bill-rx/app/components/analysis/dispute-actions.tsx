import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { MANDATORY_DISCLAIMER } from '@/app/lib/pdf-generator';
import { Download } from 'lucide-react';

interface DisputeActionsProps {
    onGenerate: () => void;
    isGenerating?: boolean;
}

export function DisputeActions({ onGenerate, isGenerating }: DisputeActionsProps) {
    return (
        <Card className="bg-zinc-900 text-zinc-100 border-zinc-800 mt-8">
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold text-white">Generate Dispute Letters</h3>
                    <p className="text-zinc-400 text-sm">
                        Download a professionally formatted dispute letter for this issue.
                        Simply print, sign, and mail it to your provider.
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-2 leading-tight opacity-70">
                        {MANDATORY_DISCLAIMER}
                    </p>
                </div>
                <Button
                    size="lg"
                    variant="default" // Using default primary style (white on blue probably? Wait, primary in dark mode is blue)
                    className="shrink-0 bg-white text-black hover:bg-zinc-200 font-semibold"
                    onClick={onGenerate}
                    disabled={isGenerating}
                >
                    {isGenerating ? 'Generating...' : (
                        <>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}

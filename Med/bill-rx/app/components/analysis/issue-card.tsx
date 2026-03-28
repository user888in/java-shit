import { Issue, ConfidenceLevel } from '@/app/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface IssueCardProps {
    issue: Issue;
}

const ConfidenceBadge = ({ level }: { level: ConfidenceLevel }) => {
    const colors = {
        HIGH: 'bg-red-100 text-red-700 border-red-200',
        MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
        LOW: 'bg-blue-100 text-blue-700 border-blue-200',
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[level]} inline-flex items-center gap-1`}>
            {level === 'HIGH' && <AlertCircle className="w-3 h-3" />}
            {level === 'MEDIUM' && <AlertTriangle className="w-3 h-3" />}
            {level === 'LOW' && <Info className="w-3 h-3" />}
            {level} CONFIDENCE
        </span>
    );
};

export function IssueCard({ issue }: IssueCardProps) {
    return (
        <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                        {issue.type.replace(/_/g, ' ')}
                    </CardTitle>
                    <ConfidenceBadge level={issue.confidence} />
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-base text-zinc-700 leading-relaxed mb-3">
                    {issue.explanation}
                </p>

                {issue.evidence.length > 0 && (
                    <div className="bg-zinc-50 p-3 rounded-md text-sm text-zinc-600">
                        <p className="font-semibold text-zinc-900 text-xs uppercase tracking-wider mb-2">Evidence detected:</p>
                        <ul className="list-disc list-inside space-y-1">
                            {issue.evidence.map((ev, i) => (
                                <li key={i}>{ev}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {issue.savingsPotential && issue.savingsPotential > 0 && (
                    <div className="mt-4 flex items-center text-green-700 font-medium">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Potential Savings: ${issue.savingsPotential.toFixed(2)}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

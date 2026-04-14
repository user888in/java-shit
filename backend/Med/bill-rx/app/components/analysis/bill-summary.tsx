import { Bill } from '@/app/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface BillSummaryProps {
    bill: Bill;
}

export function BillSummary({ bill }: BillSummaryProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-sm text-zinc-500 font-medium">Provider</p>
                        <p className="text-lg font-semibold">{bill.providerName || 'Unknown'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500 font-medium">Date of Service</p>
                        <p className="text-lg font-semibold">{bill.billDate || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500 font-medium">Patient</p>
                        <p className="font-medium">{bill.patientName || 'Unknown'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500 font-medium">Total Billed</p>
                        <p className="text-2xl font-bold text-zinc-900">
                            {bill.totalBilled
                                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(bill.totalBilled)
                                : '--'}
                        </p>
                    </div>
                </div>

                <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-100 text-zinc-600 font-medium border-b">
                            <tr>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Code</th>
                                <th className="px-4 py-2">Description</th>
                                <th className="px-4 py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {bill.lineItems.map(item => (
                                <tr key={item.id} className="hover:bg-zinc-50">
                                    <td className="px-4 py-2">{item.date}</td>
                                    <td className="px-4 py-2 font-mono text-zinc-500">{item.code || '-'}</td>
                                    <td className="px-4 py-2">{item.description}</td>
                                    <td className="px-4 py-2 text-right">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amountBilled)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

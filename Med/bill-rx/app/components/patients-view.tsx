import { GlassCard } from "./ui/glass-card";
import { MOCK_PATIENTS } from "@/app/lib/mock-data";
import { User, Plus, MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";

export function PatientsView() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Patients</h2>
                    <p className="text-slate-400">Manage family members and insurance profiles.</p>
                </div>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 shadow-blue-900/20 border border-blue-400/20">
                    <Plus className="w-4 h-4" /> Add Patient
                </Button>
            </div>

            <GlassCard className="overflow-hidden p-0 bg-slate-900/40 border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="bg-slate-800/50 text-slate-300 font-medium border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Date of Birth</th>
                                <th className="px-6 py-4">Insurance Provider</th>
                                <th className="px-6 py-4">Policy Number</th>
                                <th className="px-6 py-4">Last Visit</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {MOCK_PATIENTS.map((patient) => (
                                <tr key={patient.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 border border-white/10 shadow-sm">
                                            <User className="w-4 h-4" />
                                        </div>
                                        {patient.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{patient.dob}</td>
                                    <td className="px-6 py-4 text-white font-medium">{patient.insurance}</td>
                                    <td className="px-6 py-4 font-mono text-slate-500">{patient.policy}</td>
                                    <td className="px-6 py-4 text-slate-500">{patient.lastVisit}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-slate-800">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}

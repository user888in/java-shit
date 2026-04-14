'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppState, Bill, Issue } from '@/app/types';
import { FileUpload } from './components/file-upload';
import { TesseractOCRService } from './lib/ocr/tesseract-service';
import { BillParser } from './lib/bill-parser';
import { ErrorDetector } from './lib/error-detector';
import { PDFGenerator, MANDATORY_DISCLAIMER } from './lib/pdf-generator';
import { BillSummary } from './components/analysis/bill-summary';
import { IssueCard } from './components/analysis/issue-card';
import { DisputeActions } from './components/analysis/dispute-actions';
import { DashboardView } from './components/dashboard-view';
import { PaywallModal } from './components/paywall-modal';
import { GlassCard } from './components/ui/glass-card';
import { Button } from './components/ui/button';
import { Sidebar } from './components/ui/sidebar';
import { DatabaseService } from '@/app/lib/db/database-service';
import { ArrowLeft, CheckCircle2, Loader2, Sparkles, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { PlaceholderView } from './components/placeholder-view';
import { PatientsView } from './components/patients-view';
import { ReportsView } from './components/reports-view';
import { SettingsView } from './components/settings-view';
import { ClaimsView } from './components/claims-view';

// Extended State including Sidebar Views
type ViewState = AppState | 'PAYWALL' | 'DASHBOARD' | 'PATIENTS' | 'REPORTS' | 'SETTINGS' | 'CLAIMS';

function MainContent() {
  // Logic Instances (Memoized or outside component in real app, here simple is fine)
  const ocrService = new TesseractOCRService();
  const parser = new BillParser();
  const detector = new ErrorDetector();
  const pdfGenerator = new PDFGenerator();

  const [state, setState] = useState<ViewState>('DASHBOARD');
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const searchParams = useSearchParams();

  // Sync State with URL Params
  useEffect(() => {
    const view = searchParams.get('view');
    const success = searchParams.get('success');

    // Handle Payment Success
    if (success === 'true' && searchParams.get('billId')) {
      const billId = searchParams.get('billId');
      // Attempt to reload logic...
      const db = new DatabaseService();
      db.getHistory().then(history => {
        const found = history.find(i => i.bill.id === billId);
        if (found) {
          setCurrentBill(found.bill);
          setIssues(found.issues);
          setState('REVIEW');
        }
      });
      return; // Skip other view logic
    }

    // Handle View Switching
    if (view === 'dashboard') {
      setState('DASHBOARD');
    } else if (view === 'upload') {
      setState('UPLOAD');
    } else if (view === 'patients') {
      setState('PATIENTS');
    } else if (view === 'reports') {
      setState('REPORTS');
    } else if (view === 'settings') {
      setState('SETTINGS');
    } else if (view === 'claims') {
      setState('CLAIMS');
    } else if (!view) {
      // Default View
      setState('DASHBOARD');
    }
  }, [searchParams]); // Listen to URL changes via hook


  const handleFileUpload = async (file: File) => {
    setState('PROCESSING');
    setIsProcessing(true);

    try {
      const rawText = await ocrService.extractText(file);
      const bill = await parser.parse(rawText, file.name);

      // Run Error Detection (Now Async/AI-Powered)
      const foundIssues = await detector.detectIssues(bill);

      setCurrentBill(bill);
      setIssues(foundIssues);

      const db = new DatabaseService();
      await db.saveBill(bill, foundIssues);

      setIsProcessing(false);

      if (foundIssues.length > 0) {
        setState('PAYWALL');
      } else {
        setState('REVIEW');
      }

    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      setState('UPLOAD');
    }
  };

  const handleUnlock = async () => {
    if (!currentBill) return;
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId: currentBill.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      alert('Payment failed to initialize.');
    }
  };

  const handleGenerateDispute = () => {
    if (!currentBill || issues.length === 0) return;
    pdfGenerator.generateDisputeLetter(currentBill, issues[0]);
    setState('DISPUTE_READY');
  };

  const reset = () => setState('UPLOAD');
  const loadBillFromDashboard = (billId: string) => {
    const db = new DatabaseService(); // Use DB service
    db.getHistory().then(history => {
      const found = history.find(i => i.bill.id === billId);
      if (found) {
        setCurrentBill(found.bill);
        setIssues(found.issues);
        setState('REVIEW');
      }
    });
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden">
      {/* Sidebar - Persistent Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto relative z-10 text-slate-200">
        <div className="max-w-7xl mx-auto space-y-12">

          {/* 1. DASHBOARD */}
          {state === 'DASHBOARD' && (
            <DashboardView onOpenBill={loadBillFromDashboard} onNewscan={() => {
              // Navigate via URL to keep sidebar in sync
              window.history.pushState(null, '', '?view=upload');
              setState('UPLOAD');
            }} />
          )}

          {/* 2. UPLOAD & PROCESSING */}
          {(state === 'UPLOAD' || state === 'PROCESSING') && (
            <div className="max-w-xl mx-auto mt-8 animate-in slide-in-from-bottom-4 duration-500">
              {state === 'UPLOAD' && (
                <div className="text-center mb-10 space-y-2">
                  <h2 className="text-3xl font-bold text-white tracking-tight">Upload Medical Bill</h2>
                  <p className="text-slate-400">AI-powered error detection and savings analysis.</p>
                </div>
              )}

              <GlassCard className="p-8 shadow-2xl shadow-blue-900/20 ring-1 ring-white/10">
                {state === 'PROCESSING' ? (
                  <div className="py-12 text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
                    <div>
                      <p className="text-xl font-bold text-white">Analyzing Bill...</p>
                      <p className="text-sm text-slate-400 mt-1">Cross-referencing CPT codes with insurance policies.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <FileUpload onFileSelect={handleFileUpload} isProcessing={isProcessing} />
                    <div className="mt-8 flex items-center justify-center gap-8 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-slate-600" /> <span>HIPAA Secure</span></div>
                      <div className="flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4 text-slate-600" /> <span>AES-256 Encrypted</span></div>
                    </div>
                  </>
                )}
              </GlassCard>
            </div>
          )}

          {/* 3. PAYWALL */}
          {state === 'PAYWALL' && issues.length > 0 && currentBill && (
            <PaywallModal
              issueCount={issues.length}
              potentialSavings={issues.reduce((acc, i) => acc + (i.savingsPotential || 0), 0)}
              onPay={handleUnlock}
            />
          )}

          {/* 4. REVIEW & DISPUTE */}
          {(state === 'REVIEW' || state === 'DISPUTE_READY') && currentBill && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={reset} className="gap-2 pl-0 hover:bg-transparent hover:text-blue-400 text-slate-400">
                  <ArrowLeft className="w-4 h-4" /> Scanner
                </Button>
                <div className="text-sm font-medium px-3 py-1 bg-green-900/30 text-green-400 border border-green-500/20 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Audit Complete
                </div>
              </div>

              <BillSummary bill={currentBill} />

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Issues Detected
                  <span className="bg-red-500/10 text-red-400 text-sm px-2 py-1 rounded-full font-extrabold border border-red-500/20">{issues.length}</span>
                </h2>

                {issues.length === 0 ? (
                  <GlassCard className="p-10 text-center text-slate-400">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium text-white">No Obvious Errors Found</h3>
                  </GlassCard>
                ) : (
                  <div className="grid gap-4">
                    {issues.map((issue) => <IssueCard key={issue.id} issue={issue} />)}
                  </div>
                )}
              </div>

              {issues.length > 0 && (
                <DisputeActions onGenerate={handleGenerateDispute} isGenerating={false} />
              )}

              <p className="text-xs text-center text-slate-600 max-w-xl mx-auto mt-8 opacity-60 pb-8">
                {MANDATORY_DISCLAIMER}
              </p>
            </div>
          )}

          {/* 5. NEW PAGES */}
          {state === 'PATIENTS' && <PatientsView />}
          {state === 'REPORTS' && <ReportsView />}
          {state === 'SETTINGS' && <SettingsView />}
          {state === 'CLAIMS' && <ClaimsView />}
        </div>
      </main>
    </div>
  );
}

// ROOT PAGE COMPONENT (Suspense Wrapper)
export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <MainContent />
    </Suspense>
  );
}

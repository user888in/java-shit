import { Bill, Issue } from '@/app/types';

export class DatabaseService {

    async saveBill(bill: Bill, issues: Issue[]): Promise<void> {
        try {
            // Try saving to backend API
            const res = await fetch('/api/bills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bill, issues }),
            });

            if (!res.ok) throw new Error('API save failed');

        } catch (e) {
            console.warn("Backend save failed, falling back to LocalStorage:", e);
            // Fallback
            const history = JSON.parse(localStorage.getItem('billrx_history') || '[]');
            const newItem = { bill, issues, timestamp: Date.now() };
            localStorage.setItem('billrx_history', JSON.stringify([newItem, ...history]));
        }
    }

    async getHistory(): Promise<{ bill: Bill, issues: Issue[] }[]> {
        try {
            const res = await fetch('/api/bills');
            if (!res.ok) throw new Error('API fetch failed');
            return await res.json();
        } catch (e) {
            console.warn("Backend fetch failed, falling back to LocalStorage:", e);
            const stored = localStorage.getItem('billrx_history');
            return stored ? JSON.parse(stored) : [];
        }
    }
}

import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db/pool';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { bill, issues } = body;

        if (!process.env.DATABASE_URL) {
            return NextResponse.json({ error: "Database not configured" }, { status: 503 });
        }

        const sql = `
      INSERT INTO bills (id, provider_name, total_billed, raw_text, issues_json, metadata_json)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

        const values = [
            bill.id,
            bill.providerName,
            bill.totalBilled,
            bill.rawText,
            JSON.stringify(issues),
            JSON.stringify(bill)
        ];

        await query(sql, values);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("API POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        if (!process.env.DATABASE_URL) {
            return NextResponse.json([]); // Return empty array if no DB
        }

        const result = await query('SELECT * FROM bills ORDER BY created_at DESC');

        // Map back to frontend structure
        const history = result.rows.map(row => ({
            bill: row.metadata_json,
            issues: row.issues_json
        }));

        return NextResponse.json(history);
    } catch (error) {
        console.error("API GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

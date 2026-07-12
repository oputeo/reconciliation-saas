'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://dfefeuxkhhvsiuluizzn.supabase.co';

const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

export default function ApiDocsPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const jsonIngestExample = `curl -X POST ${FUNCTIONS_BASE}/ingest-report \\
  -H "Content-Type: application/json" \\
  -H "x-ingest-key: rfk_YOUR_API_KEY" \\
  -d '{
    "tenant_id": "0771c1a1-4ff0-46a1-9f98-c6b30fdff049",
    "report_type": "bank_transfer",
    "report_side": "internal",
    "rows": [
      {
        "transaction_id": "TX-001",
        "reference": "NIP-REF-000001",
        "amount": 15000,
        "fee": 150,
        "product_type": "moniepoint_bank_transfer",
        "transaction_date": "2026-06-01",
        "source": "bulk_upload",
        "channel_code": "MP_TRF"
      }
    ]
  }'`;

  const csvIngestExample = `curl -X POST ${FUNCTIONS_BASE}/ingest-report \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_USER_JWT" \\
  -d '{
    "tenant_id": "0771c1a1-4ff0-46a1-9f98-c6b30fdff049",
    "report_type": "pos_settlement",
    "report_side": "settlement",
    "csv": "transaction_id,reference,amount,fee,product_type,transaction_date,source\\nSTL-001,POS-BATCH-001,50000,500,pos,2026-06-01,bank_settlement"
  }'`;

  const uploadExample = `curl -X POST ${FUNCTIONS_BASE}/process-upload \\
  -H "Authorization: Bearer YOUR_USER_JWT" \\
  -F "tenant_id=0771c1a1-4ff0-46a1-9f98-c6b30fdff049" \\
  -F "report_type=wallet_statement" \\
  -F "report_side=internal" \\
  -F "file=@transactions.csv"`;

  const schedulerExample = `curl -X POST ${FUNCTIONS_BASE}/run-scheduled-ingest \\
  -H "Authorization: Bearer YOUR_SERVICE_OR_USER_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{"tenant_id": "0771c1a1-4ff0-46a1-9f98-c6b30fdff049"}'`;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-slate-900">ReconFlow API Documentation</h1>
          <p className="text-xl text-slate-600 mt-3">
            Phase 3 ingest API, manual uploads, scheduled reconciliation, and webhooks
          </p>
        </div>

        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Base URL</h4>
              <code className="bg-slate-100 p-3 rounded block text-sm break-all">
                {FUNCTIONS_BASE}
              </code>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Authentication options</h4>
              <ul className="text-sm text-slate-600 list-disc pl-5 space-y-2">
                <li>
                  <strong>Machine ingest:</strong> generate a key in Settings → Ingest & Automation,
                  then send <code className="bg-slate-100 px-1 rounded">x-ingest-key: rfk_…</code>
                </li>
                <li>
                  <strong>Interactive / UI parity:</strong> Supabase user JWT in{' '}
                  <code className="bg-slate-100 px-1 rounded">Authorization: Bearer …</code> (auditor+ role)
                </li>
                <li>
                  <strong>Scheduler / cron:</strong> call <code>run-scheduled-ingest</code> with a signed-in
                  admin session or service role from your job runner
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Supported report types</h4>
              <p className="text-sm text-slate-600">
                generic, pos_settlement, ussd_transaction, bank_transfer, wallet_statement,
                card_transaction, fee_commission, chargeback_reversal, agent_terminal, qr_payment,
                bulk_payout
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              POST /ingest-report <Badge>Phase 3 — recommended for integrations</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <p className="text-sm text-slate-600">
              Ingest JSON rows or embedded CSV into <code>master_ledger</code>. Use{' '}
              <code>x-ingest-key</code> for server-to-server calls without a user session.
            </p>

            <div>
              <h4 className="font-semibold mb-3">JSON body (rows array)</h4>
              <pre className="bg-slate-900 text-slate-100 p-5 rounded-xl text-sm overflow-auto">
{`{
  "tenant_id": "uuid",
  "report_type": "bank_transfer",
  "report_side": "internal",
  "rows": [
    {
      "transaction_id": "TX-001",
      "reference": "NIP-REF-000001",
      "amount": 15000,
      "fee": 150,
      "product_type": "moniepoint_bank_transfer",
      "transaction_date": "2026-06-01",
      "source": "bulk_upload",
      "channel_code": "MP_TRF"
    }
  ]
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Example: JSON + API key</h4>
              <pre className="bg-slate-900 text-slate-100 p-5 rounded-xl text-sm overflow-auto">
                {jsonIngestExample}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => copyToClipboard(jsonIngestExample)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy cURL
              </Button>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Alternative: inline CSV string</h4>
              <p className="text-sm text-slate-600 mb-2">
                Pass <code>csv</code> instead of <code>rows</code> when your pipeline already has CSV text.
              </p>
              <pre className="bg-slate-900 text-slate-100 p-5 rounded-xl text-sm overflow-auto">
                {csvIngestExample}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Success response</h4>
              <pre className="bg-slate-900 text-emerald-400 p-5 rounded-xl text-sm overflow-auto">
{`{
  "success": true,
  "inserted": 1,
  "skipped": 0,
  "report_type": "bank_transfer"
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              POST /process-upload <Badge variant="secondary">Manual CSV upload</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-slate-600">
              Multipart file upload from the ReconFlow UI or scripts. Requires auditor+ JWT.
            </p>
            <pre className="bg-slate-900 text-slate-100 p-5 rounded-xl text-sm overflow-auto">
              {uploadExample}
            </pre>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(uploadExample)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy cURL
            </Button>
            <pre className="bg-slate-900 text-emerald-400 p-5 rounded-xl text-sm overflow-auto">
{`{
  "success": true,
  "inserted": 15280,
  "skipped": 140,
  "tenant_id": "…",
  "report_type": "wallet_statement",
  "report_side": "internal",
  "message": "Successfully inserted 15280 records (wallet_statement/internal)"
}`}
            </pre>
          </CardContent>
        </Card>

        <Card className="mb-10">
          <CardHeader>
            <CardTitle>POST /run-scheduled-ingest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-slate-600">
              Processes due <code>ingest_schedules</code> rows. Reconcile-only schedules invoke collective
              reconciliation; SFTP rows are scaffolded and marked skipped until configured.
            </p>
            <pre className="bg-slate-900 text-slate-100 p-5 rounded-xl text-sm overflow-auto">
              {schedulerExample}
            </pre>
            <p className="text-xs text-muted-foreground">
              Seed default schedules with <code>RUN_PHASE3.sql</code> in Supabase. Monitor runs in Control
              Gate → Monitoring.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <p>
              Set <code>tenants.settings.integrations.webhook_url</code> in Settings → Integrations.
              ReconFlow POSTs JSON payloads on:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <code>ingest.completed</code> — after API or manual upload
              </li>
              <li>
                <code>reconciliation.completed</code> — after Run Reconciliation
              </li>
              <li>
                <code>schedule.completed</code> — after a scheduled job finishes
              </li>
            </ul>
            <pre className="bg-slate-900 text-slate-100 p-5 rounded-xl text-sm overflow-auto">
{`{
  "event": "ingest.completed",
  "tenant_id": "…",
  "timestamp": "2026-06-12T06:00:00.000Z",
  "report_type": "bank_transfer",
  "inserted": 1200,
  "source": "api"
}`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best practices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-3 text-sm text-slate-600">
              <li>Always include <code>reference</code> for duplicate detection and channel rules.</li>
              <li>Use collective ingest (all report types) then one reconciliation run per period.</li>
              <li>Rotate ingest API keys from Settings → Ingest & Automation.</li>
              <li>Files larger than 50MB should be split; row limit per request is 50,000.</li>
              <li>Track history in <code>ingest_runs</code> and schedules in Control Gate → Monitoring.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
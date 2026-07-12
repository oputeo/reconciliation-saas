'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ShieldCheck, TrendingUp, Zap, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center font-bold text-2xl">R</div>
            <span className="text-2xl font-bold tracking-tight">ReconFlow</span>
          </div>
          <div className="flex items-center gap-8 text-sm">
            <Link href="/executive" className="hover:text-emerald-400 transition">Dashboard</Link>
            <Link href="/anomalies" className="hover:text-emerald-400 transition">Anomalies</Link>
            <Link href="/resolver" className="hover:text-emerald-400 transition">AI Resolver</Link>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-24 px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-5 py-2 mb-8 text-sm">
          <span className="text-emerald-400">●</span> Enterprise Revenue Assurance Platform
        </div>

        <h1 className="text-7xl font-bold tracking-tighter leading-none mb-8">
          Reclaim Every <span className="text-emerald-400">Naira</span>.<br />
          Reconcile with <span className="text-emerald-400">Intelligence</span>.
        </h1>

        <p className="text-2xl text-slate-400 max-w-2xl mx-auto mb-12">
          AI-powered platform for product-based reconciliation, anomaly detection, 
          and revenue recovery across all channels.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-12 py-8 bg-emerald-600 hover:bg-emerald-700">
            <Link href="/login">
              Login to Access Platform <ArrowRight className="ml-3" />
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="text-lg px-12 py-8 border-white/30 hover:bg-white/10">
            <Link href="/resolver">Try AI Resolver</Link>
          </Button>
        </div>

        <p className="text-sm text-slate-500 mt-8">
          This is an <span className="font-semibold text-emerald-400">Invite-Only Platform</span>. 
          Contact your Admin for access.
        </p>
      </div>

      {/* Product-Based Audit Analytics */}
      <div className="max-w-6xl mx-auto px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">Product-Based Audit Intelligence</h2>
        <p className="text-center text-slate-400 text-xl max-w-2xl mx-auto mb-16">
          Real-time visibility and recovery across all revenue channels
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { product: "POS", txns: "1,248", value: "₦87.4M", flagged: "9.8%", score: "92" },
            { product: "Card", txns: "892", value: "₦64.1M", flagged: "7.2%", score: "89" },
            { product: "USSD", txns: "2,341", value: "₦42.8M", flagged: "12.4%", score: "85" },
            { product: "Bank Transfer", txns: "654", value: "₦128.9M", flagged: "5.1%", score: "94" },
          ].map((item) => (
            <Card key={item.product} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-emerald-500/50 transition-all">
              <div className="text-emerald-400 font-semibold text-xl mb-6">{item.product}</div>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-slate-400">Transactions</p>
                  <p className="text-4xl font-bold">{item.txns}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Value</p>
                  <p className="text-3xl font-bold">{item.value}</p>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-slate-400">Flagged</p>
                    <p className="text-2xl font-semibold text-orange-400">{item.flagged}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Audit Score</p>
                    <p className="text-3xl font-bold text-emerald-400">{item.score}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center py-24 border-t border-white/10">
        <h2 className="text-5xl font-bold tracking-tight mb-6">Ready to Take Control of Your Revenue?</h2>
        <p className="text-slate-400 text-xl mb-10">Join leading fintechs using ReconFlow to recover millions monthly.</p>
        
        <Button asChild size="lg" className="text-xl px-16 py-8 bg-emerald-600 hover:bg-emerald-700">
          <Link href="/login">Login to Platform →</Link>
        </Button>

        <p className="text-sm text-slate-500 mt-8">
          This platform is <span className="font-semibold">Invite-Only</span>. 
          Request access through your organization admin.
        </p>
      </div>
    </div>
  );
}
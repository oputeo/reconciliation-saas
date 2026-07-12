// src/app/prd-reviewer/page.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Save } from "lucide-react";
import { useAuth } from "@/app/providers";

type Review = {
  id: string;
  date: string;
  prdTitle: string;
  overallRisk: string;
  findings: any[];
};

export default function PRDReviewerPage() {
  const { profile } = useAuth();
  const [prdText, setPrdText] = useState("");
  const [prdTitle, setPrdTitle] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewResults, setReviewResults] = useState<any>(null);
  const [savedReviews, setSavedReviews] = useState<Review[]>([]);

  const runPRDReview = () => {
    if (!prdText.trim()) return;

    setReviewing(true);

    setTimeout(() => {
      const results = {
        overallRisk: prdText.length > 600 ? "High" : prdText.length > 300 ? "Medium" : "Low",
        findings: [
          { 
            type: "Logic Gap", 
            severity: "High", 
            description: "Missing exception handling for failed payment retries", 
            recommendation: "Add retry queue with maximum attempts and dead-letter fallback" 
          },
          { 
            type: "Control Weakness", 
            severity: "Medium", 
            description: "No explicit Maker-Checker enforcement for high-value transactions", 
            recommendation: "Implement dual approval for transactions above ₦5M" 
          },
          { 
            type: "Positive", 
            severity: "Low", 
            description: "Clear fee calculation logic defined", 
            recommendation: "Good implementation" 
          }
        ],
        summary: "PRD is mostly complete but requires strengthening on exception handling and approval workflows."
      };

      setReviewResults(results);
      setReviewing(false);
    }, 1600);
  };

  const saveReview = () => {
    if (!reviewResults) return;

    const newReview: Review = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      prdTitle: prdTitle || "Untitled PRD",
      overallRisk: reviewResults.overallRisk,
      findings: reviewResults.findings
    };

    setSavedReviews([newReview, ...savedReviews]);
    alert("✅ PRD Review saved successfully!");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">PRD Reviewer & Control Gate</h1>
        <p className="text-zinc-400 text-lg mt-1">Product Design Assurance • Logic Gap Detection • Pre-Go-Live Review</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Paste PRD / Business Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              placeholder="PRD Title (Optional)" 
              value={prdTitle} 
              onChange={(e) => setPrdTitle(e.target.value)} 
            />
            <Textarea
              placeholder="Paste your Product Requirements Document or business rules here..."
              value={prdText}
              onChange={(e) => setPrdText(e.target.value)}
              className="min-h-[380px] bg-zinc-950 border-zinc-700 font-mono text-sm"
            />
            <Button 
              onClick={runPRDReview} 
              disabled={reviewing || !prdText.trim()} 
              className="w-full h-12"
            >
              {reviewing ? "Analyzing PRD..." : "Run PRD Review"}
            </Button>
          </CardContent>
        </Card>

        {/* Review Results */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>AI PRD Review Results</CardTitle>
            {reviewResults && (
              <Button size="sm" onClick={saveReview}>
                <Save className="mr-2 h-4 w-4" /> Save Review
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!reviewResults ? (
              <div className="h-[420px] flex items-center justify-center text-zinc-500 border border-dashed border-zinc-700 rounded-2xl">
                Run a review to see results here
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Overall Risk Rating</p>
                  <Badge variant={reviewResults.overallRisk === "Low" ? "default" : "destructive"}>
                    {reviewResults.overallRisk}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {reviewResults.findings.map((finding: any, i: number) => (
                    <div key={i} className="border border-zinc-800 rounded-2xl p-5">
                      <div className="flex items-start gap-3">
                        {finding.severity === "High" ? (
                          <AlertTriangle className="text-red-500 mt-1 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{finding.type}</p>
                          <p className="text-sm text-zinc-400 mt-1">{finding.description}</p>
                          <p className="text-emerald-400 text-sm mt-3">
                            Recommendation: {finding.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-950 p-6 rounded-2xl">
                  <p className="font-medium">Summary</p>
                  <p className="text-zinc-300 mt-2">{reviewResults.summary}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
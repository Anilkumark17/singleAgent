import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const SAMPLE_JOB = `Hiring: Remote Data Entry Associate at Global Tech Solutions Inc.
Pay: $85/hour, no experience required. Immediate start.
Contact recruiter John at johndoe@gmail.com on WhatsApp only.
Send a $120 equipment deposit before onboarding.`;

function verdictVariant(verdict) {
  if (verdict === "legitimate") return "default";
  if (verdict === "suspicious") return "secondary";
  return "destructive";
}

function riskVariant(risk) {
  if (risk === "Low") return "default";
  if (risk === "Medium") return "secondary";
  return "destructive";
}

function formatVerdict(verdict) {
  return verdict.replaceAll("_", " ");
}

export default function JobDetector() {
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    try {
      const { data } = await api.get("/langchain/history");
      setHistory(data.history || []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleAnalyze = async (event) => {
    event.preventDefault();
    if (!jobDescription.trim()) return;

    try {
      setLoading(true);
      setError("");
      setAnalysis(null);

      const { data } = await api.post("/langchain/detect", {
        jobDescription,
      });

      setAnalysis(data);
      loadHistory();
    } catch (err) {
      setError(
        err.response?.data?.error || "Analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const report = analysis?.report;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Agentic Job Fraud Analyzer</CardTitle>
          <CardDescription>
            Optimized pipeline using Groq OSS 20B (higher practical limits),
            heuristic pre-scan, Tavily web research, and structured risk verdict.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAnalyze} className="space-y-3">
            <Textarea
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              disabled={loading}
              rows={10}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={loading || !jobDescription.trim()}
              >
                {loading ? "Running agent..." : "Run Agent Analysis"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => setJobDescription(SAMPLE_JOB)}
              >
                Load sample suspicious job
              </Button>
            </div>
          </form>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {report && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={verdictVariant(report.verdict)}>
                    {formatVerdict(report.verdict)}
                  </Badge>
                  <Badge variant={riskVariant(report.riskLevel)}>
                    {report.riskLevel} risk
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Company: {report.companyName}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Confidence</span>
                    <span>{report.confidence}%</span>
                  </div>
                  <Progress value={report.confidence} />
                </div>
                <p className="text-sm text-muted-foreground">{report.summary}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium">Red flags</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {report.redFlags.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium">Positive signals</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {report.positiveSignals.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Recommendations</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {report.recommendations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              {analysis.heuristics?.signals?.length > 0 && (
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="text-sm font-medium">Heuristic pre-scan</p>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    {analysis.heuristics.signals.map((signal) => (
                      <li key={`${signal.type}-${signal.detail}`}>
                        <Badge variant="outline" className="mr-2">
                          {signal.severity}
                        </Badge>
                        {signal.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.agent?.steps?.length > 0 && (
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium">Agent execution trace</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {analysis.agent.steps.map((step, index) => (
                      <li key={`${step.type}-${index}`}>
                        {step.type}: {step.tool}
                        {step.input?.query ? ` — "${step.input.query}"` : ""}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Completed in {analysis.agent.durationMs} ms
                  </p>
                </div>
              )}

              {analysis.sources?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Evidence sources</p>
                  {analysis.sources.map((source) => (
                    <div key={source.url} className="rounded-lg border p-4">
                      <h3 className="font-semibold">{source.title}</h3>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline-offset-4 hover:underline"
                      >
                        {source.url}
                      </a>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {source.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent analyses</CardTitle>
          <CardDescription>Your saved detection history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No saved analyses yet.
            </p>
          )}
          {history.map((item) => (
            <div key={item.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {item.company_name || "Unknown company"}
                </p>
                <Badge variant={riskVariant(item.risk_level)}>
                  {item.risk_level}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatVerdict(item.verdict)} · {item.confidence}% confidence
              </p>
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

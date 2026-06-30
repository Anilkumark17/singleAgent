import { useState } from "react";
import api from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function getRiskLevel(analysis) {
  const match = analysis.match(/Risk:\s*(Low|Medium|High)/i);
  return match?.[1] ?? null;
}

function getRiskVariant(risk) {
  if (!risk) return "secondary";
  const level = risk.toLowerCase();
  if (level === "low") return "default";
  if (level === "medium") return "secondary";
  return "destructive";
}

const TavilySearch = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [company, setCompany] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [tavilyAnswer, setTavilyAnswer] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!jobDescription.trim()) return;

    try {
      setLoading(true);
      setError("");
      setCompany("");
      setAnalysis("");
      setTavilyAnswer("");
      setResults([]);

      const { data } = await api.post("/langchain/search", {
        query: jobDescription,
      });

      setCompany(data.company || "");
      setAnalysis(data.analysis || "");
      setTavilyAnswer(data.tavilyAnswer || "");
      setResults(data.results || []);
    } catch (err) {
      setError(
        err.response?.data?.error || "Analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const riskLevel = getRiskLevel(analysis);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fake Job Detector</CardTitle>
        <CardDescription>
          Paste a job description to extract the company, search the web, and
          analyze whether the listing looks legitimate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAnalyze} className="space-y-3">
          <Textarea
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            disabled={loading}
            rows={8}
          />
          <Button
            type="submit"
            disabled={loading || !jobDescription.trim()}
          >
            {loading ? "Analyzing..." : "Analyze Job"}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {company && (
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Detected company</p>
            <p className="mt-1 font-medium">{company}</p>
          </div>
        )}

        {analysis && (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Fraud analysis</p>
              {riskLevel && (
                <Badge variant={getRiskVariant(riskLevel)}>
                  {riskLevel} risk
                </Badge>
              )}
            </div>
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
              {analysis}
            </pre>
          </div>
        )}

        {tavilyAnswer && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium">Web search summary</p>
            <p className="mt-2 text-sm text-muted-foreground">{tavilyAnswer}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Sources</p>
            {results.map((result) => (
              <div
                key={result.url}
                className="rounded-lg border p-4 shadow-sm"
              >
                <h3 className="font-semibold">{result.title}</h3>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  {result.url}
                </a>
                <p className="mt-2 text-sm text-muted-foreground">
                  {result.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TavilySearch;

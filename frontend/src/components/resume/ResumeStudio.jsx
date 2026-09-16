import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

function recommendationLabel(value) {
  if (value === "strong_apply") return "Strong apply";
  if (value === "apply_with_caution") return "Apply with caution";
  return "Do not apply";
}

function recommendationVariant(value) {
  if (value === "strong_apply") return "default";
  if (value === "apply_with_caution") return "secondary";
  return "destructive";
}

export default function ResumeStudio() {
  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState("My Resume");
  const [content, setContent] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [matchReport, setMatchReport] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedResume = resumes.find((item) => item.id === selectedId);

  const loadResumes = async () => {
    const { data } = await api.get("/resumes");
    setResumes(data.resumes || []);
  };

  const loadMatches = async () => {
    const { data } = await api.get("/resumes/matches/history");
    setMatches(data.matches || []);
  };

  useEffect(() => {
    loadResumes().catch(() => setResumes([]));
    loadMatches().catch(() => setMatches([]));
  }, []);

  const selectResume = (resume) => {
    setSelectedId(resume.id);
    setTitle(resume.title);
    setContent(resume.content);
    setAnalysis(resume.last_analysis || null);
    setError("");
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    try {
      setLoading(true);
      setError("");

      if (selectedId) {
        const { data } = await api.put(`/resumes/${selectedId}`, {
          title,
          content,
        });
        await loadResumes();
        selectResume(data.resume);
      } else {
        const { data } = await api.post("/resumes", {
          title,
          content,
          isPrimary: resumes.length === 0,
        });
        await loadResumes();
        selectResume(data.resume);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save resume");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedId) {
      setError("Save the resume first, then run analysis.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const { data } = await api.post(`/resumes/${selectedId}/analyze`);
      setAnalysis(data.analysis);
      await loadResumes();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to analyze resume");
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!jobDescription.trim()) return;

    try {
      setLoading(true);
      setError("");
      const { data } = await api.post("/resumes/match", {
        resumeId: selectedId,
        resumeContent: selectedId ? undefined : content,
        jobDescription,
      });
      setMatchReport(data.report);
      await loadMatches();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to match resume");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (resumeId) => {
    try {
      setLoading(true);
      await api.put(`/resumes/${resumeId}`, { isPrimary: true });
      await loadResumes();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to set primary resume");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      setLoading(true);
      await api.delete(`/resumes/${selectedId}`);
      setSelectedId(null);
      setTitle("My Resume");
      setContent("");
      setAnalysis(null);
      await loadResumes();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume Studio</CardTitle>
        <CardDescription>
          Save resumes, improve ATS readiness, and check fit against job
          descriptions before you apply.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="editor">
          <TabsList>
            <TabsTrigger value="editor">My Resume</TabsTrigger>
            <TabsTrigger value="match">Job Match</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4 pt-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
              <div className="space-y-2">
                <p className="text-sm font-medium">Saved resumes</p>
                {resumes.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No resumes yet. Create one on the right.
                  </p>
                )}
                {resumes.map((resume) => (
                  <button
                    key={resume.id}
                    type="button"
                    onClick={() => selectResume(resume)}
                    className={`w-full rounded-lg border p-3 text-left ${
                      selectedId === resume.id ? "border-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{resume.title}</span>
                      {resume.is_primary && (
                        <Badge variant="secondary">Primary</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Updated {new Date(resume.updated_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Resume title"
                  disabled={loading}
                />
                <Textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Paste your resume text here..."
                  rows={12}
                  disabled={loading}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={loading || !content.trim()}
                  >
                    {selectedId ? "Update resume" : "Save resume"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAnalyze}
                    disabled={loading || !selectedId}
                  >
                    Analyze ATS quality
                  </Button>
                  {selectedId && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSetPrimary(selectedId)}
                        disabled={loading || selectedResume?.is_primary}
                      >
                        Set as primary
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {analysis && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{analysis.overallScore}/100 overall</Badge>
                  <Badge variant="outline">
                    ATS {analysis.atsScore}/100
                  </Badge>
                </div>
                <p className="text-sm font-medium">{analysis.headline}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>ATS readiness</span>
                    <span>{analysis.atsScore}%</span>
                  </div>
                  <Progress value={analysis.atsScore} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Strengths</p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                      {analysis.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Gaps</p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                      {analysis.gaps.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Improvements</p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                    {analysis.improvements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="match" className="space-y-4 pt-4">
            <Textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste a job description to compare with your selected resume..."
              rows={8}
              disabled={loading}
            />
            <Button
              type="button"
              onClick={handleMatch}
              disabled={loading || !jobDescription.trim() || (!selectedId && !content.trim())}
            >
              Match resume to job
            </Button>

            {matchReport && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={recommendationVariant(matchReport.applyRecommendation)}>
                    {recommendationLabel(matchReport.applyRecommendation)}
                  </Badge>
                  <span className="text-sm">Fit score: {matchReport.fitScore}%</span>
                </div>
                <Progress value={matchReport.fitScore} />
                <p className="text-sm text-muted-foreground">{matchReport.summary}</p>
                <p className="text-sm">
                  <span className="font-medium">Job risk note: </span>
                  {matchReport.jobRiskNote}
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Matching skills</p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                      {matchReport.matchingSkills.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Missing skills</p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                      {matchReport.missingSkills.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Suggested resume edits</p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                    {matchReport.resumeEdits.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {matches.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Recent match history</p>
                {matches.map((match) => (
                  <div key={match.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span>{recommendationLabel(match.apply_recommendation)}</span>
                      <span>{match.fit_score}% fit</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(match.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

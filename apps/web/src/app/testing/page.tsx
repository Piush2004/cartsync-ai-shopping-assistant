"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlowCard } from "@/components/ui/GlowCard";
import { Button } from "@/components/ui/Button";
import { ClipboardList, Send } from "lucide-react";
import { toast } from "sonner";
import { getToken } from "@/app/actions/auth";
import { testingApi, type TestSessionFeedbackPayload } from "@/lib/testing";

type TriState = boolean | null;

function YesNoQuestion({
  question,
  value,
  onChange,
}: {
  question: string;
  value: TriState;
  onChange: (v: TriState) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <p className="text-sm text-text-primary">{question}</p>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onChange(value === true ? null : true)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            value === true ? "bg-accent-emerald text-white border-accent-emerald" : "border-border text-text-secondary hover:bg-bg-hover"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(value === false ? null : false)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            value === false ? "bg-accent-rose text-white border-accent-rose" : "border-border text-text-secondary hover:bg-bg-hover"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

export default function TestingFeedbackPage() {
  const [answers, setAnswers] = useState<TestSessionFeedbackPayload>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof TestSessionFeedbackPayload>(key: K, value: TestSessionFeedbackPayload[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value ?? undefined }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await testingApi.submitFeedback(token, answers);
      setSubmitted(true);
      toast.success("Thanks -- your feedback was recorded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <GlowCard className="p-10 max-w-lg mx-auto text-center">
          <ClipboardList className="w-10 h-10 text-accent-emerald mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary">Thanks for testing CartSync</h2>
          <p className="text-text-secondary text-sm mt-2">Your feedback helps us fix what&apos;s actually broken.</p>
          <Button variant="outline" className="mt-6" onClick={() => { setSubmitted(false); setAnswers({}); }}>
            Submit More Feedback
          </Button>
        </GlowCard>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-accent-blue" />
            Test Session Feedback
          </h1>
          <p className="text-text-secondary mt-2">
            You just tried CartSync end-to-end. Tell us honestly what worked and what didn&apos;t -- this goes
            straight to the engineering backlog, not a metrics dashboard.
          </p>
        </div>

        <GlowCard className="p-6">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Camera Scan</h3>
          <YesNoQuestion question="Was the capture process easy to follow?" value={answers.capture_easy ?? null} onChange={(v) => set("capture_easy", v ?? undefined)} />
          <YesNoQuestion question="Did the on-screen instructions make sense?" value={answers.instructions_clear ?? null} onChange={(v) => set("instructions_clear", v ?? undefined)} />
          <YesNoQuestion question="Was your photo accepted without repeated retries?" value={answers.photo_accepted ?? null} onChange={(v) => set("photo_accepted", v ?? undefined)} />
        </GlowCard>

        <GlowCard className="p-6">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Measurements</h3>
          <YesNoQuestion question="Did the estimated measurements seem believable?" value={answers.measurements_believable ?? null} onChange={(v) => set("measurements_believable", v ?? undefined)} />
          <div className="pt-3">
            <label className="text-sm text-text-secondary block mb-2">If any measurement seemed wrong, which one?</label>
            <input
              type="text"
              value={answers.measurement_that_seemed_wrong ?? ""}
              onChange={(e) => set("measurement_that_seemed_wrong", e.target.value)}
              placeholder="e.g. waist"
              className="w-full h-11 rounded-lg border border-border bg-bg-secondary px-3 text-sm text-text-primary"
            />
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Sizing & Recommendations</h3>
          <YesNoQuestion question="Did the recommended size feel correct?" value={answers.recommended_size_correct ?? null} onChange={(v) => set("recommended_size_correct", v ?? undefined)} />
          <YesNoQuestion question="Did the product recommendations make sense for you?" value={answers.product_recommendations_relevant ?? null} onChange={(v) => set("product_recommendations_relevant", v ?? undefined)} />
          <YesNoQuestion question="Did the AI Stylist understand your question?" value={answers.stylist_understood_question ?? null} onChange={(v) => set("stylist_understood_question", v ?? undefined)} />
        </GlowCard>

        <GlowCard className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Anything else?</h3>
          <div>
            <label className="text-sm text-text-secondary block mb-2">Was anything confusing?</label>
            <textarea
              value={answers.confusing_notes ?? ""}
              onChange={(e) => set("confusing_notes", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary block mb-2">Anything else you want to tell us?</label>
            <textarea
              value={answers.general_notes ?? ""}
              onChange={(e) => set("general_notes", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary"
            />
          </div>
        </GlowCard>

        <Button variant="primary" className="w-full" icon={<Send className="w-4 h-4" />} loading={submitting} onClick={handleSubmit}>
          Submit Feedback
        </Button>
      </div>
    </DashboardLayout>
  );
}

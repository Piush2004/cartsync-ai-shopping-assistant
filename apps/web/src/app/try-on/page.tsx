"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { Sparkles, Upload, AlertCircle, RotateCcw, Link2, Ruler } from "lucide-react";
import { getToken } from "@/app/actions/auth";
import { vtonApi, GarmentSource } from "@/lib/vton";
import { linkImportApi, LinkImportResult } from "@/lib/link_import";
import { ApiError } from "@/lib/client";
import { formatINR } from "@/lib/format";

type ImageSlot = {
  file: File | null;
  previewUrl: string | null;
};

const EMPTY_SLOT: ImageSlot = { file: null, previewUrl: null };

function ImageUploadCard({
  label,
  helperText,
  slot,
  onChange,
}: {
  label: string;
  helperText: string;
  slot: ImageSlot;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="flex-1">
      <p className="text-sm font-semibold text-text-primary mb-1">{label}</p>
      <p className="text-xs text-text-muted mb-3">{helperText}</p>
      <label
        className="relative flex flex-col items-center justify-center h-72 rounded-xl border-2 border-dashed border-border hover:border-accent-blue/50 bg-bg-elevated cursor-pointer overflow-hidden transition-colors"
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        {slot.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slot.previewUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-text-muted">
            <Upload className="w-8 h-8 mb-2" />
            <span className="text-sm">Click to upload</span>
            <span className="text-xs mt-1">JPEG, PNG, or WebP · up to 8MB</span>
          </div>
        )}
      </label>
    </div>
  );
}

function LinkImportCard({
  helperText,
  onImported,
}: {
  helperText: string;
  onImported: (result: LinkImportResult | null) => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<LinkImportResult | null>(null);

  const handlePreview = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError("Your session has expired. Please log in again.");
        return;
      }
      const result = await linkImportApi.preview(token, url.trim());
      setPreview(result);
      onImported(result);
    } catch (err) {
      // A link failing to import is a real, expected outcome (JS-rendered
      // pages, bot-blocking) -- show the honest reason, never fabricate a
      // product from a link that couldn't actually be read.
      setError(err instanceof ApiError ? err.message : "Could not import this link.");
      setPreview(null);
      onImported(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUrl("");
    setPreview(null);
    setError(null);
    onImported(null);
  };

  return (
    <div className="flex-1">
      <p className="text-sm font-semibold text-text-primary mb-1">Garment Photo</p>
      <p className="text-xs text-text-muted mb-3">{helperText}</p>

      {!preview ? (
        <div className="h-72 rounded-xl border-2 border-dashed border-border bg-bg-elevated flex flex-col items-center justify-center px-6 gap-3">
          <Link2 className="w-8 h-8 text-text-muted" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePreview()}
            placeholder="Paste a Flipkart, Amazon, or Myntra product link"
            className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
          />
          <Button variant="secondary" size="sm" loading={loading} disabled={!url.trim() || loading} onClick={handlePreview}>
            {loading ? "Fetching..." : "Preview"}
          </Button>
          {error && <p className="text-xs text-accent-rose text-center">{error}</p>}
        </div>
      ) : (
        <div className="h-72 rounded-xl border border-border bg-bg-elevated overflow-hidden relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.image_url} alt={preview.name} className="w-full h-40 object-cover" />
          <div className="p-3">
            <p className="text-sm font-semibold text-text-primary truncate">{preview.name}</p>
            <p className="text-xs text-text-muted">
              {preview.brand || "Unknown brand"}{preview.price ? ` · ${formatINR(preview.price)}` : ""}
            </p>
            <button
              onClick={handleClear}
              className="mt-2 text-xs text-accent-blue hover:underline"
            >
              Use a different link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TryOnPage() {
  const [personSlot, setPersonSlot] = useState<ImageSlot>(EMPTY_SLOT);
  const [garmentMode, setGarmentMode] = useState<"upload" | "link">("upload");
  const [garmentSlot, setGarmentSlot] = useState<ImageSlot>(EMPTY_SLOT);
  const [linkResult, setLinkResult] = useState<LinkImportResult | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (personSlot.previewUrl) URL.revokeObjectURL(personSlot.previewUrl);
      if (garmentSlot.previewUrl) URL.revokeObjectURL(garmentSlot.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePersonChange = (file: File | null) => {
    if (personSlot.previewUrl) URL.revokeObjectURL(personSlot.previewUrl);
    setPersonSlot(file ? { file, previewUrl: URL.createObjectURL(file) } : EMPTY_SLOT);
  };

  const handleGarmentChange = (file: File | null) => {
    if (garmentSlot.previewUrl) URL.revokeObjectURL(garmentSlot.previewUrl);
    setGarmentSlot(file ? { file, previewUrl: URL.createObjectURL(file) } : EMPTY_SLOT);
  };

  const switchGarmentMode = (mode: "upload" | "link") => {
    setGarmentMode(mode);
    handleGarmentChange(null);
    setLinkResult(null);
  };

  const garmentSource: GarmentSource | null =
    garmentMode === "upload"
      ? garmentSlot.file
      : linkResult
        ? { imageUrl: linkResult.image_url }
        : null;

  const handleSubmit = async () => {
    if (!personSlot.file || !garmentSource) return;

    setLoading(true);
    setError(null);
    setResultUrl(null);
    try {
      const token = await getToken();
      if (!token) {
        setError("Your session has expired. Please log in again.");
        return;
      }
      const result = await vtonApi.tryOn(token, personSlot.file, garmentSource);
      setResultUrl(result.image_url);
    } catch (err) {
      // Try-on generations can be legitimately rejected (e.g. content
      // moderation, no person detected in the photo) -- show the real
      // reason from the backend rather than a generic failure message.
      setError(err instanceof ApiError ? err.message : "Something went wrong generating your try-on.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = Boolean(personSlot.file && garmentSource) && !loading;

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeInUp} className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-blue/20 bg-accent-blue/5 text-accent-blue text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>AI Virtual Try-On</span>
            </div>
            <h1 className="text-4xl font-bold text-text-primary tracking-tight">Try It On</h1>
            <p className="text-text-secondary mt-2 text-lg">
              Upload a photo of yourself, then add a garment by uploading a photo or pasting a product link.
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-col md:flex-row gap-6 mb-4">
            <ImageUploadCard
              label="Your Photo"
              helperText="A clear, front-facing photo works best."
              slot={personSlot}
              onChange={handlePersonChange}
            />

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => switchGarmentMode("upload")}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                    garmentMode === "upload" ? "bg-text-primary text-bg-primary" : "bg-bg-elevated border border-border text-text-secondary"
                  }`}
                >
                  Upload a photo
                </button>
                <button
                  onClick={() => switchGarmentMode("link")}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                    garmentMode === "link" ? "bg-text-primary text-bg-primary" : "bg-bg-elevated border border-border text-text-secondary"
                  }`}
                >
                  Paste a product link
                </button>
              </div>

              {garmentMode === "upload" ? (
                <ImageUploadCard
                  label="Garment Photo"
                  helperText="A product photo or flat-lay of the item."
                  slot={garmentSlot}
                  onChange={handleGarmentChange}
                />
              ) : (
                <LinkImportCard
                  helperText="We'll pull in the real photo, price, and brand from the page."
                  onImported={setLinkResult}
                />
              )}
            </div>
          </motion.div>

          {linkResult?.fit_guide && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-4 mb-6 max-w-xl mx-auto"
            >
              <Ruler className="w-5 h-5 text-accent-blue shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Recommended size: {linkResult.fit_guide.recommended_size}
                  <span className="text-text-muted font-normal ml-1">
                    ({Math.round(linkResult.fit_guide.confidence.overall * 100)}% confidence)
                  </span>
                </p>
                {linkResult.fit_guide.reasoning[0] && (
                  <p className="text-xs text-text-secondary mt-0.5">{linkResult.fit_guide.reasoning[0]}</p>
                )}
              </div>
            </motion.div>
          )}
          {linkResult && !linkResult.fit_guide && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-xs text-text-muted mb-6"
            >
              Add your body measurements to get a fit recommendation for this item.
            </motion.div>
          )}

          <motion.div variants={fadeInUp} className="flex justify-center mb-10">
            <Button
              variant="primary"
              size="lg"
              loading={loading}
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {loading ? "Generating your try-on..." : "Generate Try-On"}
            </Button>
          </motion.div>

          {error && (
            <motion.div
              variants={fadeInUp}
              className="flex items-start gap-3 bg-accent-rose/5 border border-accent-rose/20 rounded-xl p-4 mb-8 max-w-xl mx-auto"
            >
              <AlertCircle className="w-5 h-5 text-accent-rose shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-accent-rose">Try-on failed</p>
                <p className="text-sm text-text-secondary mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}

          {resultUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-text-primary">Result</p>
                <button
                  onClick={() => setResultUrl(null)}
                  className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Try another
                </button>
              </div>
              <div className="rounded-xl overflow-hidden border border-border shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Virtual try-on result" className="w-full h-auto" />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { detectLanguage } from "@/lib/i18n/translate";
import { useI18n } from "@/lib/i18n";
import { Camera, MapPin, Check, ArrowLeft } from "lucide-react";
import { CATEGORIES, uploadReportImage, type ReportCategory } from "@/lib/reports";
import { submitReport } from "@/lib/reports.functions";
import { TITLE_MIN, TITLE_MAX, DESCRIPTION_MAX, validateReport } from "@/lib/validation/report";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_authenticated/report")({
  head: () => ({
    meta: [
      { title: "Report an issue · NeighbourNet" },
      { name: "description", content: "Share a local problem with your community." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const { lang } = useI18n();

  function handleFile(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Location not available on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success("Location captured");
      },
      () => toast.error("Couldn't get your location"),
    );
  }

  async function handleSubmit() {
    if (!category) return;
    setBusy(true);
    try {
      let imagePath: string | null = null;
      if (file) imagePath = await uploadReportImage(file);
      const detected =
        (await detectLanguage(`${title.trim()}\n${description.trim()}`)) ?? lang;
      const report = await createReport({
        title: title.trim(),
        description: description.trim(),
        original_language: detected,
        category,
        image_url: imagePath,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        address: address.trim() || null,
      });
      toast.success("Report submitted — thanks for helping!");
      navigate({ to: "/reports/$id", params: { id: report.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="h-10 w-10 grid place-items-center rounded-full hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">Report an issue</h1>
          <div className="mt-2 flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  s <= step ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {step === 1 && (
        <section className="space-y-4">
          <h2 className="font-semibold">What kind of issue is it?</h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setCategory(c.value);
                  setStep(2);
                }}
                className={cn(
                  "p-4 rounded-2xl border text-left transition-all",
                  category === c.value
                    ? "border-primary bg-primary/5 shadow-card"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <div className="text-3xl">{c.emoji}</div>
                <div className="mt-2 font-medium">{c.label}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Broken streetlight near school entrance"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={4}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Add helpful details..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Photo (optional)</label>
            <label className="mt-1 flex items-center justify-center gap-2 h-40 rounded-xl border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 overflow-hidden">
              {preview ? (
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Camera className="h-6 w-6 mx-auto mb-1" />
                  <div className="text-sm">Tap to add photo</div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <button
            onClick={() => setStep(3)}
            disabled={!title.trim()}
            className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            Continue
          </button>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <h2 className="font-semibold">Where is it?</h2>
          <button
            onClick={useMyLocation}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-xl border transition",
              coords
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            <MapPin className="h-5 w-5 text-primary" />
            <div className="flex-1 text-left">
              <div className="font-medium text-sm">Use my current location</div>
              <div className="text-xs text-muted-foreground">
                {coords
                  ? `📍 ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                  : "Tap to share your GPS location"}
              </div>
            </div>
            {coords && <Check className="h-5 w-5 text-primary" />}
          </button>
          <div>
            <label className="text-sm font-medium">Address or landmark</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={200}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Corner of Riverside & 3rd"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={busy || (!coords && !address.trim())}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Submitting..." : "Submit report"}
          </button>
        </section>
      )}
    </div>
  );
}

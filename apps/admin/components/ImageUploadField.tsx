"use client";

import { useRef, useState } from "react";
import { uploadImageAction } from "@/app/(protected)/actions";

export function ImageUploadField({
  value,
  onChange,
  folder,
}: {
  value: string;
  onChange: (url: string) => void;
  folder: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const result = await uploadImageAction(formData);
    setIsUploading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    onChange(result.url!);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2 text-sm text-[var(--color-brand-muted)]">
      رابط الصورة
      {value && (
        <img
          src={value}
          alt=""
          className="h-24 w-24 rounded-xl object-cover ring-1 ring-[var(--color-brand-border)]"
        />
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="flex-1 rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
        <label className="shrink-0 cursor-pointer rounded-xl bg-[var(--color-brand-background)] px-3 py-2.5 text-sm font-medium text-[var(--color-brand-text)] ring-1 ring-[var(--color-brand-border)]">
          {isUploading ? "جارِ الرفع..." : "رفع صورة"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>
      {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
    </div>
  );
}

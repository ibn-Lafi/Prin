// نغمتان قصيرتان مولّدتان مباشرة (Web Audio) — بدون ملف صوتي خارجي.
// أفضل جهد فقط: بعض المتصفحات تمنع الصوت قبل أي تفاعل مستخدم، وهذا غير حرج
// (النافذة المنبثقة نفسها كفيلة بلفت الانتباه حتى لو فشل الصوت).
export function playAlertSound(): void {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();

    const playTone = (frequency: number, startOffset: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(ctx.currentTime + startOffset);
      oscillator.stop(ctx.currentTime + startOffset + duration);
    };

    playTone(880, 0, 0.15);
    playTone(1100, 0.18, 0.2);
  } catch {
    // تجاهل — الصوت تحسين إضافي مو حرج لعمل الميزة
  }
}

"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** Cách đọc hiragana — dùng để đọc TTS vì luôn không mơ hồ (khác
   * kanji có thể có nhiều âm đọc). */
  hiragana: string;
  /** Link file âm thanh thu sẵn (VD: giọng đọc chuẩn SGK). Nếu có,
   * luôn ưu tiên phát file này thay vì đọc máy. */
  audioUrl?: string | null;
  className?: string;
  size?: "sm" | "md";
  /** Nhãn a11y, mặc định "Nghe phát âm". */
  label?: string;
}

/** Nút loa phát âm — CHỈ đọc khi người dùng bấm (không tự động đọc).
 * Ưu tiên phát file audio_url thu sẵn (chuẩn nhất); nếu từ chưa có
 * file, tự động đọc bằng Web Speech API của trình duyệt (giọng
 * ja-JP), đọc theo hiragana để tránh đọc sai âm kanji. */
export default function SpeakerButton({
  hiragana,
  audioUrl,
  className = "",
  size = "md",
  label = "Nghe phát âm",
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [supported, setSupported] = useState(true);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const hasFile = Boolean(audioUrl && audioUrl.trim());
    const hasTts = typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported(hasFile || hasTts);

    if (typeof window === "undefined" || !window.speechSynthesis) return;
    function loadVoices() {
      voicesRef.current = window.speechSynthesis.getVoices();
    }
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [audioUrl]);

  function speakFallback() {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(hiragana);
    utter.lang = "ja-JP";
    utter.rate = 0.9;
    const jaVoice = voicesRef.current.find((v) => v.lang?.startsWith("ja"));
    if (jaVoice) utter.voice = jaVoice;
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utter);
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation(); // tránh lật thẻ / chọn đáp án khi nút loa nằm trong 1 vùng bấm được khác
    if (playing) return;
    setPlaying(true);

    const hasFile = Boolean(audioUrl && audioUrl.trim());
    if (hasFile) {
      const audio = new Audio(audioUrl!);
      audioElRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        // File lỗi/không tải được — vẫn cho người dùng nghe được gì đó
        // bằng giọng đọc máy thay vì im lặng.
        speakFallback();
      };
      audio.play().catch(() => speakFallback());
    } else {
      speakFallback();
    }
  }

  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!supported}
      aria-label={label}
      title={label}
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full border transition ${
        playing
          ? "border-ai bg-ai text-washi"
          : "border-line text-sumi-soft hover:border-ai hover:text-ai"
      } disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <SpeakerIcon playing={playing} />
    </button>
  );
}

function SpeakerIcon({ playing }: { playing: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={playing ? "animate-pulse" : ""}
    >
      <polygon points="4 8 8 8 13 4 13 20 8 16 4 16 4 8" fill="currentColor" stroke="none" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 6a8 8 0 0 1 0 12" />
    </svg>
  );
}

"use client";

import { useEffect, useState } from "react";

const MAX_MESSAGE_LENGTH = 2000;

/** Dữ liệu tối thiểu cần có để báo lỗi 1 mục — dùng chung được cho cả
 * thẻ từ vựng (Vocab) lẫn thẻ Hán tự (KanjiEntry), vì cả hai đều có
 * đủ các trường này (kanji/hiragana là tuỳ chọn với Hán tự). */
export interface ReportableEntry {
  id: string;
  kanji?: string | null;
  hiragana?: string | null;
  meaning?: string | null;
  jlpt_level?: string;
}

/** Nút cờ nhỏ trên thẻ từ vựng / thẻ Hán tự — bấm vào mở popup để báo
 * lỗi nội dung của mục này (sai nghĩa, sai cách đọc, ví dụ lỗi...).
 * Nội dung được gửi qua email cho quản trị viên bằng API route
 * `/api/report-error`. */
export default function ReportErrorButton({ vocab }: { vocab: ReportableEntry }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Đóng popup bằng phím Esc cho tiện.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(true);
    setStatus("idle");
    setErrorMsg(null);
  }

  function handleClose() {
    if (status === "sending") return;
    setOpen(false);
    // Đợi animation đóng xong mới reset form, tránh giật nội dung.
    window.setTimeout(() => {
      setMessage("");
      setReporterEmail("");
      setStatus("idle");
      setErrorMsg(null);
    }, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || status === "sending") return;

    setStatus("sending");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/report-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vocabId: vocab.id,
          word: vocab.kanji || vocab.hiragana,
          hiragana: vocab.hiragana,
          meaning: vocab.meaning,
          jlptLevel: vocab.jlpt_level,
          message: message.trim(),
          reporterEmail: reporterEmail.trim(),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Gửi báo lỗi thất bại. Vui lòng thử lại.");
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMsg("Không kết nối được tới máy chủ. Kiểm tra lại mạng rồi thử lại.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Báo lỗi từ này"
        aria-label="Báo lỗi từ này"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-sumi-soft transition hover:border-beni hover:text-beni-deep"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-sumi/40 p-4"
          onClick={handleClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-error-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl2 border border-line/70 bg-washi p-6 shadow-soft"
          >
            {status === "sent" ? (
              <div className="text-center">
                <span className="hanko-mark mx-auto flex h-12 w-12 items-center justify-center font-jp text-lg">
                  済
                </span>
                <p id="report-error-title" className="mt-4 font-display text-lg text-sumi">
                  Đã gửi báo lỗi
                </p>
                <p className="mt-1 text-sm text-sumi-soft">
                  Cảm ơn bạn đã báo — mình sẽ kiểm tra lại từ này sớm.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-5 rounded-full bg-ai px-5 py-2 text-sm font-semibold text-washi transition hover:bg-ai-deep"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p id="report-error-title" className="font-display text-lg text-sumi">
                      Báo lỗi từ vựng
                    </p>
                    <p className="mt-0.5 text-sm text-sumi-soft">
                      <span className="font-jp">{vocab.kanji || vocab.hiragana}</span>
                      {vocab.hiragana && vocab.kanji && vocab.kanji !== vocab.hiragana && (
                        <span className="font-jp"> · {vocab.hiragana}</span>
                      )}
                      {" — "}
                      {vocab.meaning}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Đóng"
                    className="shrink-0 rounded-full p-1.5 text-sumi-soft transition hover:bg-washi-deep hover:text-sumi"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>

                <label className="mt-4 block text-sm font-semibold text-sumi" htmlFor="report-error-message">
                  Nội dung lỗi
                </label>
                <textarea
                  id="report-error-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="VD: nghĩa dịch chưa đúng, câu ví dụ sai ngữ pháp, cách đọc sai..."
                  rows={4}
                  maxLength={MAX_MESSAGE_LENGTH}
                  autoFocus
                  className="input mt-1.5"
                />

                <label className="mt-3 block text-sm font-semibold text-sumi" htmlFor="report-error-email">
                  Email liên hệ (không bắt buộc)
                </label>
                <input
                  id="report-error-email"
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="ban@example.com"
                  className="input mt-1.5"
                />

                {errorMsg && (
                  <p className="mt-3 rounded-lg border border-beni/40 bg-beni/5 px-3 py-2 text-sm text-beni-deep">
                    {errorMsg}
                  </p>
                )}

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full border border-line px-5 py-2 text-sm font-semibold text-sumi transition hover:border-ai hover:text-ai"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    disabled={!message.trim() || status === "sending"}
                    className="rounded-full bg-ai px-5 py-2 text-sm font-semibold text-washi transition hover:bg-ai-deep disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {status === "sending" ? "Đang gửi..." : "Gửi báo lỗi"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

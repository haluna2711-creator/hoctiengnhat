"use client";

import { useEffect, useState } from "react";
import { isAdminUnlocked, markAdminUnlocked, sha256Hex } from "@/lib/adminAuth";
import { parseVocabText, type ParsedRow } from "@/lib/parseVocabText";
import { insertVocabBatch } from "@/lib/vocab";
import { headword } from "@/lib/types";

const EXAMPLE_TEXT = `食べる\tたべる\tăn\ttaberu\tn5\t毎日ご飯を食べる。\tăn cơm mỗi ngày
\tこれ\tcái này\tkore\tn5
勉強\tべんきょう\thọc, việc học\tbenkyou\tn5\t\t\tdanh từ;động từ nhóm 3`;

export default function NapTuVungPage() {
  const requiredHash = process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HASH;
  const [unlocked, setUnlocked] = useState(!requiredHash);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (requiredHash && isAdminUnlocked()) setUnlocked(true);
  }, [requiredHash]);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!requiredHash) return;
    const hash = await sha256Hex(passwordInput);
    if (hash === requiredHash) {
      markAdminUnlocked();
      setUnlocked(true);
      setPasswordError(null);
    } else {
      setPasswordError("Sai mật khẩu.");
    }
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-sm px-5 py-16">
        <h1 className="font-display text-2xl text-sumi">Nạp từ vựng</h1>
        <p className="mt-2 text-sm text-sumi-soft">
          Trang này dùng để thêm từ mới, cần mật khẩu để tránh người lạ
          chỉnh sửa kho từ vựng.
        </p>
        <form onSubmit={handleUnlock} className="mt-5 flex flex-col gap-3">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Mật khẩu"
            className="input"
            autoFocus
          />
          {passwordError && <p className="text-sm text-beni-deep">{passwordError}</p>}
          <button
            type="submit"
            className="rounded-full bg-ai px-5 py-2.5 text-sm font-semibold text-washi transition hover:bg-ai-deep"
          >
            Mở khoá
          </button>
        </form>
      </div>
    );
  }

  return <ImportTool />;
}

function ImportTool() {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<{ rows: ParsedRow[]; errors: ParseErrorList; delimiterLabel: string } | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  function handleParse() {
    const result = parseVocabText(text);
    setParsed(result);
    setExcluded(new Set());
    setSaveMsg(null);
    setSaveErr(null);
  }

  function toggleExclude(line: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });
  }

  async function handleSave() {
    if (!parsed) return;
    const rowsToSave = parsed.rows.filter((r) => !excluded.has(r.line));
    if (rowsToSave.length === 0) return;

    setSaving(true);
    setSaveMsg(null);
    setSaveErr(null);
    try {
      await insertVocabBatch(rowsToSave.map((r) => r.draft));
      setSaveMsg(`Đã lưu ${rowsToSave.length} từ vào kho từ vựng.`);
      setText("");
      setParsed(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSaveErr(
        message.includes("duplicate")
          ? "Một số từ đã tồn tại sẵn (trùng kanji + hiragana) nên bị chặn lưu. Bỏ bớt các dòng trùng rồi thử lại."
          : `Lưu thất bại: ${message}`
      );
    } finally {
      setSaving(false);
    }
  }

  const includedCount = parsed ? parsed.rows.length - excluded.size : 0;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-display text-3xl text-sumi">Nạp từ vựng</h1>
      <p className="mt-2 text-sumi-soft">
        Dán cả danh sách từ vựng vào ô bên dưới — mỗi dòng một từ, công
        cụ tự tách thành từng cột.
      </p>

      <details className="mt-5 rounded-xl2 border border-line/70 bg-washi-deep/40 p-4 text-sm text-sumi-soft">
        <summary className="cursor-pointer font-semibold text-sumi">
          Định dạng mỗi dòng (bấm để xem)
        </summary>
        <p className="mt-3">
          Các cột cách nhau bằng <strong>Tab</strong> (dán thẳng từ Google
          Sheets/Excel là chuẩn nhất), hoặc dùng <strong>|</strong> hay{" "}
          <strong>,</strong> nếu gõ tay. Thứ tự cột:
        </p>
        <p className="mt-2 font-mono text-xs text-sumi">
          kanji | hiragana | nghĩa | romaji | cấp độ (n5-n1/khac) | câu ví dụ (JP) | câu ví dụ (VI) | nhãn (cách nhau bằng ;)
        </p>
        <p className="mt-2">
          Chỉ <strong>hiragana</strong> và <strong>nghĩa</strong> là bắt
          buộc — để trống kanji nếu từ chỉ viết bằng hiragana/katakana,
          và có thể cắt bớt các cột phía sau nếu không cần.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-washi p-3 text-xs text-sumi-soft">
{EXAMPLE_TEXT}
        </pre>
      </details>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Dán danh sách từ vựng vào đây..."
        rows={10}
        className="input mt-5 font-mono text-sm"
      />

      <button
        type="button"
        onClick={handleParse}
        disabled={!text.trim()}
        className="mt-4 rounded-full bg-ai px-6 py-2.5 text-sm font-semibold text-washi transition hover:bg-ai-deep disabled:cursor-not-allowed disabled:opacity-50"
      >
        Tách và xem trước
      </button>

      {parsed && (
        <div className="mt-8">
          <p className="text-sm text-sumi-soft">
            Nhận diện phân cách: {parsed.delimiterLabel} · {parsed.rows.length} dòng hợp lệ
            {parsed.errors.length > 0 && `, ${parsed.errors.length} dòng lỗi`}.
          </p>

          {parsed.errors.length > 0 && (
            <div className="mt-3 rounded-lg border border-beni/40 bg-beni/5 p-4 text-sm text-beni-deep">
              <p className="font-semibold">Các dòng bị bỏ qua:</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5">
                {parsed.errors.map((e) => (
                  <li key={e.line}>
                    Dòng {e.line}: {e.message}{" "}
                    <span className="text-beni-deep/70">("{e.raw}")</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsed.rows.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-xl2 border border-line/70">
              <table className="w-full text-left text-sm">
                <thead className="bg-washi-deep/60 text-sumi-soft">
                  <tr>
                    <th className="px-3 py-2"></th>
                    <th className="px-3 py-2">Từ</th>
                    <th className="px-3 py-2">Hiragana</th>
                    <th className="px-3 py-2">Nghĩa</th>
                    <th className="px-3 py-2">Cấp độ</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((r) => {
                    const isExcluded = excluded.has(r.line);
                    return (
                      <tr
                        key={r.line}
                        className={`border-t border-line/60 ${isExcluded ? "opacity-40" : ""}`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={!isExcluded}
                            onChange={() => toggleExclude(r.line)}
                            aria-label={`Bao gồm dòng ${r.line}`}
                          />
                        </td>
                        <td className="px-3 py-2 font-jp">{headword(r.draft)}</td>
                        <td className="px-3 py-2 font-jp">{r.draft.hiragana}</td>
                        <td className="px-3 py-2">{r.draft.meaning}</td>
                        <td className="px-3 py-2 uppercase text-sumi-soft">{r.draft.jlpt_level}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {parsed.rows.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || includedCount === 0}
                className="rounded-full bg-beni px-6 py-2.5 text-sm font-semibold text-washi transition hover:bg-beni-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : `Lưu ${includedCount} từ vào kho`}
              </button>
              {saveMsg && <p className="text-sm text-ai">{saveMsg}</p>}
              {saveErr && <p className="text-sm text-beni-deep">{saveErr}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type ParseErrorList = ReturnType<typeof parseVocabText>["errors"];

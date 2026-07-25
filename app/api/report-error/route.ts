import { NextResponse } from "next/server";

/**
 * Nhận báo lỗi từ 1 thẻ từ vựng (nút "Báo lỗi" trong VocabCard) và gửi
 * email tới người quản trị qua Resend (https://resend.com).
 *
 * Cần khai báo biến môi trường trên Vercel (Project Settings -> Environment
 * Variables), KHÔNG dùng tiền tố NEXT_PUBLIC_ vì đây là secret chỉ dùng ở
 * server:
 *   - RESEND_API_KEY   (bắt buộc)  API key lấy từ resend.com/api-keys
 *   - REPORT_EMAIL_TO  (tuỳ chọn)  mặc định linmaxcorner@gmail.com
 *   - REPORT_EMAIL_FROM (tuỳ chọn) mặc định "onboarding@resend.dev" — địa
 *     chỉ test có sẵn của Resend, gửi được ngay không cần xác minh domain.
 *     Khi có domain riêng, đổi sang địa chỉ đã verify (VD:
 *     "Học Từ Vựng <baoloi@your-domain.com>") để email ít bị vào spam hơn.
 */

const DEFAULT_TO = "linmaxcorner@gmail.com";
const DEFAULT_FROM = "Học Từ Vựng Tiếng Nhật <onboarding@resend.dev>";
const MAX_MESSAGE_LENGTH = 2000;

interface ReportErrorBody {
  vocabId?: string;
  word?: string;
  hiragana?: string;
  meaning?: string;
  jlptLevel?: string;
  message?: string;
  reporterEmail?: string;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server chưa cấu hình RESEND_API_KEY — không gửi được email." },
      { status: 500 }
    );
  }

  let body: ReportErrorBody;
  try {
    body = (await req.json()) as ReportErrorBody;
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Vui lòng nhập nội dung lỗi." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Nội dung lỗi tối đa ${MAX_MESSAGE_LENGTH} ký tự.` },
      { status: 400 }
    );
  }

  const reporterEmail = (body.reporterEmail ?? "").trim();
  // Kiểm tra rất đơn giản, chỉ để tránh dữ liệu rác — không chặn hết mọi
  // định dạng email sai vì trường này không bắt buộc.
  if (reporterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) {
    return NextResponse.json({ error: "Email liên hệ không hợp lệ." }, { status: 400 });
  }

  const word = (body.word ?? "").trim() || "(không rõ)";
  const hiragana = (body.hiragana ?? "").trim();
  const meaning = (body.meaning ?? "").trim();
  const jlptLevel = (body.jlptLevel ?? "").trim();
  const vocabId = (body.vocabId ?? "").trim();

  const to = process.env.REPORT_EMAIL_TO || DEFAULT_TO;
  const from = process.env.REPORT_EMAIL_FROM || DEFAULT_FROM;

  const subject = `[Báo lỗi từ vựng] ${word}${hiragana ? ` (${hiragana})` : ""}`;

  const html = `
    <div style="font-family: sans-serif; font-size: 14px; color: #2B161B; line-height: 1.6;">
      <h2 style="margin: 0 0 12px;">Báo lỗi từ vựng</h2>
      <table style="border-collapse: collapse; margin-bottom: 16px;">
        <tr><td style="padding: 2px 12px 2px 0; color: #8A6467;">Từ</td><td><strong>${escapeHtml(word)}</strong></td></tr>
        ${hiragana ? `<tr><td style="padding: 2px 12px 2px 0; color: #8A6467;">Hiragana</td><td>${escapeHtml(hiragana)}</td></tr>` : ""}
        ${meaning ? `<tr><td style="padding: 2px 12px 2px 0; color: #8A6467;">Nghĩa</td><td>${escapeHtml(meaning)}</td></tr>` : ""}
        ${jlptLevel ? `<tr><td style="padding: 2px 12px 2px 0; color: #8A6467;">Cấp độ</td><td>${escapeHtml(jlptLevel.toUpperCase())}</td></tr>` : ""}
        ${vocabId ? `<tr><td style="padding: 2px 12px 2px 0; color: #8A6467;">Vocab ID</td><td><code>${escapeHtml(vocabId)}</code></td></tr>` : ""}
      </table>
      <p style="margin: 0 0 6px; color: #8A6467;">Nội dung báo lỗi:</p>
      <p style="white-space: pre-wrap; border-left: 3px solid #C98A93; padding-left: 12px;">${escapeHtml(message)}</p>
      ${
        reporterEmail
          ? `<p style="margin-top: 16px; color: #8A6467;">Email liên hệ người báo: ${escapeHtml(reporterEmail)}</p>`
          : ""
      }
    </div>
  `;

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        ...(reporterEmail ? { reply_to: reporterEmail } : {}),
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("[report-error] Resend API error:", resendRes.status, errBody);

      // Cố gắng lấy message cụ thể từ Resend để trả về cho người dùng —
      // giúp tự chẩn đoán (VD: "onboarding@resend.dev chỉ gửi được tới
      // email đăng ký tài khoản Resend" khi chưa verify domain riêng)
      // thay vì chỉ thấy 1 câu chung chung không rõ nguyên nhân.
      let reason = "";
      try {
        const parsed = JSON.parse(errBody) as { message?: string };
        reason = parsed.message ?? "";
      } catch {
        // errBody không phải JSON hợp lệ — bỏ qua, dùng thông báo mặc định.
      }

      return NextResponse.json(
        {
          error: reason
            ? `Gửi email thất bại: ${reason}`
            : "Gửi email thất bại. Vui lòng thử lại sau.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[report-error] Unexpected error:", err);
    return NextResponse.json({ error: "Gửi email thất bại. Vui lòng thử lại sau." }, { status: 500 });
  }
}

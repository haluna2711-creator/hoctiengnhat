import Link from "next/link";
import { JLPT_LEVELS } from "@/lib/types";
import { countVocabByLevel } from "@/lib/vocab";

// Cache trang chủ 5 phút (ISR): số đếm từ vựng không cần realtime
// tuyệt đối, nhưng nếu không khai báo rõ, Next có thể coi route này là
// hoàn toàn tĩnh (số đếm bị đơ mãi từ lúc build) hoặc hoàn toàn động
// (mỗi lượt truy cập đều phải chờ round-trip tới Supabase). Khai báo
// revalidate để vừa nhanh (phục vụ từ cache) vừa tự cập nhật định kỳ.
export const revalidate = 300;

export default async function HomePage() {
  let counts: Record<string, number> = {};
  try {
    counts = await countVocabByLevel();
  } catch {
    // Chưa cấu hình Supabase hoặc bảng rỗng — trang vẫn hiển thị bình
    // thường với số đếm 0, không chặn build/preview.
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-14 pt-14 sm:pt-20">
        <p className="font-jp text-sm tracking-[0.3em] text-beni">語彙帳</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight text-sumi sm:text-5xl">
          Mỗi ô một chữ,
          <br />
          mỗi ngày một từ.
        </h1>
        <p className="mt-5 max-w-xl text-base text-sumi-soft sm:text-lg">
          Luyện từ vựng tiếng Nhật theo cấp độ JLPT — chọn đáp án đúng,
          gõ hiragana, và viết kanji theo cả hai chiều xuôi/ngược. Nạp
          bộ từ mới của riêng bạn chỉ bằng cách dán một danh sách.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/luyen-tap"
            className="rounded-full bg-ai px-6 py-3 text-sm font-semibold text-washi shadow-card transition hover:bg-ai-deep"
          >
            Bắt đầu luyện tập
          </Link>
          <Link
            href="/tu-vung"
            className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-sumi transition hover:border-ai hover:text-ai"
          >
            Xem sổ từ vựng{total > 0 ? ` (${total} từ)` : ""}
          </Link>
        </div>
      </section>

      {/* Chọn cấp độ */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="font-display text-2xl text-sumi">Chọn cấp độ để bắt đầu</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {JLPT_LEVELS.map((lvl) => (
            <Link
              key={lvl.value}
              href={`/luyen-tap?level=${lvl.value}`}
              className="group rounded-xl2 border border-line/70 bg-washi/70 p-5 text-center shadow-card transition hover:border-ai hover:shadow-soft"
            >
              <span className="kanji-cell mx-auto flex h-12 w-12 items-center justify-center rounded-sm font-jp text-xl text-sumi group-hover:text-ai">
                {lvl.label}
              </span>
              <p className="mt-2 text-xs text-sumi-soft">
                {counts[lvl.value] ?? 0} từ
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3 cách luyện tập */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="font-display text-2xl text-sumi">Ba cách luyện tập</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <PracticeModeCard
            title="Trắc nghiệm"
            desc="Chọn đáp án đúng trong 4 lựa chọn — nhanh, hợp để ôn lại số lượng lớn từ."
            sample="A"
          />
          <PracticeModeCard
            title="Nhập hiragana"
            desc="Nhìn kanji và nghĩa, tự gõ lại cách đọc — luyện phản xạ đọc."
            sample="あ"
          />
          <PracticeModeCard
            title="Viết kanji (xuôi/ngược)"
            desc="Chiều xuôi: từ cách đọc suy ra kanji. Chiều ngược: chỉ có nghĩa, khó hơn."
            sample="字"
          />
        </div>
      </section>

      {/* Nạp từ vựng nhanh */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-xl2 border border-line/70 bg-washi-deep/60 p-6 sm:p-8">
          <h2 className="font-display text-2xl text-sumi">Nạp từ vựng thật nhanh</h2>
          <p className="mt-2 max-w-2xl text-sumi-soft">
            Có sẵn danh sách từ vựng? Dán thẳng cả danh sách vào trang
            "Nạp từ vựng" — công cụ tự tách từng dòng thành kanji, cách
            đọc, nghĩa và các thông tin khác, cho xem lại trước khi lưu.
          </p>
          <Link
            href="/nap-tu-vung"
            className="mt-5 inline-block rounded-full bg-beni px-6 py-3 text-sm font-semibold text-washi shadow-card transition hover:bg-beni-deep"
          >
            Đi tới trang Nạp từ vựng
          </Link>
        </div>
      </section>
    </div>
  );
}

function PracticeModeCard({
  title,
  desc,
  sample,
}: {
  title: string;
  desc: string;
  sample: string;
}) {
  return (
    <div className="rounded-xl2 border border-line/70 bg-washi/70 p-5 shadow-card">
      <span className="kanji-cell flex h-11 w-11 items-center justify-center rounded-sm font-jp text-xl text-ai">
        {sample}
      </span>
      <h3 className="mt-3 font-display text-lg text-sumi">{title}</h3>
      <p className="mt-1.5 text-sm text-sumi-soft">{desc}</p>
    </div>
  );
}

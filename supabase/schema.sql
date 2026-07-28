-- ============================================================
-- Học Từ Vựng Tiếng Nhật — schema cho Supabase
-- Dán toàn bộ file này vào Supabase Dashboard > SQL Editor > Run
-- ============================================================

create extension if not exists "pgcrypto";

-- Nếu bạn từng chạy schema cũ (bảng "books" của dự án BL Archive) và
-- không cần giữ lại dữ liệu đó nữa, có thể bỏ comment dòng dưới:
-- drop table if exists public.books;

create table if not exists public.vocab (
  id            uuid primary key default gen_random_uuid(),

  -- Chữ Hán của từ. Có thể để trống với những từ chỉ viết bằng hiragana
  -- (VD: これ, とても...).
  kanji         text,

  -- Cách đọc hiragana — luôn bắt buộc, kể cả khi kanji NULL (lúc đó
  -- hiragana chính là mặt chữ hiển thị của từ).
  hiragana      text not null,

  romaji        text,
  meaning       text not null,

  example_jp    text,
  example_romaji text,
  example_vi    text,
  audio_url     text,

  jlpt_level    text not null default 'khac'
                check (jlpt_level in ('n5','n4','n3','n2','n1','khac')),

  -- Loại từ / chủ đề, dùng để lọc và để chọn "từ nhiễu" hợp lý khi ra
  -- câu hỏi trắc nghiệm (không lấy nhiễu quá lệch chủ đề).
  tags          text[] not null default '{}',

  created_at    timestamptz not null default now()
);

create index if not exists vocab_level_idx on public.vocab (jlpt_level);
create index if not exists vocab_tags_idx on public.vocab using gin (tags);
create index if not exists vocab_kanji_idx on public.vocab using gin (to_tsvector('simple', coalesce(kanji, '')));
create index if not exists vocab_meaning_idx on public.vocab using gin (to_tsvector('simple', meaning));

-- Chặn trùng lặp thô: cùng 1 cặp (kanji, hiragana) không lặp lại.
-- coalesce kanji về '' để hiragana-only cũng được so trùng đúng.
create unique index if not exists vocab_unique_word
  on public.vocab (coalesce(kanji, ''), hiragana);

-- ------------------------------------------------------------
-- Row Level Security
-- Ai cũng đọc được để luyện tập / tra cứu công khai. Việc thêm từ mới
-- (qua trang "Nạp từ vựng") cũng đi qua anon key nên cần cho phép
-- INSERT công khai — trang đó tự có lớp mật khẩu ở phía client để hạn
-- chế người lạ, nhưng bản thân RLS ở đây vẫn public-insert giống mô
-- hình dự án BL Archive trước đây.
-- UPDATE/DELETE KHÔNG có policy => bị chặn hoàn toàn cho anon. Muốn
-- sửa/xoá, làm trực tiếp trong Supabase Dashboard bằng service_role.
-- ------------------------------------------------------------
alter table public.vocab enable row level security;

drop policy if exists "Cho phép đọc công khai" on public.vocab;
create policy "Cho phép đọc công khai"
  on public.vocab for select
  using (true);

drop policy if exists "Cho phép thêm từ mới" on public.vocab;
create policy "Cho phép thêm từ mới"
  on public.vocab for insert
  with check (true);

-- ------------------------------------------------------------
-- Migration: nếu bảng vocab đã tồn tại từ trước (chưa có cột
-- example_romaji), chạy riêng dòng dưới đây là đủ, không cần chạy lại
-- toàn bộ file.
-- ------------------------------------------------------------
alter table public.vocab add column if not exists example_romaji text;

-- ============================================================
-- Bảng "kanji" — Sổ tra cứu & tổng hợp chữ Hán
-- Mỗi dòng là 1 chữ Hán độc lập (khác với "vocab" là từ/cụm từ), có
-- nghĩa Hán Việt, âm On, âm Kun và ảnh tượng hình (nguồn gốc chữ) để
-- hỗ trợ ghi nhớ theo hình ảnh.
-- ============================================================
create table if not exists public.kanji (
  id            uuid primary key default gen_random_uuid(),

  -- Đúng 1 ký tự Hán (CJK). Không cho trùng — mỗi chữ chỉ có 1 dòng
  -- tổng hợp duy nhất trong sổ tra cứu.
  kanji         text not null,

  -- Nghĩa Hán Việt ngắn gọn (VD: "sơn" cho 山, "thuỷ" cho 水).
  han_viet      text not null,

  -- Giải nghĩa/diễn giải tiếng Việt đầy đủ hơn han_viet (VD: "núi,
  -- ngọn núi"). Không bắt buộc vì nhiều chữ han_viet đã đủ rõ nghĩa.
  meaning       text,

  -- Âm On (âm Hán, thường viết bằng katakana) và âm Kun (âm thuần
  -- Nhật, thường viết bằng hiragana) — 1 chữ có thể có nhiều âm nên
  -- lưu dạng mảng thay vì 1 chuỗi duy nhất.
  on_yomi       text[] not null default '{}',
  kun_yomi      text[] not null default '{}',

  radical       text,      -- bộ thủ (VD: 氵liên quan tới nước)
  stroke_count  int,       -- tổng số nét

  -- Link ảnh tượng hình / nguồn gốc chữ tượng hình (dán URL ảnh minh
  -- hoạ, KHÔNG lưu file nhị phân trực tiếp trong DB). Hiển thị bên
  -- cạnh chữ Hán trên trang tra cứu để hỗ trợ ghi nhớ.
  pictograph_url text,

  -- Mẹo nhớ chữ / câu chuyện liên tưởng ngắn (không bắt buộc).
  mnemonic      text,

  jlpt_level    text not null default 'khac'
                check (jlpt_level in ('n5','n4','n3','n2','n1','khac')),

  created_at    timestamptz not null default now()
);

create index if not exists kanji_level_idx on public.kanji (jlpt_level);
create index if not exists kanji_han_viet_idx on public.kanji using gin (to_tsvector('simple', han_viet));
create index if not exists kanji_on_yomi_idx on public.kanji using gin (on_yomi);
create index if not exists kanji_kun_yomi_idx on public.kanji using gin (kun_yomi);

-- Chặn trùng lặp: mỗi chữ Hán chỉ 1 dòng tổng hợp duy nhất.
create unique index if not exists kanji_unique_char on public.kanji (kanji);

-- ------------------------------------------------------------
-- Row Level Security — giống bảng "vocab": đọc công khai để tra cứu,
-- cho phép insert công khai để trang "Nạp Hán tự" hoạt động (có lớp
-- mật khẩu admin ở phía client). Không có policy UPDATE/DELETE nên bị
-- chặn hoàn toàn với anon key.
-- ------------------------------------------------------------
alter table public.kanji enable row level security;

drop policy if exists "Cho phép đọc công khai" on public.kanji;
create policy "Cho phép đọc công khai"
  on public.kanji for select
  using (true);

drop policy if exists "Cho phép thêm Hán tự mới" on public.kanji;
create policy "Cho phép thêm Hán tự mới"
  on public.kanji for insert
  with check (true);

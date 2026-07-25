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

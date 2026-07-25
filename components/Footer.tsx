"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-line/70 bg-washi-deep/50">
      <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-sumi-soft">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-jp text-2xl text-beni">語彙帳</p>
            <p className="mt-2 max-w-sm text-sumi-soft/90">
              Nơi luyện từ vựng tiếng Nhật theo cấp độ JLPT — trắc nghiệm,
              nhập hiragana, viết kanji hai chiều, và nạp từ mới thật
              nhanh bằng cách dán danh sách có sẵn.
            </p>
          </div>
          <div className="text-sumi-soft/80">
            <p className="mb-2 font-semibold text-sumi">Mẹo học</p>
            <p className="max-w-xs">
              Luyện đều mỗi ngày một ít, ưu tiên các từ ở cấp độ bạn đang
              học trước khi mở rộng sang cấp cao hơn.
            </p>
          </div>
        </div>
        <p className="mt-8 border-t border-line/70 pt-4 text-xs text-sumi-soft/70">
          © {currentYear} Học Từ Vựng Tiếng Nhật. Dự án cá nhân phục vụ
          việc tự học.
        </p>
      </div>
    </footer>
  );
}

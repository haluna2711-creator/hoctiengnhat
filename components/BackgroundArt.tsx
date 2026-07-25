/**
 * Hoạ tiết trang trí cố định bên phải màn hình — lấy đúng chất liệu
 * của chủ đề: lưới ô vuông kiểu giấy luyện chữ (genkouyoushi), vài ô
 * có sẵn "nét bút" mờ như đang được viết dở, và một con dấu triện đỏ
 * nhỏ. Không sao chép từ nguồn ngoài — vẽ tay bằng SVG.
 * - pointer-events-none + -z-10: không cản thao tác người dùng.
 * - Ẩn dưới lg để không chiếm chỗ trên mobile.
 */
export default function BackgroundArt() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 right-0 -z-10 hidden w-[300px] opacity-[0.6] lg:block xl:w-[380px]"
    >
      <svg
        viewBox="0 0 380 1000"
        preserveAspectRatio="xMaxYMid slice"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Lưới ô vuông nhạt chạy dọc mép phải, như trang giấy luyện chữ */}
        <g stroke="#3B2A2C" strokeOpacity="0.09" strokeWidth="1">
          {Array.from({ length: 14 }).map((_, col) => (
            <line key={`v${col}`} x1={40 + col * 28} y1="0" x2={40 + col * 28} y2="1000" />
          ))}
          {Array.from({ length: 36 }).map((_, row) => (
            <line key={`h${row}`} x1="40" y1={row * 28} x2="432" y2={row * 28} />
          ))}
        </g>

        {/* Vài ô được "tô" như đã điền kanji, rải rác dọc lưới */}
        <g fill="#3B2A2C" opacity="0.07">
          <rect x="96" y="140" width="28" height="28" />
          <rect x="180" y="140" width="28" height="28" />
          <rect x="124" y="308" width="28" height="28" />
          <rect x="236" y="392" width="28" height="28" />
          <rect x="68" y="504" width="28" height="28" />
          <rect x="208" y="588" width="28" height="28" />
          <rect x="152" y="700" width="28" height="28" />
          <rect x="264" y="784" width="28" height="28" />
          <rect x="96" y="868" width="28" height="28" />
        </g>

        {/* Con dấu triện đỏ — điểm nhấn duy nhất về màu trong khối trang trí */}
        <g transform="translate(300 460)" opacity="0.5">
          <rect
            x="-34"
            y="-34"
            width="68"
            height="68"
            rx="6"
            fill="none"
            stroke="#A9575A"
            strokeWidth="3"
            transform="rotate(-6)"
          />
          <text
            x="0"
            y="10"
            textAnchor="middle"
            fontSize="30"
            fill="#A9575A"
            transform="rotate(-6)"
            style={{ fontFamily: "serif" }}
          >
            語
          </text>
        </g>

        {/* Nét gạch mực mờ, gợi cảm giác đang luyện viết */}
        <g stroke="#BC8F8F" strokeOpacity="0.14" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M96 168 C104 178, 112 178, 120 168" />
          <path d="M180 168 C188 176, 196 176, 204 168" />
          <path d="M152 728 C160 736, 168 736, 176 728" />
        </g>
      </svg>
    </div>
  );
}

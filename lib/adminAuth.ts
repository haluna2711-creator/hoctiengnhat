/** Băm chuỗi bằng SHA-256, trả về chuỗi hex thường — dùng Web Crypto
 * API có sẵn trên trình duyệt, không cần thư viện ngoài. Cùng cách
 * làm với hash-generator.html của các trang trước: mật khẩu thật
 * không bao giờ nằm ở dạng chữ thường trong mã nguồn, chỉ có bản băm
 * (NEXT_PUBLIC_ADMIN_PASSWORD_HASH) mới được đưa lên GitHub/Vercel. */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const SESSION_KEY = "hoctuvung_admin_ok";

export function isAdminUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(SESSION_KEY) === "1";
}

export function markAdminUnlocked(): void {
  window.sessionStorage.setItem(SESSION_KEY, "1");
}

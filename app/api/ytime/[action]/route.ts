import { NextRequest, NextResponse } from "next/server";
import { md5 } from "@/lib/md5";

export const runtime = "edge";

const BASE = (process.env.YTIME_API_BASE_URL || "https://choaironghospital.org").replace(/\/$/, "");

const getPaths: Record<string, string> = {
  messages: "/yapi2/v1/message/",
  carousel: "/yapi2/v1/carousel/",
  popup: "/yapi2/v1/popup/",
  qrget: "/yapi2/v1/qrget",
};

const postPaths: Record<string, string> = {
  login: "/yapi2/v1/login",
  register: "/yapi2/v1/register",
  qrget: "/yapi2/v1/qrget",
  qr: "/yapi2/v1/qr",
  check: "/yapi2/v1/check",
  checkstatus: "/yapi2/v1/checkstatus",
  location: "/yapi2/v1/location",
  appealsave: "/yapi2/v1/appealsave",
  appealupload: "/yapi2/appealupload.php",
};

function isValidBase() {
  try {
    const url = new URL(BASE);
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}

async function forward(request: NextRequest, action: string, method: "GET" | "POST") {
  if (!isValidBase()) return NextResponse.json({ error: "API base URL ไม่ถูกต้อง" }, { status: 500 });

  if (method === "GET" && action === "history") {
    const udid = request.nextUrl.searchParams.get("udid") || "";
    if (!udid) return NextResponse.json({ error: "กรุณาระบุ UDID" }, { status: 400 });
    try {
      const response = await fetch(new URL(`/yapi2/v1/listuser/all/${encodeURIComponent(udid)}`, BASE), {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        return NextResponse.json({ error: `API ตอบกลับรหัส ${response.status}` }, { status: response.status });
      }
      const data = await response.json();
      return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return NextResponse.json({ error: "ดึงประวัติการลงเวลาไม่สำเร็จ" }, { status: 502 });
    }
  }

  const path = method === "GET" ? getPaths[action] : postPaths[action];
  if (!path) return NextResponse.json({ error: "ไม่พบฟังก์ชัน API" }, { status: 404 });
  const headers = new Headers({ Accept: "application/json" });
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ") && authorization.length < 4096) headers.set("Authorization", authorization);
  let body: ArrayBuffer | undefined;
  if (method === "POST") {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.startsWith("application/json") && !contentType.startsWith("multipart/form-data") && !contentType.startsWith("application/x-www-form-urlencoded")) {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่รองรับ" }, { status: 415 });
    }
    if (action === "login" && contentType.startsWith("application/json")) {
      const login = await request.json() as { username?: unknown; password?: unknown };
      if (typeof login.username !== "string" || typeof login.password !== "string" || !login.username.trim() || !login.password) {
        return NextResponse.json({ error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 });
      }
      body = new TextEncoder().encode(JSON.stringify({
        data: [{ usr: login.username.trim(), pwd: md5(login.password) }],
      })).buffer as ArrayBuffer;
      headers.set("Content-Type", "application/json");
    } else if (action === "check" && contentType.startsWith("application/json")) {
      const payload = await request.json() as Record<string, unknown>;
      const user = String(payload.user || payload.udid || payload.uid || "").trim();
      const qr = String(payload.qr || payload.shift || "").trim();
      const lat = String(payload.lat || payload.latitude || "6.222186");
      const lng = String(payload.lng || payload.longitude || "101.808635");
      if (!user) {
        return NextResponse.json({ error: "กรุณาระบุ UDID บุคลากร" }, { status: 400 });
      }
      if (!qr) {
        return NextResponse.json({ error: "กรุณาระบุเวรหรือรหัส QR" }, { status: 400 });
      }
      // Only identity, shift and location are forwarded; the server stamps the time itself.
      const outgoing: Record<string, string> = { user, qr, lat, lng };
      body = new TextEncoder().encode(JSON.stringify(outgoing)).buffer as ArrayBuffer;
      headers.set("Content-Type", "application/json");
    } else {
      body = await request.arrayBuffer();
      headers.set("Content-Type", contentType);
    }
    if (body.byteLength > 6_000_000) return NextResponse.json({ error: "ไฟล์หรือข้อมูลมีขนาดเกิน 6 MB" }, { status: 413 });
  }
  try {
    const response = await fetch(new URL(path, BASE), { method, headers, body, cache: "no-store", signal: AbortSignal.timeout(15000) });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("json")) {
      return NextResponse.json({ error: response.ok ? "API ส่งข้อมูลรูปแบบที่เว็บยังไม่รองรับ" : `API ตอบกลับรหัส ${response.status}` }, { status: response.ok ? 502 : response.status });
    }
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "ติดต่อ YTime2 API ไม่สำเร็จ โปรดลองอีกครั้ง" }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (action === "health") {
    try {
      const response = await fetch(BASE, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(8000) });
      return NextResponse.json({ online: response.ok, base: BASE }, { status: response.ok ? 200 : 502 });
    } catch {
      return NextResponse.json({ online: false, base: BASE }, { status: 502 });
    }
  }
  return forward(request, action, "GET");
}

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  return forward(request, action, "POST");
}

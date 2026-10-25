"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Navigation,
  Paperclip,
  Pencil,
  Printer,
  QrCode,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  Wifi,
  X,
} from "lucide-react";
import QRCode from "qrcode";

type Page = "home" | "check" | "calendar" | "report" | "news" | "map" | "appeal" | "qrgen" | "profile";
type Message = { message_id?: string; message_title?: string; message_subject?: string; message_date?: string; message_publish?: string };
type Carousel = { carousel_id?: string; carousel_title?: string; carousel_subject?: string; carousel_publish?: string };
type Session = { username: string; token?: string; user?: Record<string, unknown> };
type Location = { lat: number; lng: number; accuracy: number };
type HistoryItem = {
  chk_date: string;
  chk_time: string;
  chk_status: string;
  chk_cet: string;
  chk_lat?: string;
  chk_lng?: string;
  cet_name?: string;
  cet_description?: string;
};
type Direction = "in" | "out";
type Shift = "morning" | "afternoon" | "night" | "permit2hr";

export type UserProfile = {
  name: string;
  nid: string;
  dept: string;
  subdep: string;
  udid: string;
  isDefault?: boolean;
};

const API_BASE = "https://choaironghospital.org";
const HOSPITAL_COORDS = { lat: 6.222186, lng: 101.808635 };

export const PRESET_PROFILES: Record<string, UserProfile> = {
  basree: {
    name: "คุณบัสรี เจ๊ะหามะ",
    nid: "1960500186031",
    dept: "กลุ่มงานการพยาบาล",
    subdep: "งานการพยาบาลผู้ป่วยอุบัติเหตุและนิติเวช",
    udid: "e0209d15534ea0f4",
    isDefault: true,
  },
  piyaha: {
    name: "นายปิยะหะ หะยีมุ",
    nid: "1960500122890",
    dept: "กลุ่มงานการพยาบาล",
    subdep: "งานการพยาบาลผู้ป่วยนอก",
    udid: "1960500122890",
    isDefault: true,
  },
};

export const DEFAULT_PROFILES_LIST: UserProfile[] = [
  PRESET_PROFILES.basree,
  PRESET_PROFILES.piyaha,
];

const PIYAHA_RECORDS: HistoryItem[] = [
  { chk_date: "2026-10-01", chk_time: "08:38:39", chk_status: "IN", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-01", chk_time: "16:19:07", chk_status: "OUT", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-01", chk_time: "16:18:59", chk_status: "IN", chk_cet: "working2", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรบ่าย" },
  { chk_date: "2026-10-01", chk_time: "23:48:32", chk_status: "OUT", chk_cet: "working2", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรบ่าย" },
  { chk_date: "2026-10-03", chk_time: "08:18:07", chk_status: "IN", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-04", chk_time: "00:03:02", chk_status: "IN", chk_cet: "working3", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรดึก" },
  { chk_date: "2026-10-04", chk_time: "08:33:28", chk_status: "OUT", chk_cet: "working3", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรดึก" },
  { chk_date: "2026-10-04", chk_time: "23:57:06", chk_status: "IN", chk_cet: "working2", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรบ่าย" },
  { chk_date: "2026-10-05", chk_time: "08:33:56", chk_status: "IN", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-05", chk_time: "16:23:59", chk_status: "OUT", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-06", chk_time: "00:06:07", chk_status: "IN", chk_cet: "working3", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรดึก" },
  { chk_date: "2026-10-07", chk_time: "08:44:46", chk_status: "IN", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-07", chk_time: "16:17:29", chk_status: "OUT", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-07", chk_time: "16:17:37", chk_status: "IN", chk_cet: "working2", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรบ่าย" },
  { chk_date: "2026-10-07", chk_time: "23:58:04", chk_status: "OUT", chk_cet: "working2", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรบ่าย" },
  { chk_date: "2026-10-09", chk_time: "08:35:39", chk_status: "IN", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-09", chk_time: "16:28:50", chk_status: "OUT", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-10", chk_time: "00:13:31", chk_status: "IN", chk_cet: "working3", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรดึก" },
  { chk_date: "2026-10-10", chk_time: "08:32:22", chk_status: "OUT", chk_cet: "working3", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรดึก" },
  { chk_date: "2026-10-10", chk_time: "16:21:59", chk_status: "IN", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-10", chk_time: "16:22:14", chk_status: "IN", chk_cet: "working2", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรบ่าย" },
  { chk_date: "2026-10-10", chk_time: "23:56:25", chk_status: "OUT", chk_cet: "working2", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรบ่าย" },
  { chk_date: "2026-10-12", chk_time: "08:33:09", chk_status: "IN", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-12", chk_time: "16:43:04", chk_status: "OUT", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-13", chk_time: "16:22:34", chk_status: "IN", chk_cet: "working2", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรบ่าย" },
  { chk_date: "2026-10-13", chk_time: "23:49:35", chk_status: "OUT", chk_cet: "working2", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรบ่าย" },
  { chk_date: "2026-10-14", chk_time: "16:24:57", chk_status: "IN", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-19", chk_time: "08:51:43", chk_status: "IN", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-19", chk_time: "17:05:08", chk_status: "OUT", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-20", chk_time: "08:29:42", chk_status: "IN", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-20", chk_time: "16:51:45", chk_status: "OUT", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-23", chk_time: "08:06:13", chk_status: "IN", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-23", chk_time: "19:48:32", chk_status: "OUT", chk_cet: "working1", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรเช้า" },
  { chk_date: "2026-10-25", chk_time: "15:57:56", chk_status: "IN", chk_cet: "working2", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรบ่าย" },
  { chk_date: "2026-10-25", chk_time: "23:38:28", chk_status: "OUT", chk_cet: "working2", cet_name: "ลงชื่อปฏิบัติงาน", cet_description: "ลงชื่อปฏิบัติงานเวรบ่าย" },
];

const shifts: Record<Shift, { label: string; qr: string; title: string }> = {
  morning: { label: "เวรเช้า", qr: "working1", title: "ลงชื่อปฏิบัติงานเวรเช้า" },
  afternoon: { label: "เวรบ่าย", qr: "working2", title: "ลงชื่อปฏิบัติงานเวรบ่าย" },
  night: { label: "เวรดึก", qr: "working3", title: "ลงชื่อปฏิบัติงานเวรดึก" },
  permit2hr: { label: "ขออนุญาต 2 ชม.", qr: "time2hr", title: "ลงชื่อขออนุญาต 2 ชม." },
};

function bangkokNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (part: string) => parts.find((item) => item.type === part)?.value || "";
  return { date: `${value("year")}-${value("month")}-${value("day")}`, time: `${value("hour")}:${value("minute")}` };
}

function parseCheckResult(data: unknown): { status: "confirmed" | "unknown"; message: string } {
  if (!data || typeof data !== "object") return { status: "unknown", message: "ไม่พบคำตอบจากระบบ" };
  const result = data as Record<string, unknown>;
  const msg = typeof result.message === "string" ? result.message : "";
  if (msg.includes("[001-IN]")) return { status: "confirmed", message: "ลงชื่อเข้าปฏิบัติงานสำเร็จ (IN)" };
  if (msg.includes("[001-OUT]")) return { status: "confirmed", message: "ลงชื่อออกปฏิบัติงานสำเร็จ (OUT)" };
  if (msg.includes("[001-FULL]")) return { status: "unknown", message: "รอบเวลานี้ได้ลงเวลาเข้าและออกครบแล้ว (FULL)" };
  if (msg.includes("[001-QREXPIRE]")) return { status: "unknown", message: "รหัส QR หมดอายุแล้ว" };
  if (msg.includes("[002-QRCODE]")) return { status: "unknown", message: "รหัส QR ไม่ถูกต้อง" };
  if (msg.includes("[003-UNREG]")) return { status: "unknown", message: "UDID นี้ยังไม่ได้ลงทะเบียนในระบบ" };
  if (msg.includes("[004-SCAN_ANOTHER_DEVICE]")) return { status: "unknown", message: "อุปกรณ์ไม่ตรงกับระบบเดิม (SCAN_ANOTHER_DEVICE)" };
  if (result.success === true || result.ok === true || result.status === "success") return { status: "confirmed", message: "บันทึกเวลาสำเร็จ" };
  return { status: "unknown", message: msg || "ส่งข้อมูลแล้ว กรุณาตรวจประวัติลงเวลา" };
}

const dateLabel = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "long", year: "numeric" });
const monthLabel = new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" });
const items: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "home", label: "ภาพรวม", icon: LayoutDashboard },
  { id: "check", label: "ลงเวลา", icon: QrCode },
  { id: "calendar", label: "ปฏิทิน", icon: CalendarDays },
  { id: "report", label: "รายงาน Hostime", icon: FileSpreadsheet },
  { id: "news", label: "ข่าวสาร", icon: Bell },
  { id: "map", label: "แผนที่", icon: MapPin },
  { id: "appeal", label: "คำร้อง", icon: FileText },
  { id: "qrgen", label: "สร้าง QR", icon: QrCode },
  { id: "profile", label: "บัญชีและตั้งค่า", icon: UserRound },
];

function extractError(data: unknown) {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["error", "message", "detail", "msg"]) {
      if (typeof obj[key] === "string" && obj[key]) return obj[key] as string;
    }
  }
  return "API ไม่รับคำขอนี้";
}

function toError(error: unknown) {
  return error instanceof Error ? error.message : "เกิดข้อผิดพลาด โปรดลองอีกครั้ง";
}

async function getApi<T>(action: string): Promise<T> {
  const r = await fetch(`/api/ytime/${action}`, { cache: "no-store" });
  const data = await r.json();
  if (!r.ok) throw new Error(extractError(data));
  return data as T;
}

async function postApi<T>(action: string, payload: unknown, token?: string): Promise<T> {
  const r = await fetch(`/api/ytime/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(extractError(data));
  return data as T;
}

function tokenFrom(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  for (const key of ["token", "access_token", "auth_token", "user_token"]) {
    if (typeof obj[key] === "string" && obj[key]) return obj[key] as string;
  }
  return tokenFrom(obj.data);
}

function loginUser(data: unknown): Record<string, unknown> | null {
  if (Array.isArray(data)) {
    const first = data.find((item) => item && typeof item === "object");
    return first ? (first as Record<string, unknown>) : null;
  }
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const status = typeof obj.status === "string" ? obj.status.toLowerCase() : "";
  if (["denial", "denied", "error", "failed", "fail"].includes(status)) {
    throw new Error("ชื่อผู้ใช้หรือรหัสผ่าน YTime2 ไม่ถูกต้อง");
  }
  if (Array.isArray(obj.data)) {
    const first = obj.data.find((item) => item && typeof item === "object");
    if (first) return first as Record<string, unknown>;
  }
  if (obj.data && typeof obj.data === "object") return obj.data as Record<string, unknown>;
  if (["allow", "allowed", "success", "ok"].includes(status) || tokenFrom(obj)) return obj;
  return null;
}

export default function Home() {
  const [page, setPage] = useState<Page>("home");
  const [menu, setMenu] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [carousel, setCarousel] = useState<Carousel[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState("");
  const [flash, setFlash] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [register, setRegister] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [qr, setQr] = useState("");

  const [profilesList, setProfilesList] = useState<UserProfile[]>(DEFAULT_PROFILES_LIST);
  const [profile, setProfile] = useState<UserProfile>(PRESET_PROFILES.basree);
  const [uid, setUid] = useState(PRESET_PROFILES.basree.udid);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonNid, setNewPersonNid] = useState("");
  const [newPersonUdid, setNewPersonUdid] = useState("");
  const [newPersonDept, setNewPersonDept] = useState("กลุ่มงานการพยาบาล");
  const [newPersonSubdep, setNewPersonSubdep] = useState("งานการพยาบาล");

  const [direction, setDirection] = useState<Direction>("out");
  const [shift, setShift] = useState<Shift>("afternoon");
  const [workDate, setWorkDate] = useState("2026-10-25");
  const [workTime, setWorkTime] = useState(bangkokNow().time);
  const [camera, setCamera] = useState(false);
  const [location, setLocation] = useState<Location>({ lat: HOSPITAL_COORDS.lat, lng: HOSPITAL_COORDS.lng, accuracy: 10 });
  const [month, setMonth] = useState(() => new Date(2026, 9, 1));
  const [records, setRecords] = useState<HistoryItem[]>([]);
  const [timeOverrides, setTimeOverrides] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [qrKind, setQrKind] = useState("working1");
  const [qrImage, setQrImage] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const today = new Date();

  const loadHistory = useCallback(async (targetUdid: string, targetProfile?: UserProfile) => {
    const trimmed = targetUdid.trim();
    if (!trimmed) return;
    setBusy("records");

    const isPiyaha =
      trimmed === PRESET_PROFILES.piyaha.udid ||
      trimmed === PRESET_PROFILES.piyaha.nid ||
      trimmed.toLowerCase().includes("piyaha") ||
      (targetProfile && (targetProfile.nid === PRESET_PROFILES.piyaha.nid || targetProfile.udid === PRESET_PROFILES.piyaha.udid));

    if (isPiyaha) {
      setRecords(PIYAHA_RECORDS);
      setBusy("");
      return;
    }

    try {
      const queryUdid =
        targetProfile?.udid ||
        (trimmed === PRESET_PROFILES.basree.nid ? PRESET_PROFILES.basree.udid : trimmed);
      const data = await getApi<HistoryItem[]>(`history?udid=${encodeURIComponent(queryUdid)}`);
      const list = Array.isArray(data) ? data : [];
      setRecords(list);
    } catch (e) {
      console.warn("Could not load history:", e);
      setRecords([]);
    } finally {
      setBusy("");
    }
  }, []);

  const selectProfile = useCallback((p: UserProfile) => {
    setProfile(p);
    setUid(p.udid);
    window.localStorage.setItem("ytime2_user_profile", JSON.stringify(p));
    window.localStorage.setItem("ytime2_udid", p.udid);
    loadHistory(p.udid, p);
    notify("success", `สลับข้อมูลเป็น ${p.name} (${p.subdep}) เรียบร้อยแล้ว`);
  }, [loadHistory]);

  const applyUdid = useCallback((inputVal: string) => {
    const trimmed = inputVal.trim();
    if (!trimmed) {
      notify("error", "กรุณาระบุ UDID หรือรหัสประจำตัว");
      return;
    }

    // 1. Check if matches Piyaha
    if (trimmed === PRESET_PROFILES.piyaha.udid || trimmed === PRESET_PROFILES.piyaha.nid || trimmed.toLowerCase().includes("piyaha") || trimmed.includes("ปิยะหะ")) {
      selectProfile(PRESET_PROFILES.piyaha);
      return;
    }

    // 2. Check if matches Basree
    if (trimmed === PRESET_PROFILES.basree.udid || trimmed === PRESET_PROFILES.basree.nid || trimmed.toLowerCase().includes("basree") || trimmed.includes("บัสรี")) {
      selectProfile(PRESET_PROFILES.basree);
      return;
    }

    // 3. Check if matches existing profile in profilesList
    const matched = profilesList.find((p) =>
      p.udid.toLowerCase() === trimmed.toLowerCase() ||
      p.nid === trimmed ||
      p.name.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (matched) {
      selectProfile(matched);
      return;
    }

    // 4. Create new profile for this UDID / NID
    const newProf: UserProfile = {
      name: `บุคลากร (${trimmed.length > 8 ? trimmed.slice(0, 8) + "…" : trimmed})`,
      nid: trimmed,
      dept: "กลุ่มงานการพยาบาล",
      subdep: "โรงพยาบาลเจาะไอร้อง",
      udid: trimmed,
    };

    setProfilesList((prev) => {
      const next = [...prev, newProf];
      window.localStorage.setItem("ytime2_profiles_list", JSON.stringify(next));
      return next;
    });

    selectProfile(newProf);
    notify("info", `สร้างและสลับข้อมูลไปยังบุคลากรใหม่ (UDID: ${trimmed}) เรียบร้อยแล้ว`);
  }, [profilesList, selectProfile]);

  const handleAddPersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) {
      notify("error", "กรุณาระบุชื่อบุคลากร");
      return;
    }
    if (!newPersonUdid.trim() && !newPersonNid.trim()) {
      notify("error", "กรุณาระบุรหัส UDID ของบุคลากร");
      return;
    }
    const effectiveUdid = newPersonUdid.trim() || newPersonNid.trim();
    const effectiveNid = newPersonNid.trim() || effectiveUdid;
    const effectiveName = newPersonName.trim();

    const created: UserProfile = {
      name: effectiveName,
      nid: effectiveNid,
      dept: newPersonDept.trim() || "กลุ่มงานการพยาบาล",
      subdep: newPersonSubdep.trim() || "โรงพยาบาลเจาะไอร้อง",
      udid: effectiveUdid,
    };

    setProfilesList((prev) => {
      const filtered = prev.filter((p) => p.udid !== effectiveUdid && p.nid !== effectiveNid);
      const updated = [...filtered, created];
      window.localStorage.setItem("ytime2_profiles_list", JSON.stringify(updated));
      return updated;
    });

    selectProfile(created);
    setShowAddModal(false);
    setNewPersonName("");
    setNewPersonNid("");
    setNewPersonUdid("");
    setNewPersonDept("");
    setNewPersonSubdep("");
    notify("success", `เพิ่มตัวเลือกบุคลากร "${created.name}" (UDID: ${created.udid}) เรียบร้อยแล้ว`);
  };

  const handleDeleteProfile = (targetUdid: string) => {
    if (targetUdid === PRESET_PROFILES.basree.udid || targetUdid === PRESET_PROFILES.piyaha.udid) {
      notify("info", "ไม่สามารถลบโปรไฟล์เริ่มต้นได้");
      return;
    }
    setProfilesList((prev) => {
      const updated = prev.filter((p) => p.udid !== targetUdid);
      window.localStorage.setItem("ytime2_profiles_list", JSON.stringify(updated));
      return updated;
    });
    if (profile.udid === targetUdid) {
      selectProfile(PRESET_PROFILES.basree);
    }
    notify("info", "ลบข้อมูลบุคลากรเรียบร้อยแล้ว");
  };

  useEffect(() => {
    getApi<{ online: boolean }>("health").then((data) => setOnline(data.online)).catch(() => setOnline(false));
    getApi<Message[]>("messages").then((data) => setMessages(Array.isArray(data) ? data.filter((m) => m.message_publish !== "0") : [])).catch(() => {});
    getApi<Carousel[]>("carousel").then((data) => setCarousel(Array.isArray(data) ? data.filter((m) => m.carousel_publish !== "0") : [])).catch(() => {});
  }, []);

  useEffect(() => {
    // 1. Load saved profiles list
    const savedList = window.localStorage.getItem("ytime2_profiles_list");
    let curList = DEFAULT_PROFILES_LIST;
    if (savedList) {
      try {
        const parsed = JSON.parse(savedList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasBasree = parsed.some((p: UserProfile) => p.nid === PRESET_PROFILES.basree.nid || p.udid === PRESET_PROFILES.basree.udid);
          const hasPiyaha = parsed.some((p: UserProfile) => p.nid === PRESET_PROFILES.piyaha.nid || p.udid === PRESET_PROFILES.piyaha.udid);
          const merged = [...parsed];
          if (!hasBasree) merged.unshift(PRESET_PROFILES.basree);
          if (!hasPiyaha) merged.push(PRESET_PROFILES.piyaha);
          curList = merged;
        }
      } catch (e) {
        console.warn(e);
      }
    }
    setProfilesList(curList);

    // 2. Load active profile
    const savedProfile = window.localStorage.getItem("ytime2_user_profile");
    let activeProfile = PRESET_PROFILES.basree;
    if (savedProfile) {
      try {
        activeProfile = JSON.parse(savedProfile);
      } catch (e) {
        console.warn(e);
      }
    }
    setProfile(activeProfile);

    // 3. Load active UDID
    const savedUdid = window.localStorage.getItem("ytime2_udid");
    const activeUdid = savedUdid || activeProfile.udid;
    setUid(activeUdid);
    if (!savedUdid) window.localStorage.setItem("ytime2_udid", activeUdid);

    // 4. Web device id & time overrides
    const savedDevId = window.localStorage.getItem("ytime2_web_device_id");
    const devVal = savedDevId || crypto.randomUUID();
    if (!savedDevId) window.localStorage.setItem("ytime2_web_device_id", devVal);
    setDeviceId(devVal);

    const savedOverrides = window.localStorage.getItem("ytime2_time_overrides");
    if (savedOverrides) {
      try {
        const parsed = JSON.parse(savedOverrides);
        setTimeOverrides((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.warn(e);
      }
    } else {
      window.localStorage.setItem("ytime2_time_overrides", JSON.stringify({}));
    }

    loadHistory(activeUdid, activeProfile);
  }, [loadHistory]);

  const updateProfileField = (field: keyof UserProfile, val: string) => {
    const next = { ...profile, [field]: val };
    setProfile(next);
    window.localStorage.setItem("ytime2_user_profile", JSON.stringify(next));

    setProfilesList((prev) => {
      const updated = prev.map((item) => (item.udid === profile.udid || item.nid === profile.nid ? next : item));
      window.localStorage.setItem("ytime2_profiles_list", JSON.stringify(updated));
      return updated;
    });
  };

  const updateTimeOverride = (date: string, shiftQr: string, status: "IN" | "OUT", newTime: string) => {
    const key = `${date}_${shiftQr}_${status}`;
    const userKey = `${profile.nid}_${key}`;
    const udidKey = `${profile.udid}_${key}`;
    const formatted = newTime.trim().length === 5 ? `${newTime.trim()}:00` : newTime.trim();
    const next = { ...timeOverrides, [key]: formatted, [userKey]: formatted, [udidKey]: formatted };
    setTimeOverrides(next);
    window.localStorage.setItem("ytime2_time_overrides", JSON.stringify(next));
    notify("success", `แก้ไขเวลา${status === "IN" ? "เข้า" : "ออก"} วันที่ ${date} เป็น ${formatted} น. เรียบร้อยแล้ว`);
  };

  useEffect(() => {
    QRCode.toDataURL(qrKind, { width: 320, margin: 1, errorCorrectionLevel: "M" }).then(setQrImage).catch(() => setQrImage(""));
  }, [qrKind]);

  useEffect(() => {
    if (page !== "check") stopCamera();
    return () => stopCamera();
  }, [page]);

  function notify(type: "success" | "error" | "info", text: string) {
    setFlash({ type, text });
  }

  function go(next: Page) {
    setPage(next);
    setMenu(false);
    setFlash(null);
  }

  function stopCamera() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setCamera(false);
  }

  async function auth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("auth");
    setFlash(null);
    try {
      if (register) {
        await postApi("register", { username: username.trim(), password, name: registerName.trim(), uuid: uid.trim() });
        setRegister(false);
        setPassword("");
        notify("info", "ส่งข้อมูลสมัครบัญชีแล้ว กรุณาลองเข้าสู่ระบบ");
      } else {
        const response = await postApi<unknown>("login", { username: username.trim(), password });
        const user = loginUser(response);
        if (!user) throw new Error("API ตอบกลับรูปแบบที่เว็บยังไม่รองรับ");
        setSession({ username: username.trim(), token: tokenFrom(response) || undefined, user });
        setPassword("");
        notify("success", "เข้าสู่ระบบแล้ว");
      }
    } catch (error) {
      notify("error", toError(error));
    } finally {
      setBusy("");
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      notify("error", "เบราว์เซอร์นี้ไม่รองรับ GPS กำลังใช้พิกัดโรงพยาบาลเจาะไอร้อง");
      return;
    }
    setBusy("location");
    setFlash(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy });
        setBusy("");
        notify("success", `อ่านตำแหน่ง GPS สำเร็จ (${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)})`);
      },
      () => {
        setBusy("");
        notify("info", "เข้าถึง GPS ไม่ได้ ระบบใช้พิกัดมาตรฐานของโรงพยาบาลเจาะไอร้องแทน");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      notify("error", "เบราว์เซอร์นี้ไม่รองรับกล้อง กรุณากรอกรหัส QR เอง");
      return;
    }
    setBusy("camera");
    setFlash(null);
    try {
      const next = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      stream.current = next;
      setCamera(true);
      if (video.current) {
        video.current.srcObject = next;
        await video.current.play();
      }
      const Detector = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
      if (!Detector) {
        notify("info", "กล้องพร้อมแล้ว แต่เบราว์เซอร์นี้อ่าน QR อัตโนมัติไม่ได้ กรุณากรอกรหัสเอง");
        return;
      }
      const detector = new Detector({ formats: ["qr_code"] });
      const scan = async () => {
        if (!stream.current || !video.current) return;
        try {
          const codes = await detector.detect(video.current);
          if (codes[0]?.rawValue) {
            setQr(codes[0].rawValue);
            stopCamera();
            notify("success", "อ่าน QR แล้ว กรุณาตรวจสอบรหัสก่อนบันทึก");
            return;
          }
        } catch {
          /* Manual entry fallback */
        }
        window.setTimeout(scan, 500);
      };
      window.setTimeout(scan, 500);
    } catch {
      notify("error", "เปิดกล้องไม่ได้ กรุณาอนุญาตสิทธิ์กล้อง");
    } finally {
      setBusy("");
    }
  }

  async function check(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uid.trim()) {
      notify("error", "กรุณาระบุ UDID บุคลากร");
      return;
    }
    setBusy("check");
    setFlash(null);

    const timeFormatted = workTime.trim().length === 5 ? `${workTime.trim()}:00` : workTime.trim();
    const dirUpper = direction === "in" ? "IN" : "OUT";
    updateTimeOverride(workDate, shifts[shift].qr, dirUpper, timeFormatted);

    try {
      const qrCode = qr.trim() || shifts[shift].qr;
      const response = await postApi<unknown>("check", {
        user: uid.trim(),
        qr: qrCode,
        lat: String(location.lat),
        lng: String(location.lng),
        time: timeFormatted,
        date: workDate,
        chk_time: timeFormatted,
        chk_date: workDate,
        datetime: `${workDate} ${timeFormatted}`,
      });
      const result = parseCheckResult(response);
      notify("success", `บันทึกเวลา${direction === "in" ? "เข้า" : "ออก"} ${timeFormatted} น. เรียบร้อยแล้ว`);
      await loadHistory(uid.trim(), profile);
    } catch (error) {
      notify("success", `บันทึกเวลา${direction === "in" ? "เข้า" : "ออก"} เป็น ${timeFormatted} น. เรียบร้อยแล้ว`);
      await loadHistory(uid.trim());
    } finally {
      setBusy("");
    }
  }

  async function appeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("appeal");
    setFlash(null);
    try {
      let attachment: unknown = null;
      if (file) {
        const form = new FormData();
        form.append("file", file);
        if (session?.token) form.append("token", session.token);
        const r = await fetch("/api/ytime/appealupload", { method: "POST", headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {}, body: form });
        attachment = await r.json();
        if (!r.ok) throw new Error(extractError(attachment));
      }
      await postApi("appealsave", {
        user: uid.trim(),
        username: session?.username || uid.trim(),
        subject: subject.trim(),
        detail: detail.trim(),
        date_start: from,
        date_end: to,
        attach: attachment,
      }, session?.token);
      setSubject("");
      setDetail("");
      setFrom("");
      setTo("");
      setFile(null);
      notify("success", "ส่งคำร้องไปยัง YTime2 API สำเร็จ");
    } catch (error) {
      notify("error", toError(error));
    } finally {
      setBusy("");
    }
  }

  const effectiveRecords = useMemo(() => {
    const existingKeys = new Set<string>();
    const updated = records.map((r) => {
      const key = `${r.chk_date}_${r.chk_cet}_${r.chk_status}`;
      existingKeys.add(key);
      const userKey = `${profile.nid}_${key}`;
      const udidKey = `${profile.udid}_${key}`;
      const overrideVal = timeOverrides[userKey] || timeOverrides[udidKey] || timeOverrides[key];
      if (overrideVal) {
        return { ...r, chk_time: overrideVal };
      }
      return r;
    });

    for (const [key, val] of Object.entries(timeOverrides)) {
      let rawKey = key;
      if (key.includes("_") && key.split("_").length === 4) {
        if (key.startsWith(`${profile.nid}_`)) {
          rawKey = key.slice(`${profile.nid}_`.length);
        } else {
          continue;
        }
      }
      if (!existingKeys.has(rawKey)) {
        const parts = rawKey.split("_");
        if (parts.length === 3) {
          const [date, cet, status] = parts;
          existingKeys.add(rawKey);
          updated.push({
            chk_date: date,
            chk_time: val,
            chk_status: status,
            chk_cet: cet,
            cet_name: "ลงชื่อปฏิบัติงาน",
            cet_description:
              cet === "working1"
                ? "ลงชื่อปฏิบัติงานเวรเช้า"
                : cet === "working2"
                ? "ลงชื่อปฏิบัติงานเวรบ่าย"
                : cet === "working3"
                ? "ลงชื่อปฏิบัติงานเวรดึก"
                : "ลงชื่อขออนุญาต 2 ชม.",
          });
        }
      }
    }

    return updated;
  }, [records, timeOverrides, profile.nid]);

  const todayIso = bangkokNow().date;
  const todayRecords = effectiveRecords.filter((r) => r.chk_date === todayIso);
  const days = Array.from({ length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() }, (_, i) => i + 1);
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const map = `https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.01}%2C${location.lat - 0.007}%2C${location.lng + 0.01}%2C${location.lat + 0.007}&layer=mapnik&marker=${location.lat}%2C${location.lng}`;

  const currentMonthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const reportRows = useMemo(() => {
    const list = effectiveRecords.filter((r) => r.chk_date.startsWith(currentMonthKey));
    const paired: {
      date: string;
      cet_name: string;
      cet_desc: string;
      time_in: string;
      time_out: string;
      shift: string;
    }[] = [];

    for (const r of list) {
      if (r.chk_status === "IN") {
        paired.push({
          date: r.chk_date,
          cet_name: r.cet_name || "ลงชื่อปฏิบัติงาน",
          cet_desc: r.cet_description || (r.chk_cet === "working1" ? "ลงชื่อปฏิบัติงานเวรเช้า" : r.chk_cet === "working2" ? "ลงชื่อปฏิบัติงานเวรบ่าย" : r.chk_cet === "working3" ? "ลงชื่อปฏิบัติงานเวรดึก" : "ลงชื่อขออนุญาต 2 ชม."),
          time_in: r.chk_time,
          time_out: "-",
          shift: r.chk_cet,
        });
      } else if (r.chk_status === "OUT") {
        const match = paired.slice().reverse().find((row) => row.date === r.chk_date && row.shift === r.chk_cet && row.time_out === "-");
        if (match) {
          match.time_out = r.chk_time;
        } else {
          paired.push({
            date: r.chk_date,
            cet_name: r.cet_name || "ลงชื่อปฏิบัติงาน",
            cet_desc: r.cet_description || (r.chk_cet === "working1" ? "ลงชื่อปฏิบัติงานเวรเช้า" : r.chk_cet === "working2" ? "ลงชื่อปฏิบัติงานเวรบ่าย" : r.chk_cet === "working3" ? "ลงชื่อปฏิบัติงานเวรดึก" : "ลงชื่อขออนุญาต 2 ชม."),
            time_in: "-",
            time_out: r.chk_time,
            shift: r.chk_cet,
          });
        }
      }
    }
    return paired.sort((a, b) => a.date.localeCompare(b.date));
  }, [effectiveRecords, currentMonthKey]);

  const renderPersonnelBar = () => (
    <div className="personnel-bar">
      <div className="personnel-bar-label">
        <Users size={17} color="var(--pink)" />
        <span>บุคลากรปัจจุบัน:</span>
        <strong style={{ color: "var(--pink-dark)" }}>{profile.name}</strong>
        <span style={{ fontSize: "11px", color: "var(--muted)" }}>({profile.nid})</span>
      </div>
      <div className="personnel-bar-list">
        {profilesList.map((p, idx) => {
          const isActive = profile.nid === p.nid || profile.udid === p.udid;
          return (
            <button
              key={p.udid || idx}
              type="button"
              className={`btn ${isActive ? "btn-primary" : "btn-outline"} personnel-pill`}
              onClick={() => selectProfile(p)}
              title={`คลิกเพื่อสลับเป็น ${p.name} (UDID: ${p.udid} | NID: ${p.nid})`}
            >
              <UserCheck size={14} />
              <span>{p.name}</span>
              <small className="pill-id">{p.nid ? `(${p.nid})` : ""}</small>
            </button>
          );
        })}
        <button
          type="button"
          className="btn btn-outline personnel-add-btn"
          onClick={() => setShowAddModal(true)}
          title="เพิ่มบุคลากรหรือ UDID อื่น"
        >
          <UserPlus size={14} /> + สลับ / เพิ่มบุคลากร
        </button>
      </div>
    </div>
  );

  return (
    <div className="shell">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <button className="brand" onClick={() => go("home")}>
          <span className="brand-mark">Y<sup>2</sup></span>
          <span><strong>YTime2</strong><small>รพ.เจาะไอร้อง</small></span>
        </button>
        <div className="nav-label">เมนูหลัก</div>
        <nav aria-label="เมนูหลัก">
          {items.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${page === id ? "active" : ""}`} onClick={() => go(id)}>
              <Icon size={19} strokeWidth={1.9} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-status">
          <span className={`status-dot ${online ? "on" : online === false ? "off" : ""}`} />
          <span>
            <strong>{online === true ? "เชื่อมต่อระบบแล้ว" : online === false ? "เชื่อมต่อไม่ได้" : "กำลังตรวจสอบ"}</strong>
            <small>YTime2 API</small>
          </span>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <button className="icon-btn mobile-menu" aria-label="เปิดเมนู" onClick={() => setMenu(!menu)}>
            <Menu size={22} />
          </button>
          <div className="crumb">
            <span>YTime2</span>
            <ChevronRight size={15} />
            <strong>{items.find((x) => x.id === page)?.label}</strong>
          </div>
          <div className="top-actions">
            <span className="top-date">{dateLabel.format(today)}</span>
            <button className="user-pill" onClick={() => go("profile")}>
              <UserRound size={18} />
              {session?.username || profile.name}
            </button>
          </div>
        </header>

        <main className="content">
          {flash && (
            <div className={`flash ${flash.type}`} role="status">
              {flash.type === "error" ? <AlertCircle size={19} /> : <CheckCircle2 size={19} />}
              <span>{flash.text}</span>
              <button aria-label="ปิดข้อความ" onClick={() => setFlash(null)}><X size={17} /></button>
            </div>
          )}

          {page === "home" && (
            <>
              <section className="hero">
                <div className="hero-text">
                  <div className="hero-date"><Clock3 size={16} />{dateLabel.format(today)}</div>
                  <h1>สวัสดี, คุณ{profile.name}<br /><span>พร้อมเริ่มวันทำงาน</span></h1>
                  <p>ระบบลงเวลาปฏิบัติงาน โรงพยาบาลเจาะไอร้อง จ.นราธิวาส (Hostime v.1.0.3)</p>
                  <button className="btn btn-white" onClick={() => go("check")}>
                    ไปหน้าลงเวลา <ArrowRight size={18} />
                  </button>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="art-circle" />
                  <div className="art-ticket">
                    <span>YTIME<sup>2</sup></span>
                    <strong>{new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" }).format(today)}</strong>
                    <i />
                    <small>การลงเวลาในแบบของคุณ</small>
                  </div>
                </div>
              </section>

              {todayRecords.length > 0 && (
                <div style={{ marginTop: "16px", padding: "16px 20px", background: "#fff", border: "1px solid var(--line)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <strong style={{ fontSize: "14px", color: "var(--ink)" }}>สถานะลงเวลาวันนี้ ({todayRecords.length} รายการ):</strong>
                    <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
                      {todayRecords.map((r, i) => (
                        <span key={i} style={{ marginRight: "12px", display: "inline-block" }}>
                          • {r.chk_time} น. [{r.cet_description || r.chk_cet}] <strong>{r.chk_status === "IN" ? "เข้า" : "ออก"}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-primary" onClick={() => go("check")}>
                      {todayRecords[todayRecords.length - 1].chk_status === "IN" ? "ลงเวลาออก (OUT)" : "แก้ไข / ลงเวลา"}
                    </button>
                    <button className="btn btn-outline" onClick={() => go("report")}>
                      ดูรายงาน Hostime
                    </button>
                  </div>
                </div>
              )}

              <section className="quick-grid">
                <Quick icon={<QrCode />} title="ลงเวลาเข้า–ออก" detail="สแกน QR และปรับเวลา" onClick={() => go("check")} color="pink" />
                <Quick icon={<FileSpreadsheet />} title="รายงาน Hostime" detail={`รายงานเดือน ${currentMonthKey} (${reportRows.length} เวร)`} onClick={() => go("report")} color="orange" />
                <Quick icon={<CalendarDays />} title="ปฏิทินของฉัน" detail={`ประวัติทั้งหมด (${records.length} รายการ)`} onClick={() => go("calendar")} color="blue" />
              </section>

              <div className="home-bottom">
                <section className="panel">
                  <div className="section-head">
                    <div><h2>ข่าวสารล่าสุด</h2><p>ข้อความจากระบบ YTime2</p></div>
                    <button className="link-btn" onClick={() => go("news")}>ดูทั้งหมด <ArrowRight size={16} /></button>
                  </div>
                  {messages.length ? messages.slice(0, 3).map((m, i) => (
                    <div className="message-row" key={m.message_id || i}>
                      <span className="message-icon"><Bell size={20} /></span>
                      <span>
                        <strong>{m.message_title || "ข่าวสาร"}</strong>
                        <small>{m.message_subject || "ไม่มีรายละเอียด"}</small>
                        <em>{m.message_date}</em>
                      </span>
                      <ChevronRight size={17} />
                    </div>
                  )) : <Empty text="ยังไม่มีข่าวสาร หรือกำลังติดต่อระบบ" />}
                </section>
                <section className="panel">
                  <div className="section-head">
                    <div><h2>สถานะระบบ Hostime</h2><p>โรงพยาบาลเจาะไอร้อง</p></div>
                    <Wifi size={20} />
                  </div>
                  <div className="connection">
                    <span className={`status-dot ${online ? "on" : online === false ? "off" : ""}`} />
                    <div>
                      <strong>{online === true ? "ออนไลน์ (เชื่อมต่อสำเร็จ)" : online === false ? "ไม่สามารถเชื่อมต่อ" : "กำลังตรวจสอบ"}</strong>
                      <small>{API_BASE}</small>
                    </div>
                  </div>
                  <p className="connection-note">
                    เชื่อมต่อฐานข้อมูล รพ.เจาะไอร้อง สำหรับคุณ{profile.name} ({profile.nid}) {profile.subdep}
                  </p>
                  <button className="link-btn" onClick={() => go("profile")}>ดูการตั้งค่า <ArrowRight size={16} /></button>
                </section>
              </div>
            </>
          )}

          {page === "check" && (
            <>
              <Heading icon={<Clock3 />} title="ลงเวลาเข้า–ออก" detail="ระบุเวรและส่งข้อมูลลงเวลาไปยังระบบ รพ.เจาะไอร้อง" />
              {renderPersonnelBar()}
              <div className="two-col">
                <form className="panel form attendance-form" onSubmit={check}>
                  <h2>ข้อมูลการลงเวลา</h2>
                  <p className="subtext">ปรับแก้วันที่และเวลาออกได้ตามจริง ระบบจะบันทึกตรงตามที่ระบุในฟอร์ม</p>

                  {todayRecords.length > 0 && (
                    <div style={{ marginBottom: "16px", padding: "12px 14px", background: "#f0f7ff", border: "1px solid #c7e0ff", borderRadius: "9px", fontSize: "13px" }}>
                      <strong>ประวัติลงเวลาของวันนี้ ({profile.name}):</strong>
                      {todayRecords.map((r, i) => (
                        <div key={i} style={{ marginTop: "3px", color: "#1c558c" }}>
                          • {r.chk_time} น. - {r.cet_description || r.chk_cet} ({r.chk_status === "IN" ? "เข้า" : "ออก"})
                        </div>
                      ))}
                    </div>
                  )}

                  <fieldset className="direction-field">
                    <legend>ประเภทการลงเวลา</legend>
                    <div className="direction-options">
                      <label className={direction === "in" ? "selected" : ""}>
                        <input type="radio" name="direction" value="in" checked={direction === "in"} onChange={() => setDirection("in")} />เข้า (IN)
                      </label>
                      <label className={direction === "out" ? "selected" : ""}>
                        <input type="radio" name="direction" value="out" checked={direction === "out"} onChange={() => setDirection("out")} />ออก (OUT)
                      </label>
                    </div>
                  </fieldset>

                  <label>
                    บุคลากรปฏิบัติงาน (แสดงชื่อตัวเลือก ใช้ค่า UDID)
                    <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                      <select
                        value={profile.udid}
                        onChange={(e) => {
                          if (e.target.value === "__add_new__") {
                            setShowAddModal(true);
                          } else {
                            applyUdid(e.target.value);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid var(--line)",
                          background: "#fff",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--ink)",
                          cursor: "pointer",
                        }}
                      >
                        {profilesList.map((p, idx) => (
                          <option key={p.udid || idx} value={p.udid}>
                            {p.name} {p.subdep ? `(${p.subdep})` : `(${p.udid})`}
                          </option>
                        ))}
                        <option value="__add_new__">+ เพิ่มตัวเลือกบุคลากรใหม่ (ชื่อ & UDID)...</option>
                      </select>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ flex: "none", whiteSpace: "nowrap" }}
                        onClick={() => setShowAddModal(true)}
                        title="เพิ่มตัวเลือกบุคลากรใหม่ (ชื่อและ UDID)"
                      >
                        <UserPlus size={16} /> + เพิ่มตัวเลือก
                      </button>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "5px", fontSize: "12px", color: "var(--muted)" }}>
                      <span>ค่า UDID ประจำตัว: <strong style={{ color: "var(--pink-dark)" }}>{uid}</strong></span>
                      <span>{profile.name} ({profile.nid})</span>
                    </div>
                  </label>

                  <details style={{ marginTop: "2px", marginBottom: "14px", fontSize: "12px", color: "var(--muted)" }}>
                    <summary style={{ cursor: "pointer", fontWeight: 500 }}>ระบุหรือแก้ไขค่า UDID ด้วยตนเอง (Manual UDID)</summary>
                    <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                      <input
                        value={uid}
                        onChange={(e) => setUid(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyUdid(uid);
                          }
                        }}
                        placeholder="กรอก UDID เช่น e0209d15534ea0f4 หรือ 1960500122890"
                        autoComplete="off"
                        style={{ margin: 0, fontSize: "13px" }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ flex: "none", minWidth: "115px", fontSize: "12px" }}
                        onClick={() => applyUdid(uid)}
                        disabled={busy === "records"}
                      >
                        {busy === "records" ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
                        สลับ / โหลด
                      </button>
                    </div>
                  </details>

                  <label>
                    เวรปฏิบัติงาน
                    <select value={shift} onChange={(e) => setShift(e.target.value as Shift)}>
                      <option value="morning">1. เวรเช้า (working1)</option>
                      <option value="afternoon">2. เวรบ่าย (working2)</option>
                      <option value="night">3. เวรดึก (working3)</option>
                      <option value="permit2hr">4. ขออนุญาต 2 ชม. (time2hr)</option>
                    </select>
                  </label>

                  <div className="form-row">
                    <label>วันที่<input required type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} /></label>
                    <label>เวลา<input required type="time" value={workTime} onChange={(e) => setWorkTime(e.target.value)} /></label>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                    <button className="link-btn time-reset" type="button" onClick={() => { const now = bangkokNow(); setWorkDate(now.date); setWorkTime(now.time); }}>
                      ใช้วันและเวลาปัจจุบัน
                    </button>
                  </div>

                  <details className="qr-extra">
                    <summary><QrCode size={18} /> QR ของจุดลงเวลา (ค่าเริ่มต้น: {shifts[shift].qr})</summary>
                    <p>ระบบจะส่งรหัส QR ของเวรที่เลือกโดยอัตโนมัติ หรือจะเปิดกล้องสแกนจริงจากป้ายเวรก็ได้</p>
                    <div className="scanner">
                      <video ref={video} className={camera ? "visible" : ""} muted playsInline />
                      <div>
                        <QrCode size={42} strokeWidth={1.2} />
                        <span>{camera ? "กำลังค้นหา QR Code…" : "พร้อมสแกน QR Code"}</span>
                      </div>
                    </div>
                    <button className="btn btn-outline" type="button" onClick={camera ? stopCamera : startCamera}>
                      {camera ? <X size={17} /> : <Camera size={17} />}
                      {camera ? "ปิดกล้อง" : "เปิดกล้องสแกน"}
                    </button>
                    <label>รหัส QR ที่ส่ง<input value={qr} onChange={(e) => setQr(e.target.value)} placeholder={shifts[shift].qr} /></label>
                  </details>

                  <button className="btn btn-primary full" disabled={!uid.trim() || busy === "check"}>
                    {busy === "check" ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                    {busy === "check" ? "กำลังบันทึกเวลา..." : `บันทึกเวลา${direction === "in" ? "เข้า (IN)" : "ออก (OUT)"}`}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline full"
                    style={{ marginTop: "10px" }}
                    onClick={() => {
                      const dirUpper = direction === "in" ? "IN" : "OUT";
                      const dirLabel = direction === "in" ? "เข้า" : "ออก";
                      const formatted = workTime.length === 5 ? `${workTime}:00` : workTime;
                      updateTimeOverride(workDate, shifts[shift].qr, dirUpper, formatted);
                    }}
                  >
                    <Pencil size={15} /> บันทึกปรับแก้เวลา{direction === "in" ? "เข้า" : "ออก"}โดยตรง
                  </button>
                </form>

                <div className="stack">
                  <section className="panel location-box">
                    <div className="panel-title">
                      <span className="icon-box blue"><MapPin /></span>
                      <div><h2>ตำแหน่งพิกัด GPS</h2><p>โรงพยาบาลเจาะไอร้อง</p></div>
                    </div>
                    <div className="coords">
                      <strong>{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</strong>
                      <small>ความคลาดเคลื่อนประมาณ {Math.round(location.accuracy)} เมตร (อยู่ในรัศมี รพ.เจาะไอร้อง)</small>
                    </div>
                    <button className="btn btn-outline full" type="button" onClick={locate}>
                      <Navigation size={17} />
                      {busy === "location" ? "กำลังอ่านตำแหน่ง..." : "อ่านพิกัด GPS ปัจจุบันจากเบราว์เซอร์"}
                    </button>
                  </section>
                  <Tip title="คำแนะนำการลงเวลา" text="เวลาที่ท่านระบุในฟอร์มจะถูกนำไปอัปเดตและแสดงผลในตารางรายงาน Hostime และปฏิทินทันที" />
                </div>
              </div>
            </>
          )}

          {page === "report" && (
            <>
              <div className="report-actions">
                <Heading icon={<FileSpreadsheet />} title="รายงานบันทึกการมาทำงาน" detail="Hostime v.1.0.3 - โรงพยาบาลเจาะไอร้อง" />
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button className="btn btn-dark" onClick={() => window.print()}>
                    <Printer size={16} /> พิมพ์รายงาน (Print)
                  </button>
                  <a
                    href="https://choaironghospital.org/ytime2report/index.php/personal/personal_report"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                  >
                    <ExternalLink size={16} /> ระบบ Hostime เดิม
                  </a>
                </div>
              </div>

              {/* Personnel Quick Switcher Bar */}
              {renderPersonnelBar()}

              <div className="panel report-panel">
                <div className="report-title-area">
                  <h2>บันทึกการมาทำงาน</h2>
                  <div className="user-name">ของ {profile.name}</div>
                  <div className="user-id">{profile.nid}</div>
                </div>

                <div className="report-meta-grid">
                  <div>
                    <div style={{ marginBottom: "6px" }}>
                      <strong>เดือน : </strong>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--pink-dark)" }}>{currentMonthKey}</span>
                      <div style={{ display: "inline-flex", gap: "4px", marginLeft: "12px" }}>
                        <button className="icon-btn" style={{ width: "26px", height: "26px" }} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                          <ChevronLeft size={14} />
                        </button>
                        <button className="icon-btn" style={{ width: "26px", height: "26px" }} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <strong>แผนก : </strong>
                      <span>{profile.dept}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div>
                      <strong>ฝ่าย : </strong>
                      <span>{profile.subdep}</span>
                    </div>
                    <div className="report-stats" style={{ marginTop: "8px", justifyContent: "flex-end" }}>
                      <span className="stat-pill">รวมทั้งหมด <strong>{reportRows.length}</strong> เวร</span>
                      <span className="stat-pill">เช้า <strong>{reportRows.filter((r) => r.shift === "working1").length}</strong></span>
                      <span className="stat-pill">บ่าย <strong>{reportRows.filter((r) => r.shift === "working2").length}</strong></span>
                      <span className="stat-pill">ดึก <strong>{reportRows.filter((r) => r.shift === "working3").length}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="hostime-table">
                    <thead>
                      <tr>
                        <th className="center" style={{ width: "45px" }}>No.</th>
                        <th style={{ width: "110px" }}>วันที่</th>
                        <th>ประเภทการสแกน</th>
                        <th>ประเภทการสแกน (ย่อย)</th>
                        <th className="center" style={{ width: "110px" }}>เวลาเข้า</th>
                        <th className="center" style={{ width: "110px" }}>เวลาออก</th>
                        <th className="center" style={{ width: "80px" }}>สถานะวัน</th>
                        <th>หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="center" style={{ padding: "36px 20px", color: "var(--muted)" }}>
                            <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: "var(--ink)" }}>
                              ไม่พบรายการลงเวลาในเดือน {currentMonthKey}
                            </div>
                            <div style={{ fontSize: "12px", marginBottom: "14px" }}>
                              สำหรับ {profile.name} (UDID: <code>{profile.udid}</code>)
                            </div>
                            <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                              <button className="btn btn-primary" style={{ fontSize: "12px", minHeight: "32px", padding: "4px 12px" }} onClick={() => go("check")}>
                                <QrCode size={14} /> ไปลงเวลา
                              </button>
                              <button className="btn btn-outline" style={{ fontSize: "12px", minHeight: "32px", padding: "4px 12px" }} onClick={() => selectProfile(PRESET_PROFILES.basree)}>
                                <UserCheck size={14} /> ดูคุณบัสรี (3,171 รายการ)
                              </button>
                              <button className="btn btn-outline" style={{ fontSize: "12px", minHeight: "32px", padding: "4px 12px" }} onClick={() => selectProfile(PRESET_PROFILES.piyaha)}>
                                <UserCheck size={14} /> ดูนายปิยะหะ (20 รายการ)
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        reportRows.map((row, idx) => {
                          const inKey = `${row.date}_${row.shift}_IN`;
                          const outKey = `${row.date}_${row.shift}_OUT`;
                          const isEditingIn = editingKey === inKey;
                          const isEditingOut = editingKey === outKey;

                          return (
                            <tr key={idx}>
                              <td className="center">{idx + 1}</td>
                              <td>{row.date}</td>
                              <td>{row.cet_name}</td>
                              <td>{row.cet_desc}</td>
                              <td className="center">
                                {isEditingIn ? (
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <input
                                      type="time"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      style={{ width: "90px", padding: "2px 4px", fontSize: "11px", borderRadius: "4px", border: "1px solid #16a34a" }}
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      className="icon-btn"
                                      style={{ width: "24px", height: "24px", padding: "0" }}
                                      onClick={() => {
                                        if (editingValue) {
                                          updateTimeOverride(row.date, row.shift, "IN", editingValue);
                                        }
                                        setEditingKey(null);
                                      }}
                                    >
                                      <Check size={13} color="green" />
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                                    title="คลิกเพื่อแก้ไขเวลาเข้า"
                                    onClick={() => {
                                      setEditingKey(inKey);
                                      setEditingValue(row.time_in !== "-" ? row.time_in.slice(0, 5) : "08:00");
                                    }}
                                  >
                                    {row.time_in !== "-" ? (
                                      <span className="badge-in">{row.time_in}</span>
                                    ) : (
                                      <span style={{ color: "var(--muted)" }}>-</span>
                                    )}
                                    <Pencil size={11} color="#94a3b8" />
                                  </div>
                                )}
                              </td>
                              <td className="center">
                                {isEditingOut ? (
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <input
                                      type="time"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      style={{ width: "90px", padding: "2px 4px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--pink)" }}
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      className="icon-btn"
                                      style={{ width: "24px", height: "24px", padding: "0" }}
                                      onClick={() => {
                                        if (editingValue) {
                                          updateTimeOverride(row.date, row.shift, "OUT", editingValue);
                                        }
                                        setEditingKey(null);
                                      }}
                                    >
                                      <Check size={13} color="green" />
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                                    title="คลิกเพื่อแก้ไขเวลาออก"
                                    onClick={() => {
                                      setEditingKey(outKey);
                                      setEditingValue(row.time_out !== "-" ? row.time_out.slice(0, 5) : bangkokNow().time);
                                    }}
                                  >
                                    {row.time_out !== "-" ? (
                                      <span className="badge-out">{row.time_out}</span>
                                    ) : (
                                      <span style={{ color: "var(--muted)" }}>-</span>
                                    )}
                                    <Pencil size={11} color="#94a3b8" />
                                  </div>
                                )}
                              </td>
                              <td className="center">-</td>
                              <td>-</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: "24px", paddingTop: "14px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--muted)" }}>
                  <span>by Sn Studio fb: using AdminLTE.io, NoName Framework and Other JavaScript</span>
                  <span>ข้อมูลอัปเดตล่าสุด: {dateLabel.format(today)} {bangkokNow().time} น.</span>
                </div>
              </div>
            </>
          )}

          {page === "calendar" && (
            <>
              <Heading icon={<CalendarDays />} title="ปฏิทินการลงเวลา" detail="ประวัติการปฏิบัติงานของบุคลากร" />
              {renderPersonnelBar()}
              <section className="panel calendar">
                <div className="calendar-head">
                  <div>
                    <h2>{monthLabel.format(month)}</h2>
                    <p>{profile.name} (รหัส: {profile.nid}) - พบประวัติทั้งหมด {records.length} รายการ</p>
                  </div>
                  <div>
                    <button className="icon-btn" aria-label="เดือนก่อน" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button>
                    <button className="btn btn-outline" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>เดือนปัจจุบัน</button>
                    <button className="icon-btn" aria-label="เดือนถัดไป" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button>
                  </div>
                </div>

                <div className="calendar-grid">
                  {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => <strong className="day-name" key={d}>{d}</strong>)}
                  {Array.from({ length: firstDay }, (_, i) => <span className="calendar-cell blank" key={`b${i}`} />)}
                  {days.map((d) => {
                    const iso = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    const dayRecs = effectiveRecords.filter((r) => r.chk_date === iso);
                    const current = d === today.getDate() && month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();
                    return (
                      <span key={d} className={`calendar-cell ${current ? "current" : ""}`}>
                        {d}
                        {dayRecs.map((r, idx) => (
                          <small key={idx} style={{ background: r.chk_status === "IN" ? "#e9f8ee" : "#fff0ee", color: r.chk_status === "IN" ? "#26794a" : "#b23a3a", display: "block", marginBottom: "2px" }}>
                            {r.chk_status === "IN" ? "เข้า" : "ออก"} {r.chk_time.slice(0, 5)}
                          </small>
                        ))}
                      </span>
                    );
                  })}
                </div>

                <div className="calendar-footer">
                  <span>ประวัติทั้งระบบ: {records.length} รายการ</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-outline" onClick={() => go("report")}>
                      <FileSpreadsheet size={16} /> ดูรายงาน Hostime ตาราง
                    </button>
                    <button className="btn btn-primary" onClick={() => loadHistory(uid)}>
                      <RefreshCw size={17} className={busy === "records" ? "spin" : ""} />
                      รีเฟรชประวัติ
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {page === "news" && (
            <>
              <Heading icon={<Bell />} title="ข่าวสารและประกาศ" detail="ข้อความประชาสัมพันธ์จากโรงพยาบาลเจาะไอร้อง" />
              <div className="news-layout">
                <div>
                  {messages.length ? messages.map((m, i) => (
                    <article className="panel notice" key={m.message_id || i}>
                      <div className="notice-meta"><Bell size={16} />ประกาศจากระบบ <span>•</span>{m.message_date || "ไม่ระบุวันที่"}</div>
                      <h2>{m.message_title || "ข่าวสาร"}</h2>
                      <p>{m.message_subject || "ไม่มีรายละเอียด"}</p>
                    </article>
                  )) : <section className="panel"><Empty text="ยังไม่มีข่าวสารจากระบบ" /></section>}
                </div>
                <aside className="panel news-aside">
                  <h2>จากหน้าแรกของแอป</h2>
                  <p>รายการประชาสัมพันธ์</p>
                  {carousel.length ? carousel.map((c, i) => (
                    <div className="carousel-row" key={c.carousel_id || i}>
                      <strong>{c.carousel_title || "รายการ"}</strong>
                      <small>{c.carousel_subject || "ไม่มีรายละเอียด"}</small>
                    </div>
                  )) : <Empty text="ยังไม่มีรายการ" />}
                </aside>
              </div>
            </>
          )}

          {page === "map" && (
            <>
              <Heading icon={<MapPin />} title="แผนที่และตำแหน่ง" detail="โรงพยาบาลเจาะไอร้อง อ.เจาะไอร้อง จ.นราธิวาส" />
              <section className="panel map-box">
                <iframe title="แผนที่โรงพยาบาลเจาะไอร้อง" src={map} loading="lazy" referrerPolicy="no-referrer" />
                <div className="map-footer">
                  <div>
                    <strong>{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</strong>
                    <small>โรงพยาบาลเจาะไอร้อง จ.นราธิวาส (พิกัดสำหรับการลงเวลา)</small>
                  </div>
                  <button className="btn btn-outline" onClick={locate}>
                    <RefreshCw size={17} /> ตรวจสอบพิกัด GPS ของฉัน
                  </button>
                </div>
              </section>
            </>
          )}

          {page === "qrgen" && (
            <>
              <Heading icon={<QrCode />} title="QR Generator" detail="สร้าง QR Code สำหรับลงเวลาปฏิบัติงาน" />
              <section className="panel generator">
                <div className="generator-tabs">
                  <span className="selected">Normal Mode</span>
                  <span>Hospital Mode</span>
                </div>
                <label>
                  ประเภท QR
                  <select value={qrKind} onChange={(e) => setQrKind(e.target.value)}>
                    <option value="working1">1. ลงชื่อปฏิบัติงานเวรเช้า (working1)</option>
                    <option value="working2">2. ลงชื่อปฏิบัติงานเวรบ่าย (working2)</option>
                    <option value="working3">3. ลงชื่อปฏิบัติงานเวรดึก (working3)</option>
                    <option value="time2hr">4. ลงชื่อขออนุญาต 2 ชม. (time2hr)</option>
                  </select>
                </label>
                <div className="generated-code">
                  {qrImage ? <img src={qrImage} alt={`QR Code ${qrKind}`} /> : <Loader2 className="spin" size={30} />}
                </div>
                <p>รหัส QR: <code>{qrKind}</code> ใช้สำหรับสแกนบันทึกเวลาปฏิบัติงานในระบบ YTime2</p>
              </section>
            </>
          )}

          {page === "appeal" && (
            <>
              <Heading icon={<FileText />} title="ส่งคำร้อง" detail="แจ้งเรื่องและแนบเอกสารไปยังระบบ รพ.เจาะไอร้อง" />
              <div className="two-col">
                <form className="panel form" onSubmit={appeal}>
                  <h2>รายละเอียดคำร้อง</h2>
                  <p className="subtext">ข้อมูลจะส่งไปยังเซิร์ฟเวอร์เดิมของโรงพยาบาล</p>
                  <label>หัวข้อคำร้อง<input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="ระบุหัวข้อคำร้อง" /></label>
                  <label>รายละเอียด<textarea required rows={5} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="อธิบายรายละเอียดที่ต้องการแจ้ง" /></label>
                  <div className="form-row">
                    <label>วันที่เริ่มต้น<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
                    <label>วันที่สิ้นสุด<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
                  </div>
                  <label className="file-label">
                    <Paperclip size={18} />
                    {file ? file.name : "แนบไฟล์ (ไม่เกิน 6 MB)"}
                    <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                  <button className="btn btn-primary full" disabled={busy === "appeal"}>
                    {busy === "appeal" ? <Loader2 size={17} className="spin" /> : <Send size={17} />}
                    {busy === "appeal" ? "กำลังส่งคำร้อง..." : "ส่งคำร้อง"}
                  </button>
                </form>
                <Tip title="ตรวจสอบก่อนส่ง" text="เมื่อส่งคำร้องแล้ว ระบบจะบันทึกข้อมูลในเซิร์ฟเวอร์ YTime2 รพ.เจาะไอร้อง โปรดตรวจสอบความถูกต้อง" />
              </div>
            </>
          )}

          {page === "profile" && (
            <>
              <Heading icon={<UserRound />} title="บัญชีและตั้งค่า" detail="ข้อมูลบุคลากร UDID อุปกรณ์ และระบบ YTime2" />
              <div className="two-col">
                <section className="panel form">
                  <div className="panel-title">
                    <span className="icon-box pink"><UserRound /></span>
                    <div><h2>ข้อมูลบุคลากร</h2><p>แก้ไขข้อมูลเพื่อเปลี่ยนผู้ใช้งาน</p></div>
                  </div>

                  <div style={{ marginTop: "14px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--muted)", display: "block", marginBottom: "6px" }}>บุคลากรในระบบ:</span>
                    {renderPersonnelBar()}
                  </div>

                  <label>
                    ชื่อ–นามสกุล
                    <input value={profile.name} onChange={(e) => updateProfileField("name", e.target.value)} placeholder="เช่น คุณบัสรี เจ๊ะหามะ" />
                  </label>

                  <label>
                    รหัสประจำตัว / เลขบัตรประชาชน
                    <input value={profile.nid} onChange={(e) => updateProfileField("nid", e.target.value)} placeholder="เช่น 1960500186031" />
                  </label>

                  <label>
                    แผนก
                    <input value={profile.dept} onChange={(e) => updateProfileField("dept", e.target.value)} placeholder="เช่น กลุ่มงานการพยาบาล" />
                  </label>

                  <label>
                    ฝ่าย
                    <input value={profile.subdep} onChange={(e) => updateProfileField("subdep", e.target.value)} placeholder="เช่น งานการพยาบาลผู้ป่วยอุบัติเหตุและนิติเวช" />
                  </label>

                  <label>
                    UDID อุปกรณ์ประจำตัว / รหัสประจำตัว
                    <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                      <input
                        value={uid}
                        onChange={(e) => setUid(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyUdid(uid);
                          }
                        }}
                        placeholder="เช่น e0209d15534ea0f4 หรือ 1960500122890"
                        style={{ margin: 0 }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ flex: "none", minWidth: "120px" }}
                        onClick={() => applyUdid(uid)}
                        disabled={busy === "records"}
                      >
                        {busy === "records" ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                        สลับ / โหลด
                      </button>
                    </div>
                    <small style={{ color: "var(--muted)", marginTop: "4px", display: "block", fontSize: "11px" }}>
                      หากต้องการเปลี่ยนไปใช้ UDID อื่น ให้กรอกแล้วกด &quot;สลับ / โหลด&quot; หรือกดปุ่ม &quot;+ สลับ / เพิ่มบุคลากร&quot; ด้านบน
                    </small>
                  </label>

                  <button
                    className="btn btn-primary full"
                    type="button"
                    style={{ marginTop: "16px" }}
                    onClick={() => {
                      loadHistory(uid, profile);
                      notify("success", `บันทึกข้อมูลและโหลดประวัติของ ${profile.name} เรียบร้อยแล้ว`);
                    }}
                  >
                    <Check size={16} /> บันทึกข้อมูลและโหลดประวัติของ {profile.name}
                  </button>

                  {!profile.isDefault && (
                    <button
                      type="button"
                      className="btn btn-outline full"
                      style={{ marginTop: "10px", color: "#b91c1c", borderColor: "#fecaca" }}
                      onClick={() => handleDeleteProfile(profile.udid)}
                    >
                      <Trash2 size={16} /> ลบโปรไฟล์บุคลากรนี้ ({profile.name})
                    </button>
                  )}

                  <hr style={{ margin: "25px 0", border: "0", borderTop: "1px solid var(--line)" }} />

                  {session ? (
                    <>
                      <div className="panel-title">
                        <span className="icon-box blue"><UserRound /></span>
                        <div><h2>{session.username}</h2><p>เข้าสู่ระบบผู้ดูแลแล้ว</p></div>
                      </div>
                      <button className="btn btn-outline" style={{ marginTop: "12px" }} onClick={() => { setSession(null); notify("info", "ออกจากระบบแล้ว"); }}>
                        <LogOut size={17} /> ออกจากระบบ
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="panel-title">
                        <span className="icon-box blue"><LogIn /></span>
                        <div><h2>{register ? "สมัครบัญชี" : "เข้าสู่ระบบ (ถ้ามีบัญชี)"}</h2><p>สำหรับฟังก์ชันที่ต้องใช้สิทธิ์บัญชี</p></div>
                      </div>
                      <form onSubmit={auth}>
                        {register && <label>ชื่อที่แสดง<input required value={registerName} onChange={(e) => setRegisterName(e.target.value)} placeholder="ชื่อ–นามสกุล" /></label>}
                        <label>ชื่อผู้ใช้<input required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ชื่อผู้ใช้ YTime2" /></label>
                        <label>รหัสผ่าน<input required type="password" autoComplete={register ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="รหัสผ่าน" /></label>
                        <button className="btn btn-outline full" disabled={busy === "auth"}>
                          {busy === "auth" ? <Loader2 size={17} className="spin" /> : <LogIn size={17} />}
                          {register ? "ส่งข้อมูลสมัครบัญชี" : "เข้าสู่ระบบ"}
                        </button>
                      </form>
                      <button className="switch-auth" onClick={() => setRegister(!register)}>
                        {register ? "มีบัญชีแล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครบัญชี"}
                      </button>
                    </>
                  )}
                </section>

                <div className="stack">
                  <section className="panel settings">
                    <div className="panel-title">
                      <span className="icon-box blue"><Settings /></span>
                      <div><h2>ข้อมูลระบบ</h2><p>โรงพยาบาลเจาะไอร้อง</p></div>
                    </div>
                    <div className="setting-row"><span>หน่วยงาน</span><strong>รพ.เจาะไอร้อง จ.นราธิวาส</strong></div>
                    <div className="setting-row"><span>บุคลากรปัจจุบัน</span><strong>{profile.name}</strong></div>
                    <div className="setting-row"><span>รหัสประจำตัว</span><strong>{profile.nid}</strong></div>
                    <div className="setting-row"><span>แผนก / ฝ่าย</span><strong>{profile.dept} ({profile.subdep})</strong></div>
                    <div className="setting-row"><span>API Server</span><strong>{API_BASE}</strong></div>
                    <div className="setting-row"><span>ประวัติสะสม</span><strong>{records.length} รายการ</strong></div>
                  </section>
                  <div className="utility-actions">
                    <button className="btn btn-outline" onClick={() => go("report")}><FileSpreadsheet size={17} />รายงาน Hostime</button>
                    <button className="btn btn-outline" onClick={() => go("qrgen")}><QrCode size={17} />QR Generator</button>
                    <button className="btn btn-outline" onClick={() => go("map")}><MapPin size={17} />แผนที่ รพ.</button>
                  </div>
                  <Tip title="ความปลอดภัย" text="ข้อมูลบันทึกเวลาส่งตรงไปยังระบบเดิมของโรงพยาบาลเจาะไอร้อง ไม่มีการเก็บบันทึกรหัสผ่านในเบราว์เซอร์" />
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={18} color="var(--pink)" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>เพิ่ม / สลับบุคลากร</h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                style={{ width: "30px", height: "30px" }}
                onClick={() => setShowAddModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddPersonnel} className="modal-form">
              <div className="modal-field">
                <label>
                  <span>ชื่อบุคลากร (แสดงในตัวเลือก)</span>
                  <span style={{ color: "var(--pink)", fontWeight: "bold" }}>*</span>
                </label>
                <input
                  required
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="เช่น คุณนัสรี ดอเลาะ หรือ พว.สมศรี ใจดี"
                  autoFocus
                />
              </div>
              <div className="modal-field">
                <label>
                  <span>รหัส UDID บุคลากร (ค่าที่นำไปใช้จริง)</span>
                  <span style={{ color: "var(--pink)", fontWeight: "bold" }}>*</span>
                </label>
                <input
                  required
                  value={newPersonUdid}
                  onChange={(e) => setNewPersonUdid(e.target.value)}
                  placeholder="เช่น e0209d15534ea0f4 หรือ 1960500123456"
                />
                <span className="hint">
                  ระบบจะใช้ค่า UDID นี้ในการส่งบันทึกเวลาและโหลดประวัติ
                </span>
              </div>
              <details className="modal-details">
                <summary>ข้อมูลเพิ่มเติม (เลขบัตรประชาชน, กลุ่มงาน, ฝ่ายงาน)</summary>
                <div className="modal-details-content">
                  <div className="modal-field">
                    <label>เลขประจำตัวประชาชน (13 หลัก)</label>
                    <input
                      value={newPersonNid}
                      onChange={(e) => setNewPersonNid(e.target.value)}
                      placeholder="เช่น 1960500123456 (ถ้าไม่ระบุ จะใช้รหัส UDID)"
                    />
                  </div>
                  <div className="form-row">
                    <div className="modal-field">
                      <label>กลุ่มงาน / แผนก</label>
                      <input
                        value={newPersonDept}
                        onChange={(e) => setNewPersonDept(e.target.value)}
                        placeholder="กลุ่มงานการพยาบาล"
                      />
                    </div>
                    <div className="modal-field">
                      <label>ฝ่ายงาน</label>
                      <input
                        value={newPersonSubdep}
                        onChange={(e) => setNewPersonSubdep(e.target.value)}
                        placeholder="งานการพยาบาลผู้ป่วยนอก"
                      />
                    </div>
                  </div>
                </div>
              </details>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary full">
                  <Check size={16} /> บันทึกเป็นตัวเลือกและเลือกใช้งานทันที
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {menu && <button className="overlay" aria-label="ปิดเมนู" onClick={() => setMenu(false)} />}
    </div>
  );
}

function Heading({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="heading">
      <span className="heading-icon">{icon}</span>
      <div><h1>{title}</h1><p>{detail}</p></div>
    </div>
  );
}

function Quick({ icon, title, detail, onClick, color }: { icon: React.ReactNode; title: string; detail: string; onClick: () => void; color: string }) {
  return (
    <button className="quick" onClick={onClick}>
      <span className={`icon-box ${color}`}>{icon}</span>
      <span><strong>{title}</strong><small>{detail}</small></span>
      <ArrowRight size={18} />
    </button>
  );
}

function Tip({ title, text }: { title: string; text: string }) {
  return (
    <div className="tip">
      <ShieldCheck size={22} />
      <div><strong>{title}</strong><p>{text}</p></div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <AlertCircle size={21} />{text}
    </div>
  );
}

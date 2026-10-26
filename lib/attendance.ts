export type HistoryItem = {
  chk_date: string;
  chk_time: string;
  chk_status: string;
  chk_cet: string;
  chk_lat?: string;
  chk_lng?: string;
  cet_name?: string;
  cet_description?: string;
};

export type ReportRowItem = {
  id: string;
  rowKey: string;
  date: string;
  shift: string;
  cet_name: string;
  cet_desc: string;
  time_in: string;
  time_out: string;
  status_day: string;
  note: string;
  isCustom?: boolean;
  isLocal?: boolean;
};
export type CustomReportRow = Omit<ReportRowItem, "rowKey"> & { profileId: string };
export type RowMeta = Partial<Pick<ReportRowItem, "date" | "shift" | "cet_desc" | "time_in" | "time_out" | "status_day" | "note">>;
export type ProfileIdentity = { nid: string; udid: string };

export const profileId = (profile: ProfileIdentity) => profile.nid || profile.udid;
export const scopedKey = (profile: ProfileIdentity, key: string) => JSON.stringify([profileId(profile), key]);
function ownedRawKey(profile: ProfileIdentity, key: string): string | undefined {
  if (key.startsWith("[")) {
    try {
      const [id, raw] = JSON.parse(key);
      return id && [profile.nid, profile.udid].includes(id) && typeof raw === "string" ? raw : undefined;
    } catch { return undefined; }
  }
  // Old keys use underscores; only accept a recognizable row key after the ID.
  for (const id of [profile.nid, profile.udid]) {
    if (!id || !key.startsWith(`${id}_`)) continue;
    const raw = key.slice(id.length + 1);
    if (/^(\d{4}-\d{2}-\d{2}_|custom[_-])/.test(raw)) return raw;
  }
}
export const ownsKey = (profile: ProfileIdentity, key: string) => ownedRawKey(profile, key) !== undefined;

// Legacy unscoped values cannot safely be attributed to any person. Keep them
// in storage, but only read entries carrying an explicit personnel identifier.
function readScoped<T>(values: Record<string, T>, profile: ProfileIdentity, key: string): T | undefined {
  return values[scopedKey(profile, key)]
    ?? (profile.nid ? values[`${profile.nid}_${key}`] : undefined)
    ?? (profile.udid ? values[`${profile.udid}_${key}`] : undefined);
}

export function parseCheckResult(data: unknown): { status: "confirmed" | "unknown"; message: string } {
  if (!data || typeof data !== "object") return { status: "unknown", message: "ไม่พบคำตอบยืนยันจากระบบ" };
  const result = data as Record<string, unknown>;
  const msg = typeof result.message === "string" ? result.message : "";
  if (result.error || result.success === false || result.ok === false || ["error", "failed", "denied"].includes(String(result.status))) {
    return { status: "unknown", message: String(result.error || msg || "ระบบไม่รับการลงเวลา") };
  }
  if (msg === "[001-IN]") return { status: "confirmed", message: "ระบบยืนยันการลงเวลาเข้า (IN)" };
  if (msg === "[001-OUT]") return { status: "confirmed", message: "ระบบยืนยันการลงเวลาออก (OUT)" };
  const errors: Record<string, string> = {
    "[001-FULL]": "รอบเวลานี้ลงเวลาเข้าและออกครบแล้ว",
    "[001-QREXPIRE]": "รหัส QR หมดอายุแล้ว",
    "[002-QRCODE]": "รหัส QR ไม่ถูกต้อง",
    "[003-UNREG]": "UDID นี้ยังไม่ได้ลงทะเบียนในระบบ",
    "[004-SCAN_ANOTHER_DEVICE]": "อุปกรณ์ไม่ตรงกับระบบเดิม",
  };
  return { status: "unknown", message: errors[msg] || msg || "ยังไม่ได้รับการยืนยัน กรุณาตรวจประวัติก่อนส่งซ้ำ" };
}

export function shiftDescription(shift: string) {
  return ({ working1: "ลงชื่อปฏิบัติงานเวรเช้า", working2: "ลงชื่อปฏิบัติงานเวรบ่าย", working3: "ลงชื่อปฏิบัติงานเวรดึก", time2hr: "ลงชื่อขออนุญาต 2 ชม." } as Record<string, string>)[shift] || shift;
}

export function buildReportRows(
  records: HistoryItem[], profile: ProfileIdentity, month: string,
  overrides: Record<string, string>, custom: CustomReportRow[],
  meta: Record<string, RowMeta>, deleted: string[],
): ReportRowItem[] {
  if (!profileId(profile)) return [];
  const paired: ReportRowItem[] = [];
  const occurrences = new Map<string, number>();
  const sorted = [...records].sort((a, b) => `${a.chk_date} ${a.chk_time}`.localeCompare(`${b.chk_date} ${b.chk_time}`));
  for (const record of sorted) {
    if (!["IN", "OUT"].includes(record.chk_status)) continue;
    const dayShift = `${record.chk_date}_${record.chk_cet}`;
    const match = record.chk_status === "OUT" ? paired.findLast((row) => row.date === record.chk_date && row.shift === record.chk_cet && row.time_out === "-") : undefined;
    if (match) { match.time_out = record.chk_time; continue; }
    const identity = `${dayShift}_${record.chk_status}_${record.chk_time}`;
    const count = occurrences.get(identity) || 0;
    occurrences.set(identity, count + 1);
    const rowKey = `${identity}_${count}`;
    paired.push({
      id: rowKey, rowKey, date: record.chk_date, shift: record.chk_cet,
      cet_name: record.cet_name || "ลงชื่อปฏิบัติงาน", cet_desc: record.cet_description || shiftDescription(record.chk_cet),
      time_in: record.chk_status === "IN" ? record.chk_time : "-",
      time_out: record.chk_status === "OUT" ? record.chk_time : "-", status_day: "-", note: "-",
    });
  }
  // Explicit local form adjustments may also describe a shift absent from API history.
  const existing = new Set(paired.map((row) => `${row.date}_${row.shift}`));
  for (const key of Object.keys(overrides)) {
    const raw = ownedRawKey(profile, key);
    const match = raw?.match(/^(\d{4}-\d{2}-\d{2})_([^_]+)_(IN|OUT)$/);
    if (!match) continue;
    const [, date, shift] = match;
    const rowKey = `${date}_${shift}`;
    if (existing.has(rowKey)) continue;
    existing.add(rowKey);
    paired.push({ id: rowKey, rowKey, date, shift, cet_name: "ลงชื่อปฏิบัติงาน", cet_desc: shiftDescription(shift), time_in: "-", time_out: "-", status_day: "-", note: "-", isLocal: true });
  }
  paired.push(...custom.filter((row) => Boolean(row.profileId) && [profile.nid, profile.udid].includes(row.profileId)).map((row) => ({ ...row, rowKey: row.id, isCustom: true, isLocal: true })));
  return paired.filter((row) => {
    const legacyKey = `${row.date}_${row.shift}`;
    return ![row.rowKey, ...(!row.isCustom ? [legacyKey] : [])].some((key) =>
      deleted.includes(scopedKey(profile, key)) || [profile.nid, profile.udid].some((id) => id && deleted.includes(`${id}_${key}`)));
  }).map((row) => {
    const legacyKey = `${row.date}_${row.shift}`;
    const timeIn = row.isCustom ? undefined : readScoped(overrides, profile, `${legacyKey}_IN`);
    const timeOut = row.isCustom ? undefined : readScoped(overrides, profile, `${legacyKey}_OUT`);
    const changes = readScoped(meta, profile, row.rowKey) ?? (!row.isCustom ? readScoped(meta, profile, legacyKey) : undefined);
    return { ...row, time_in: timeIn ?? row.time_in, time_out: timeOut ?? row.time_out, ...changes, isLocal: row.isLocal || Boolean(timeIn || timeOut || changes) };
  }).filter((row) => row.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date) || a.shift.localeCompare(b.shift) || a.time_in.localeCompare(b.time_in));
}

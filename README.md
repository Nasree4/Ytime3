# YTime2 Web

เว็บแอปสำหรับบุคลากรที่ใช้งาน YTime2 1.0.0 เดิม สร้างจากหน้าจอและปลายทาง API ที่ตรวจพบใน APK โดยใช้ฐาน API ที่ผู้ใช้ให้มา: `https://choaironghospital.org`.

## การทำงาน

- ดึงข่าวสารและรายการหน้าแรกจริงจาก `/yapi2/v1/message/` และ `/yapi2/v1/carousel/` ผ่าน server proxy
- หน้าลงเวลา: กล้องอ่าน QR (เมื่อเบราว์เซอร์รองรับ `BarcodeDetector`), กรอกรหัสเอง, ขอพิกัด GPS และส่งคำขอไป `/yapi2/v1/check`
- ปฏิทิน: แสดงเดือนและขอสถานะจาก `/yapi2/v1/checkstatus`
- คำร้อง: ส่งข้อมูลไป `/yapi2/v1/appealsave` และไฟล์แนบไป `/yapi2/appealupload.php`
- หน้าแผนที่ใช้ OpenStreetMap เมื่อผู้ใช้อนุญาตตำแหน่ง
- QR Generator สำหรับเวรเช้า/บ่าย/ดึก: ถอดรหัสจากภาพแอปเดิมได้เป็น `working1`, `working2`, `working3` ตามลำดับ รายการขออนุญาต 2 ชั่วโมงยังไม่มี payload ที่ยืนยันได้
- หน้าโปรไฟล์แสดง Web Device ID ของเบราว์เซอร์และมีทางลัด QR Generator / GPS Testing; รหัสนี้ไม่ใช่ Android UDID
- บัญชี: ส่งคำขอ `/yapi2/v1/login` และ `/yapi2/v1/register`; token เก็บใน React state เท่านั้น

## ข้อจำกัดที่ต้องยืนยัน

ไม่มีเอกสาร API หรือบัญชีทดสอบ ฟังก์ชันที่ต้องล็อกอินจึงใช้ชื่อฟิลด์ที่อนุมานจาก APK และยังไม่ผ่านการทดสอบกับบัญชีจริง ตัวเว็บจะไม่แสดงผลสำเร็จหาก API ส่ง HTTP error แต่ schema การตอบกลับบางแบบอาจต้องปรับ `app/page.tsx` และตัวกลาง `app/api/ytime/[action]/route.ts` เพิ่มเติม เมื่อได้ตัวอย่าง request/response หรือทดสอบกับบัญชีที่ได้รับอนุญาต

## รันในเครื่อง

```text
npm install
npm run dev
```

ตั้ง `YTIME_API_BASE_URL` ใน environment หากเซิร์ฟเวอร์เปลี่ยน ดู `.env.example`. ห้ามเก็บรหัสผ่านหรือ token ใน source. Site ที่เผยแพร่เป็น private ตามค่าเริ่มต้น.

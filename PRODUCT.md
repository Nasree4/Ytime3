# YTime2 Web

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Vinext/React with a server-side API adapter, selected for the existing API connection and browser camera/location support.

## Users
บุคลากรที่ใช้ YTime2 เพื่อลงเวลา ดูกิจกรรม ข่าวสาร และส่งคำร้องของหน่วยงาน

## Product Purpose
นำฟังก์ชันของ YTime2 1.0.0 มาใช้งานผ่านเว็บ ทั้งบนมือถือและคอมพิวเตอร์ โดยเชื่อมระบบเดิม

## Operating Context
แอป Android เดิมใช้ QR, ตำแหน่ง GPS, ปฏิทิน, ข่าวสาร, แผนที่, คำร้องพร้อมไฟล์แนบ และบัญชีผู้ใช้

## Capabilities and Constraints
- API base URL ที่ผู้ใช้แสดงในหน้า Config: `https://choaironghospital.org`.
- ปลายทางจาก APK อยู่ใต้ `/yapi2/v1/` และมี `/yapi2/appealupload.php`.
- ข้อมูลข่าวสารและภาพหน้าแรกเปิดอ่านได้โดยไม่ล็อกอิน; การเขียนข้อมูลและรูปแบบบัญชีต้องยืนยันจากเอกสาร API/บัญชีทดสอบ.
- เว็บต้องขอสิทธิ์กล้องและ GPS จากเบราว์เซอร์เมื่อผู้ใช้เริ่มฟังก์ชันนั้น
- ห้ามแสดงข้อมูลตัวอย่างให้ดูเป็นข้อมูลการลงเวลาจริง

## Brand Commitments
ชื่อ YTime2 และสีชมพูเข้มจากแอปเดิม

## Evidence on Hand
APK `C:\Users\HP\Downloads\YTime2_1.0.0_APKPure.apk`, ภาพหน้าจอจากผู้ใช้ และ URL ฐาน API ในภาพ Config. รูปแบบ payload ของปลายทางที่ต้องล็อกอินยังไม่ยืนยัน.

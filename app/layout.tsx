import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YTime2 Web | ระบบลงเวลาบุคลากร",
  description: "ระบบลงเวลา ข่าวสาร ปฏิทิน และคำร้องสำหรับบุคลากร YTime2",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}

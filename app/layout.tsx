import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Material Ops | AI 운영 계획 검토",
  description: "AI 기반 자재관리 운영 계획서 검토 및 승인 지원 시스템"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
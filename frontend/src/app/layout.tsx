import type { Metadata } from "next";
import { Be_Vietnam_Pro, Source_Serif_4 } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const display = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "VAST | Viện Hàn lâm Khoa học và Công nghệ Việt Nam",
  description:
    "Cổng thông tin VAST với chuyên trang Tin nóng KHCN tổng hợp từ nguồn chính thống và báo chí khoa học Việt Nam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        <SiteHeader />
        <main>{children}</main>
        <footer className="site-footer">
          <div className="site-footer__inner">
            <strong>Viện Hàn lâm Khoa học và Công nghệ Việt Nam</strong>
            <p>
              Địa chỉ: Số 18, đường Hoàng Quốc Việt, phường Nghĩa Đô, Thành phố Hà Nội. Demo tổng hợp
              tin KHCN — khi phát hành lại cần ghi rõ nguồn gốc bài viết.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

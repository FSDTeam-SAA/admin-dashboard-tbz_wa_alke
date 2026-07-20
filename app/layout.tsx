import type { Metadata } from "next";
import Script from "next/script";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talk BZ Admin",
  description: "Talk BZ admin dashboard",
  icons: {
    icon: "/brand/tbz-favicon.png",
    shortcut: "/brand/tbz-favicon.png",
    apple: "/brand/tbz-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Script id="remove-extension-hydration-attrs" strategy="beforeInteractive">
          {`
            document.querySelectorAll('[bis_skin_checked]').forEach(function (node) {
              node.removeAttribute('bis_skin_checked');
            });
          `}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

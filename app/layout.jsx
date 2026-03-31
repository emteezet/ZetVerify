import "./globals.css";
import Providers from "@/components/Providers";
import OfflineBanner from "@/components/OfflineBanner";
import SWRegistration from "@/components/SWRegistration";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "ZetVerify",
  description:
    "Securely verify NIN and generate identity slips with ZetVerify. The ultimate identity management solution.",
  keywords: [
    "ZetVerify",
    "NIN",
    "National Identification Number",
    "Nigeria",
    "ID Card",
    "Identity Verification",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZetVerify",
  },
  icons: {
    apple: "/ZetVerify-logo icon.png",
    shortcut: "/ZetVerify-logo icon.png",
  }
};

export const viewport = {
  themeColor: "#19325C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <OfflineBanner />
          {children}
        </Providers>
        <SWRegistration />
        <PWAInstallPrompt />
        <Analytics />
      </body>
    </html>
  );
}

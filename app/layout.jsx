import "./globals.css";
import Providers from "@/components/Providers";
import OfflineBanner from "@/components/OfflineBanner";

export const metadata = {
  title: "NIN Slip Generator | Third-Party Simulation",
  description:
    "A school project simulation of a third-party NIN slip and ID card generator. Not affiliated with NIMC or any government agency.",
  keywords: [
    "NIN",
    "National Identification Number",
    "Nigeria",
    "ID Card",
    "simulation",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <OfflineBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Lato, Roboto, Work_Sans } from "next/font/google";
import { AdPixels } from "@/components/ad-pixels";
import { AppChrome } from "@/components/app-chrome";
import { CompareProvider } from "@/lib/compare";
import { OfficeSessionProvider } from "@/components/cinc/office-session";
import { DemoAuthProvider } from "@/lib/demo-auth";
import { LeadsProvider } from "@/lib/leads";
import { RecentlyViewedProvider } from "@/lib/recently-viewed";
import { SavedHomesProvider } from "@/lib/saved-homes";
import { SavedSearchesProvider } from "@/lib/saved-searches";
import "./globals.css";

const lato = Lato({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const roboto = Roboto({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const workSans = Work_Sans({
  variable: "--font-accent",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Greater Vancouver Area Home Search",
    template: "%s · Greater Vancouver Area Home Search",
  },
  description:
    "Search homes for sale across Metro Vancouver with Archibald Real Estate Group — powered by CINC.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${lato.variable} ${roboto.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <AdPixels />
        <SavedHomesProvider>
          <SavedSearchesProvider>
            <CompareProvider>
              <RecentlyViewedProvider>
                <LeadsProvider>
                  <DemoAuthProvider>
                    <OfficeSessionProvider>
                      <AppChrome>{children}</AppChrome>
                    </OfficeSessionProvider>
                  </DemoAuthProvider>
                </LeadsProvider>
              </RecentlyViewedProvider>
            </CompareProvider>
          </SavedSearchesProvider>
        </SavedHomesProvider>
      </body>
    </html>
  );
}

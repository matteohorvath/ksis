import { type AppType } from "next/app";

import { api } from "@/utils/api";

import "@/styles/globals.css";
import { Inter as FontSans } from "next/font/google";

import { cn } from "@/lib/utils";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <main className={fontSans.className}>
      <Component
        {...pageProps}
        className={cn(
          "min-h-screen bg-background font-sans antialiased ",
          fontSans.className,
        )}
      />
    </main>
  );
};

export default api.withTRPC(MyApp);

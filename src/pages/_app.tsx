import { type AppType } from "next/app";

import { api } from "@/utils/api";

import "@/styles/globals.css";
import { Montserrat as FontSans } from "next/font/google";

import { cn } from "@/lib/utils";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <Component
      {...pageProps}
      className={cn(
        "bg-background min-h-screen font-sans antialiased",
        fontSans.variable,
      )}
    />
  );
};

export default api.withTRPC(MyApp);

import type { Metadata } from "next"
import { DM_Sans, DM_Mono } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
})

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "ReachAI — AI Sales Agent for Real Estate",
  description: "Find, engage, and close real estate leads autonomously.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${dmSans.variable} ${dmMono.variable}`}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--surface-2)",
              border: "1px solid var(--border-2)",
              color: "var(--text-1)",
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  )
}

import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Toaster } from "sonner";

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '한글 퀘스트',
  description: 'Learn Korean while playing!',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={nunito.className}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try { if(localStorage.getItem('hq:darkMode')==='1') document.documentElement.classList.add('dark'); } catch(e){}
        ` }} />
      </head>
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}

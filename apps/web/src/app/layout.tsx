import "./globals.css";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Dark mode no-flash: apply class before paint */}
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

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RPG 2D",
  description: "RPG 2D com classes, mapa e combate",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#0a0a0f' }}>
        {children}
      </body>
    </html>
  );
}
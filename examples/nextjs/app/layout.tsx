import type { Metadata } from 'next';
import '@isometric-design/react/tokens.css';

export const metadata: Metadata = {
  title: 'Isometric Kit — Next.js example',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

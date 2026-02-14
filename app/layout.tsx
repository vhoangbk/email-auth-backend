import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Email Authentication System',
  description: 'Secure email-based authentication backend',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

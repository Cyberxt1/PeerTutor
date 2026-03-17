import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { AppProvider } from '@/lib/context'
import './globals.css'

export const metadata: Metadata = {
  title: 'CampusTutor - Connect with Student Tutors',
  description: 'Find and connect with peer tutors for personalized academic support',
  generator: 'v0.app',
  icons: {
    icon: '/s.png',
    shortcut: '/s.png',
    apple: '/s.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AppProvider>
            {children}
            <Toaster richColors position="top-right" />
            <Analytics />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

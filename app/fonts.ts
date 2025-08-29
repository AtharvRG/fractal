import { Inter, JetBrains_Mono } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const jetbrains_mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],
  variable: '--font-jetbrains-mono',
})
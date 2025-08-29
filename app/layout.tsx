import { WaveBackground } from "@/components/landing/wave-background";
import { DialogHost } from "@/components/dialog-host";
import { ToastHost } from "@/components/toast-host";
import { ProjectLoader } from "@/components/project-loader";
import { inter, jetbrains_mono } from "./fonts";
import "./globals.css";

export const metadata = {
  title: "Fractal – Anchor",
  description: "See the hidden structure of any code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Load the Tree-sitter library globally before any React code runs */}
      </head>
      <body className={`${inter.variable} ${jetbrains_mono.variable} font-sans text-tuna`}>
  <ProjectLoader />
  <DialogHost />
  <ToastHost />
        <WaveBackground />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
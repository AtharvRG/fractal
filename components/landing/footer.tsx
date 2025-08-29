import { Github } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full flex justify-center border-t border-black/10 backdrop-blur-sm">
      <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between p-6 text-sm text-tuna/60">
        <p>© {new Date().getFullYear()} Anchor. Made with ❤️</p>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <Link href="/about" className="transition-colors hover:text-aquamarine">About</Link>
          <Link href="/privacy" className="transition-colors hover:text-aquamarine">Privacy</Link>
          <a href="https://github.com/AtharvRG" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="transition-colors hover:text-aquamarine">
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
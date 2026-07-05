import React from 'react';
import { Link } from 'wouter';
import { Facebook, Twitter, Instagram, Youtube, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-netflix-bg text-gray-500 py-12 px-4 md:px-12 border-t border-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-6 mb-8">
          <a href="https://www.facebook.com/laksubofficial" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Facebook className="w-6 h-6" /></a>
          <a href="#" className="hover:text-white transition-colors"><Instagram className="w-6 h-6" /></a>
          <a href="#" className="hover:text-white transition-colors"><Twitter className="w-6 h-6" /></a>
          <a href="#" className="hover:text-white transition-colors"><Youtube className="w-6 h-6" /></a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-sm">
          <div className="flex flex-col gap-3">
            <Link href="/about" className="hover:underline">About Us</Link>
            <Link href="/faq" className="hover:underline">FAQ</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms of Use</Link>
            <Link href="/dmca" className="hover:underline">DMCA</Link>
            <Link href="/contact" className="hover:underline">Contact Us</Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-white font-bold mb-1 uppercase tracking-widest text-[10px]">Contact Us</p>
            <a href="https://t.me/KaveeshGimhan" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
              Telegram: @KaveeshGimhan
            </a>
          </div>
        </div>

        <div className="text-[11px]">
          © 2026 LAKSUB (Sinhala Subtitles). All rights reserved.
        </div>
      </div>
    </footer>
  );
};

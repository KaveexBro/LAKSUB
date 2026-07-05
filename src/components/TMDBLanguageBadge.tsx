import React, { useState, useEffect } from 'react';
import { getTMDBLanguage } from '../services/tmdbService';

interface TMDBLanguageBadgeProps {
  tmdbId?: number;
  type: 'movie' | 'series';
  className?: string;
}

export default function TMDBLanguageBadge({ tmdbId, type, className }: TMDBLanguageBadgeProps) {
  const [language, setLanguage] = useState<string | null>(null);

  useEffect(() => {
    if (!tmdbId) return;

    const fetchLanguage = async () => {
      try {
        const lang = await getTMDBLanguage(tmdbId, type);
        if (lang) {
          setLanguage(lang);
        }
      } catch (error) {
        console.error('Error fetching TMDB language:', error);
      }
    };

    fetchLanguage();
  }, [tmdbId, type]);

  if (!language) return null;

  return (
    <span className={className || "bg-netflix-red/20 text-netflix-red px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider"}>
      {language}
    </span>
  );
}

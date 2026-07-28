import React, { useState, useCallback } from 'react';
import { getPlaceholderPoster, getPlaceholderBackdrop } from '../utils/imageUtils';

interface MediaImageProps {
  src: string;
  alt: string;
  mediaId: string;
  title: string;
  variant: 'poster' | 'backdrop';
  className?: string;
  loading?: 'lazy' | 'eager';
  onClick?: () => void;
}

const enrichmentCache = new Map<string, { posterUrl?: string; backdropUrl?: string }>();

export const MediaImage: React.FC<MediaImageProps> = ({
  src,
  alt,
  mediaId,
  title,
  variant,
  className = '',
  loading = 'lazy',
  onClick
}) => {
  const placeholder =
    variant === 'poster'
      ? getPlaceholderPoster(title, mediaId)
      : getPlaceholderBackdrop(title, mediaId);

  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTriedEnrich, setHasTriedEnrich] = useState(false);

  const handleError = useCallback(async () => {
    if (!hasTriedEnrich) {
      setHasTriedEnrich(true);

      const cached = enrichmentCache.get(mediaId);
      if (cached) {
        const enriched = variant === 'poster' ? cached.posterUrl : cached.backdropUrl;
        if (enriched) {
          setCurrentSrc(enriched);
          return;
        }
      }

      try {
        const res = await fetch(`/api/media/${mediaId}/enrich-images`);
        if (res.ok) {
          const data = await res.json();
          enrichmentCache.set(mediaId, data);
          const enriched = variant === 'poster' ? data.posterUrl : data.backdropUrl;
          if (enriched) {
            setCurrentSrc(enriched);
            return;
          }
        }
      } catch {
        // fall through to placeholder
      }
    }

    setCurrentSrc(placeholder);
    setIsLoading(false);
  }, [hasTriedEnrich, mediaId, variant, placeholder]);

  return (
    <>
      {isLoading && currentSrc !== placeholder && (
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse z-0" />
      )}
      <img
        src={currentSrc}
        alt={alt}
        loading={loading}
        onClick={onClick}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
        className={`${className} ${isLoading && currentSrc !== placeholder ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />
    </>
  );
};

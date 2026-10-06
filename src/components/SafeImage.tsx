import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * For Pexels photos, offer several widths so phones download a small version
 * instead of the full-size image. Other hosts are returned unchanged.
 */
export function responsiveSrcSet(src?: string): string | undefined {
  if (!src || !src.includes('images.pexels.com')) return undefined;
  try {
    return [480, 800, 1280, 1920]
      .map((w) => {
        const u = new URL(src);
        u.searchParams.set('auto', 'compress');
        u.searchParams.set('cs', 'tinysrgb');
        u.searchParams.set('w', String(w));
        return `${u.toString()} ${w}w`;
      })
      .join(', ');
  } catch {
    return undefined;
  }
}

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Text shown on the placeholder when the image is missing or fails to load. */
  fallbackLabel?: string;
}

/**
 * <img> that never shows the browser's broken-image icon: when `src` is empty
 * or fails to load it renders a branded placeholder of the same size instead.
 */
export default function SafeImage({ src, alt, className = '', fallbackLabel, ...rest }: SafeImageProps) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => setFailed(!src), [src]);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt || fallbackLabel || ''}
        className={`${className} flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black text-yellow-accent/70 industrial-pattern`}
      >
        <ImageOff size={28} strokeWidth={1.5} />
        {fallbackLabel && <span className="text-xs font-semibold text-base-muted px-3 text-center line-clamp-1">{fallbackLabel}</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      srcSet={responsiveSrcSet(src)}
      sizes={rest.sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}

import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';

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

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} {...rest} />;
}

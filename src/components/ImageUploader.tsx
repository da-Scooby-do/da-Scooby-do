import { useState, useRef, useCallback } from 'react';
import { Upload, X, ImageIcon, Loader2, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/compressImage';

interface ImageUploaderProps {
  bucket: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  mainImage?: string;
  onMainImageChange?: (url: string) => void;
  maxImages?: number;
  lang: 'ar' | 'en';
  folder?: string;
  accept?: string;
  label?: string;
  sublabel?: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB — matches equipment-images bucket limit
const MAX_ORIGINAL_SIZE = 40 * 1024 * 1024; // originals are compressed before upload

export default function ImageUploader({
  bucket,
  images,
  onImagesChange,
  mainImage,
  onMainImageChange,
  maxImages = 4,
  lang = 'ar',
  folder,
  accept = 'image/jpeg,image/png,image/webp',
  label,
  sublabel,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isRtl = lang === 'ar';
  const allImages = mainImage ? [mainImage, ...images] : images;
  // maxImages={0} with onMainImageChange = a single-image field (category image, brand logo, site logo).
  const singleImage = maxImages === 0 && !!onMainImageChange;
  const canAddMore = singleImage ? !mainImage : allImages.length < maxImages + (mainImage ? 1 : 0);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const valid = fileArray.filter((f) => ACCEPTED_TYPES.includes(f.type)).slice(0, singleImage ? 1 : undefined);
    if (valid.length === 0) {
      setError(isRtl ? 'صيغ مدعومة: JPG, PNG, WEBP' : 'Supported: JPG, PNG, WEBP');
      return;
    }
    // Photos are shrunk before upload, so allow large originals (e.g. phone camera shots).
    const oversized = valid.filter((f) => f.size > MAX_ORIGINAL_SIZE);
    if (oversized.length > 0) {
      setError(isRtl ? `حجم الملف يتجاوز 40 ميجابايت` : 'File size exceeds 40MB');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const original of valid) {
        // Logos/single images stay small; gallery photos keep more detail.
        const file = await compressImage(original, singleImage ? 1200 : 1600);
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(isRtl ? 'حجم الصورة كبير جداً حتى بعد الضغط (الحد 10 ميجابايت)' : 'Image is still larger than 10MB after compression');
        }
        const ext = file.name.split('.').pop();
        const prefix = folder ? `${folder}/` : '';
        const fileName = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { cacheControl: '31536000', contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        uploaded.push(urlData.publicUrl);
      }
      if (onMainImageChange && !mainImage && uploaded.length > 0) {
        onMainImageChange(uploaded[0]);
        onImagesChange([...images, ...uploaded.slice(1)]);
      } else {
        onImagesChange([...images, ...uploaded]);
      }
    } catch (e: any) {
      setError(e?.message || (isRtl ? 'فشل الرفع' : 'Upload failed'));
    } finally {
      setUploading(false);
    }
  }, [bucket, folder, images, mainImage, onImagesChange, onMainImageChange, isRtl, singleImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }, [uploadFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const removeImage = (idx: number) => {
    if (mainImage && idx === 0) {
      const next = images[0] || '';
      onMainImageChange?.(next);
      onImagesChange(images.slice(1));
    } else {
      const offset = mainImage ? 1 : 0;
      onImagesChange(images.filter((_, i) => i !== idx - offset));
    }
  };

  const setAsMain = (idx: number) => {
    if (idx === 0 && mainImage) return;
    if (mainImage && idx > 0) {
      const galleryIdx = idx - 1;
      const newMain = images[galleryIdx];
      const newGallery = [mainImage, ...images.filter((_, i) => i !== galleryIdx)];
      onMainImageChange?.(newMain);
      onImagesChange(newGallery);
    }
  };

  const moveImage = (idx: number, dir: 'up' | 'down') => {
    if (!mainImage) {
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= images.length) return;
      const arr = [...images];
      [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
      onImagesChange(arr);
    } else {
      const galleryIdx = idx - 1;
      if (galleryIdx < 0) return;
      const swap = dir === 'up' ? galleryIdx - 1 : galleryIdx + 1;
      if (swap < 0 || swap >= images.length) return;
      const arr = [...images];
      [arr[galleryIdx], arr[swap]] = [arr[swap], arr[galleryIdx]];
      onImagesChange(arr);
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <div>
          <label className="block text-xs font-semibold text-base-muted mb-1.5">{label}</label>
          {sublabel && <p className="text-xs text-base-muted mb-2">{sublabel}</p>}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-500">{error}</div>
      )}

      {allImages.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {allImages.map((img, idx) => {
            const isMain = mainImage && idx === 0;
            return (
              <div key={idx} className="relative group rounded-lg overflow-hidden bg-black aspect-square">
                <img src={img} alt="" className="w-full h-full object-cover" />
                {isMain && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-yellow-accent text-black text-[0.6rem] font-bold flex items-center gap-0.5">
                    <Star size={8} fill="currentColor" /> {isRtl ? 'رئيسية' : 'MAIN'}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  {!isMain && onMainImageChange && (
                    <button onClick={() => setAsMain(idx)} className="p-1.5 rounded-md bg-yellow-accent text-black" title={isRtl ? 'تعيين كرئيسية' : 'Set as main'}>
                      <Star size={12} />
                    </button>
                  )}
                  {idx > 0 && (
                    <button onClick={() => moveImage(idx, 'up')} className="p-1.5 rounded-md bg-black/50 text-white" title="Up">
                      <ImageIcon size={12} className="rotate-180" />
                    </button>
                  )}
                  {idx < allImages.length - 1 && (
                    <button onClick={() => moveImage(idx, 'down')} className="p-1.5 rounded-md bg-black/50 text-white" title="Down">
                      <ImageIcon size={12} />
                    </button>
                  )}
                  <button onClick={() => removeImage(idx)} className="p-1.5 rounded-md bg-red-500 text-white" title={isRtl ? 'حذف' : 'Delete'}>
                    <X size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver ? 'border-yellow-accent bg-yellow-accent/10' : 'border-base hover:border-yellow-accent/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={!singleImage}
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ''; }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={28} className="animate-spin text-yellow-accent" />
              <span className="text-sm text-base-muted">{isRtl ? 'جاري الرفع...' : 'Uploading...'}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center">
                <Upload size={22} className="text-yellow-accent" />
              </div>
              <span className="text-sm font-semibold text-base-primary">
                {isRtl ? 'اسحب وأفلت الصور هنا' : 'Drag & drop images here'}
              </span>
              <span className="text-xs text-base-muted">
                {isRtl ? 'أو اضغط للاختيار' : 'or click to browse'} — JPG, PNG, WEBP
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

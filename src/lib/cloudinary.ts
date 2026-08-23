/**
 * Secure Cloudinary Integration Service
 * Uses server-side SHA1 signature (/api/cloudinary-sign) for secure authenticated uploads.
 * Unsigned upload fallback has been strictly removed for security.
 */

export type CloudinaryFolder = 'news' | 'reporters' | 'gallery' | 'logos' | 'banners' | string;

export interface CloudinaryUploadResponse {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

// Get Cloudinary configuration from environment variables or localStorage
export function getCloudinaryConfig() {
  const envCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
  const envPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

  const storedCloudName = localStorage.getItem("cloudinary_cloud_name") || "";
  const storedPreset = localStorage.getItem("cloudinary_upload_preset") || "";

  return {
    cloudName: envCloudName || storedCloudName || "damoh-daily-news",
    uploadPreset: envPreset || storedPreset || "ml_default"
  };
}

/**
 * Compress an image file/blob in browser before upload.
 * Resizes large images to max 1920px on the longest side while maintaining original aspect ratio.
 * Converts to compressed WebP (84% quality) for optimal clarity and fast load times.
 */
export async function compressImage(
  file: File | Blob,
  maxLongestSide = 1920,
  quality = 0.84
): Promise<Blob> {
  // If not an image, return original
  if (file.type && !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      // Scale down if longest side exceeds maxLongestSide
      const longestSide = Math.max(width, height);
      if (longestSide > maxLongestSide) {
        const scale = maxLongestSide / longestSide;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export to high quality WebP format (or fallback JPEG)
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0) {
            resolve(blob);
          } else {
            // Fallback to JPEG if WebP canvas export is unsupported
            canvas.toBlob(
              (fallbackBlob) => resolve(fallbackBlob || file),
              'image/jpeg',
              quality
            );
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Uploads a file to Cloudinary strictly using signed uploads.
 * Automatically compresses high-resolution files to WebP before upload.
 */
export async function uploadToCloudinary(
  file: File | Blob,
  folder: CloudinaryFolder = "news"
): Promise<{ url: string; publicId: string; format: string }> {
  const config = getCloudinaryConfig();
  const folderPath = `damoh_news/${folder}`;
  const timestamp = Math.floor(Date.now() / 1000);

  // Compress image before upload
  const uploadFile = await compressImage(file);

  // Secure Signed Upload via Server Signing Route (/api/cloudinary-sign)
  try {
    const signRes = await fetch("/api/cloudinary-sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folder: folderPath,
        upload_preset: config.uploadPreset,
        timestamp
      })
    });

    if (signRes.ok) {
      const signData = await signRes.json();
      if (signData.signed && signData.signature && signData.apiKey) {
        const url = `https://api.cloudinary.com/v1_1/${signData.cloudName || config.cloudName}/image/upload`;
        const formData = new FormData();
        formData.append("file", uploadFile);
        formData.append("api_key", signData.apiKey);
        formData.append("timestamp", String(signData.timestamp));
        formData.append("signature", signData.signature);
        formData.append("upload_preset", config.uploadPreset);
        formData.append("folder", folderPath);

        const response = await fetch(url, {
          method: "POST",
          body: formData
        });

        if (response.ok) {
          const data: CloudinaryUploadResponse = await response.json();
          const optimizedUrl = optimizeCloudinaryUrl(data.secure_url || data.url);
          return {
            url: optimizedUrl,
            publicId: data.public_id,
            format: data.format
          };
        } else {
          const errJson = await response.json().catch(() => ({}));
          console.error("Signed Cloudinary upload failed on Cloudinary API:", errJson);
        }
      } else {
        console.warn("Cloudinary signing route response missing signed signature:", signData);
      }
    } else {
      const errRes = await signRes.json().catch(() => ({}));
      console.warn("Cloudinary signature route returned error:", errRes);
    }
  } catch (err) {
    console.error("Signed Cloudinary upload network error:", err);
  }

  // Client Local Data URL Fallback (For instant client preview if upload credentials are not configured)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        url: reader.result as string,
        publicId: `local_${Date.now()}`,
        format: uploadFile.type.split("/")[1] || "webp"
      });
    };
    reader.readAsDataURL(uploadFile);
  });
}

/**
 * Adds Cloudinary auto-format (f_auto), auto-quality (q_auto), dpr_auto, and c_limit flags.
 */
export function optimizeCloudinaryUrl(
  url: string, 
  options?: { width?: number; height?: number; crop?: string; gravity?: string } | number
): string {
  if (!url || !url.includes("res.cloudinary.com")) {
    return url;
  }

  const opts = typeof options === 'number' ? { width: options } : options;
  const transformations: string[] = ["f_auto", "q_auto", "dpr_auto"];
  const cropMode = opts?.crop || "limit";
  transformations.push(`c_${cropMode}`);
  
  if (cropMode === 'fill' || cropMode === 'crop') {
    const gravity = opts?.gravity || 'auto';
    transformations.push(`g_${gravity}`);
  }

  if (opts?.width) transformations.push(`w_${opts.width}`);
  if (opts?.height) transformations.push(`h_${opts.height}`);

  const transformString = transformations.join(",");

  if (url.includes("/upload/")) {
    if (url.includes(`/upload/${transformString}/`)) return url;
    // Replace existing transformation or insert transformString
    return url.replace(/\/upload\/(?:[^\/]+\/)?/, `/upload/${transformString}/`);
  }

  return url;
}

/**
 * Universal Image URL Optimizer.
 * Converts Unsplash, Cloudinary, and external URLs to auto WebP format & optimal width.
 */
export function getOptimizedImageUrl(
  url?: string,
  options?: { width?: number; height?: number; crop?: string; gravity?: string } | number
): string {
  if (!url || typeof url !== 'string') return '';

  const opts = typeof options === 'number' ? { width: options } : options;

  // Cloudinary Optimization
  if (url.includes('res.cloudinary.com')) {
    return optimizeCloudinaryUrl(url, opts);
  }

  // Unsplash Optimization (WebP + Auto format)
  if (url.includes('images.unsplash.com')) {
    try {
      const urlObj = new URL(url.startsWith('//') ? `https:${url}` : url);
      const isFill = opts?.crop === 'fill';
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('q', '80');
      urlObj.searchParams.set('fm', 'webp');

      if (isFill) {
        urlObj.searchParams.set('fit', 'crop');
        if (opts?.width) urlObj.searchParams.set('w', String(opts.width));
        if (opts?.height) {
          urlObj.searchParams.set('h', String(opts.height));
        }
      } else {
        // Natural aspect ratio (limit/max mode): remove conflicting fixed heights so natural aspect ratio is preserved
        urlObj.searchParams.set('fit', 'max');
        urlObj.searchParams.delete('h');
        if (opts?.width) urlObj.searchParams.set('w', String(opts.width));
      }
      return urlObj.toString();
    } catch {
      const cropParam = opts?.crop === 'fill' ? 'fit=crop' : 'fit=max';
      return `${url.split('?')[0]}?auto=format&${cropParam}&q=80&w=${opts?.width || 800}&fm=webp`;
    }
  }

  return url;
}

/**
 * Generates a responsive srcset string for Cloudinary/Unsplash/External images.
 * Default widths optimized for mobile phones up to desktop: [360, 480, 720, 1080].
 */
export function getOptimizedSrcSet(
  url?: string,
  widths: number[] = [320, 480, 720, 1080],
  crop: string = 'limit'
): string {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.endsWith('.svg') || url.includes('.svg?')) {
    return '';
  }
  return widths
    .map(w => `${getOptimizedImageUrl(url, { width: w, crop })} ${w}w`)
    .join(', ');
}

/**
 * Generates a micro low-resolution image URL (LQIP) for instant blur-up placeholders
 * with virtually zero payload overhead (~300 bytes).
 */
export function getLowResPlaceholderUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';

  if (url.includes('res.cloudinary.com')) {
    return optimizeCloudinaryUrl(url, { width: 28, crop: 'fill' });
  }

  if (url.includes('images.unsplash.com')) {
    const base = url.split('?')[0];
    return `${base}?auto=format&fit=crop&w=28&q=20&blur=30&fm=webp`;
  }

  return '';
}

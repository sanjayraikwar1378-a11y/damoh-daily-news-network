/**
 * Cloudinary Integration Service
 * Supports both Signed Uploads (via /api/cloudinary-sign server API route for presets like 'ml_default')
 * and Unsigned Uploads directly from browser with folder organization & WebP/AVIF optimizations.
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
 * Uploads a file to Cloudinary into a designated folder.
 * Supports signed uploads (using server-side SHA1 signature) and unsigned uploads.
 */
export async function uploadToCloudinary(
  file: File | Blob,
  folder: CloudinaryFolder = "news"
): Promise<{ url: string; publicId: string; format: string }> {
  const config = getCloudinaryConfig();
  const folderPath = `damoh_news/${folder}`;
  const timestamp = Math.floor(Date.now() / 1000);

  // 1. Try Signed Upload via Server Signing Route (/api/cloudinary-sign)
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
        formData.append("file", file);
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
          console.warn("Signed Cloudinary upload returned error, trying unsigned fallback:", errJson);
        }
      }
    }
  } catch (err) {
    console.warn("Server signing route unavailable or failed:", err);
  }

  // 2. Direct Unsigned Upload Fallback
  const unsignedUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", config.uploadPreset);
  formData.append("folder", folderPath);

  try {
    const response = await fetch(unsignedUrl, {
      method: "POST",
      body: formData,
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
      const errorData = await response.json().catch(() => ({}));
      console.warn("Cloudinary upload failed:", errorData);
    }
  } catch (error) {
    console.error("Cloudinary request error:", error);
  }

  // 3. Client Local Data URL Fallback
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        url: reader.result as string,
        publicId: `local_${Date.now()}`,
        format: file.type.split("/")[1] || "jpeg"
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Adds Cloudinary auto-format (f_auto) and auto-quality (q_auto) flags to any Cloudinary image URL.
 */
export function optimizeCloudinaryUrl(
  url: string, 
  options?: { width?: number; height?: number; crop?: string }
): string {
  if (!url || !url.includes("res.cloudinary.com")) {
    return url;
  }

  const transformations: string[] = ["f_auto", "q_auto"];
  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.crop) transformations.push(`c_${options.crop}`);

  const transformString = transformations.join(",");

  return url.replace("/upload/", `/upload/${transformString}/`);
}

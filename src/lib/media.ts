/** Lit une image et la réduit (max 1000 px, JPEG) pour tenir dans le stockage local. */
export function readImageFile(file: File, max = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(r.error);
    r.onload = () => {
      const src = String(r.result);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        const ctx = c.getContext("2d");
        if (!ctx) return resolve(src);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    r.readAsDataURL(file);
  });
}

/** Extrait une vignette + durée d'un fichier vidéo importé. */
export function readVideoFile(file: File): Promise<{ thumb: string | null; duration: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.src = url;
    const done = (thumb: string | null) => {
      resolve({ thumb, duration: Math.max(1, Math.round(v.duration || 10)) });
      URL.revokeObjectURL(url);
    };
    v.onloadeddata = () => {
      v.currentTime = Math.min(1, (v.duration || 2) / 2);
    };
    v.onseeked = () => {
      try {
        const c = document.createElement("canvas");
        const scale = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight));
        c.width = Math.round(v.videoWidth * scale);
        c.height = Math.round(v.videoHeight * scale);
        c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
        done(c.toDataURL("image/jpeg", 0.75));
      } catch {
        done(null);
      }
    };
    v.onerror = () => done(null);
    setTimeout(() => done(null), 4000);
  });
}

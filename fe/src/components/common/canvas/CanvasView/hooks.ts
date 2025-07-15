import { useEffect, useState } from "react";

export function useUploadedImage(textureUrl: string) {
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement>();

  useEffect(
    function loadUploadedImage() {
      if (!textureUrl) {
        setUploadedImage(undefined);
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setUploadedImage(img);
      img.onerror = () => setUploadedImage(undefined);
      img.src = textureUrl;
    },
    [textureUrl]
  );

  return uploadedImage;
}

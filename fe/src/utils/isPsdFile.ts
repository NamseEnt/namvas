export function isPsdFile(file: File): boolean {
  return (
    file.name.toLowerCase().endsWith(".psd") || isPsdContentType(file.type)
  );
}

export function isPsdContentType(contentType: string): boolean {
  return [
    "image/vnd.adobe.photoshop",
    "application/x-photoshop",
    "application/photoshop",
    "application/psd",
    "image/psd",
  ].includes(contentType);
}

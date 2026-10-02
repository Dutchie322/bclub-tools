/**
 * Converts a base64 data URL into a Blob. Does not use `fetch`, because the
 * extension's content security policy does not allow fetching data URLs.
 *
 * @param dataUrl A data URL in the form `data:<mime>;base64,<data>`
 * @returns A Blob with the decoded data and the mime type of the data URL
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const separator = dataUrl.indexOf(',');
  const type = dataUrl.substring(5, separator).split(';')[0];
  const binary = atob(dataUrl.substring(separator + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type });
}

/**
 * Determines the file extension for an appearance image, which is either a
 * Blob or a legacy PNG data URL.
 */
export function appearanceImageExtension(image: Blob | string): string {
  const type = typeof image === 'string'
    ? image.substring(5, image.indexOf(';'))
    : image.type;

  return type === 'image/webp' ? 'webp' : 'png';
}

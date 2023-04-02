import { decompressFromUTF16 } from 'lz-string';

export function decompress(input: string): string {
  if (input && input[0] === '╬') {
    return decompressFromUTF16(input.substring(1));
  }
  return input;
}

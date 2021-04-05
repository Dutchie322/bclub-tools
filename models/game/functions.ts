import LZString from 'lz-string';

export function decompress(input: string): string {
  if (input && input[0] === '╬') {
    return LZString.decompressFromUTF16(input.substr(1));
  }
  return input;
}

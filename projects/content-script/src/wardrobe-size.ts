export function increaseWardrobeSize(_: string, size: number) {
  if (size > WardrobeSize) {
    // Prevent overwriting the wardrobe size with something smaller, as that would
    // result in lost outfits.
    WardrobeSize = size;
  }
}

/** Canonical Unsplash CDN URL for product photos. */
export function productImageUrl(photoId: string, width = 800): string {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=80`;
}

/** Verified Unsplash photo paths used in the catalog. */
export const catalogPhotos = {
  tee: "photo-1521572163474-6864f9cf17ab",
  trousers: "photo-1594938298603-c8148c4dae35",
  shellJacket: "photo-1551028719-00167b16eac5",
  merinoSweater: "photo-1576566588028-4147f3842f27",
  sneaker: "photo-1549298916-b41d501d3772",
  linenShirt: "photo-1552374196-c4e7ffc6e126",
  denimJacket: "photo-1544022613-e87ca75a784a",
  overcoat: "photo-1539533018447-63fcce2678e3",
  runningShort: "photo-1591195853828-11db59a44f6b",
  scarf: "photo-1591047139829-d91aecb6caea",
  hikingBoot: "photo-1608256246200-53e635b5b65f",
  hoodie: "photo-1556821840-3a63f95609a7",
  silkBlouse: "photo-1564257631407-4deb1f99d992",
  polo: "photo-1583743814966-8936f5b7be1a",
  parka: "photo-1515886657613-9f3515b0c78f",
  crossbody: "photo-1548036328-c9fa89d128fa",
  tattersallShirt: "photo-1564257631407-4deb1f99d992",
  moleskinJacket: "photo-1539533018447-63fcce2678e3",
} as const;

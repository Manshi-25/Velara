// src/lib/randomDreamImage.ts

export function generateDreamImage() {
  const randomId = Math.floor(Math.random() * 1000);

  return `https://picsum.photos/seed/${randomId}/1200/800`;
}
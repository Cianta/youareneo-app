// Öffentliche Werte (publishable key ist für den Browser gedacht, Zugriff regelt RLS).
window.NEO_CONFIG = {
  supabaseUrl: 'https://emxqoahtipbmumghlixb.supabase.co',
  supabaseKey: 'sb_publishable_LPbsKEws5DMQLcKix0X2AQ_VtYNbO-P',
  bucket: 'books',
  shopUrl: 'https://youareneo.com',
  // Katalog: product = Eintrag in public.neo_access UND Ordnername im Bucket "books".
  books: [
    {
      product: 'schoepfungsschluessel-ebook',
      title: 'Der Schöpfungsschlüssel',
      subtitle: '12 × 12 Geschichten zur Selbstermächtigung',
      author: 'Hannes Höller',
      kind: 'ebook',
      file: 'schoepfungsschluessel.epub',
      cover: 'cover.jpg',
      buy: 'https://youareneo.com/products/der-schopfungsschlussel-buch',
    },
    // Hörbuch später: product 'schoepfungsschluessel-audio', kind 'audio',
    // files: ['01.mp3', '02.mp3', ...] (Kapitel in Reihenfolge)
  ],
};

// The parts of the website the guide can change from the admin ("Faqja" screen).
// Each slot is either a photo or a text. The website falls back to its built-in default while a slot is empty.
// To make something else editable: add it here, then add data-slot="key" (text) or data-slot-img="key" (photo)
// to the element in the page's HTML.
//
// `label` and `hint` are shown in the admin (Albanian). `fallback` is the English text the site ships with.
// In text slots, *word* is shown with the outlined style used in the headlines.

export const SLOTS = [
  // Home
  { key: 'home.hero_image', type: 'image', page: 'Home', label: 'Foto kryesore', hint: 'Fotoja e madhe në krye të faqes Home. Format horizontal ose vertikal, ideale 4:5.' },
  { key: 'home.hero_title', type: 'text', page: 'Home', label: 'Titulli kryesor', hint: 'Vendos *yje* rreth fjalës që do të dalë me kontur.', fallback: 'Small-group *days* with a local guide.' },
  { key: 'home.hero_lead', type: 'text', page: 'Home', label: 'Nën-titulli', fallback: 'A private day for three or four people, at your pace, with someone who grew up here.' },
  // Tours
  { key: 'tours.cover', type: 'image', page: 'Tours', label: 'Foto kopertinë', hint: 'Shfaqet pas titullit të faqes Tours.' },
  { key: 'tours.title', type: 'text', page: 'Tours', label: 'Titulli', fallback: 'Our days, one local guide.' },
  { key: 'tours.lead', type: 'text', page: 'Tours', label: 'Nën-titulli', fallback: 'Every day is private for up to four guests. Don’t see what you want? I’ll build a custom day around your trip.' },
  // About
  { key: 'about.cover', type: 'image', page: 'About', label: 'Foto kopertinë', hint: 'Shfaqet pas titullit të faqes About.' },
  { key: 'about.portrait', type: 'image', page: 'About', label: 'Foto e guidës', hint: 'Foto e madhe pranë tekstit "My story". Ideale 3:4.' },
  { key: 'about.title', type: 'text', page: 'About', label: 'Titulli', fallback: 'Hi, I’m your guide.' },
  { key: 'about.lead', type: 'text', page: 'About', label: 'Nën-titulli', fallback: 'I grew up in Albania and I still get excited by a good road trip. This is the job I always wanted.' },
  // Journal
  { key: 'journal.cover', type: 'image', page: 'Journal', label: 'Foto kopertinë', hint: 'Shfaqet pas titullit të faqes Journal.' },
  { key: 'journal.title', type: 'text', page: 'Journal', label: 'Titulli', fallback: 'Stories from the road.' },
  { key: 'journal.lead', type: 'text', page: 'Journal', label: 'Nën-titulli', fallback: 'Days we spent with our groups, routes worth stealing and honest tips from a local guide.' },
  // Contact
  { key: 'contact.cover', type: 'image', page: 'Contact', label: 'Foto kopertinë', hint: 'Shfaqet pas titullit të faqes Contact.' },
  { key: 'contact.title', type: 'text', page: 'Contact', label: 'Titulli', fallback: 'Book a day.' },
  { key: 'contact.lead', type: 'text', page: 'Contact', label: 'Nën-titulli', fallback: 'Tell me when you’re in Albania and what you’d love to see. I reply within 24 hours, usually faster.' }
];

export const SLOT_BY_KEY = Object.fromEntries(SLOTS.map((s) => [s.key, s]));

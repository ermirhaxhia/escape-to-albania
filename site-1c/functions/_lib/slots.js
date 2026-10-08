// The parts of the website the guide can change from the admin ("Faqja" screen).
// Each slot is a photo, a text, an on/off switch ('toggle') or a number stored in the settings table ('setting').
// The website falls back to its built-in default while a slot is empty.
// To make something else editable: add it here, then add data-slot="key" (text) or data-slot-img="key" (photo)
// to the element in the page's HTML.
//
// `label` and `hint` are shown in the admin (Albanian). `fallback` is the English text the site ships with.
// In text slots, *word* is shown with the outlined style used in the headlines, and {max} becomes the group limit.
// Titles are always the page's single H1 and the lines under them are paragraphs: the guide edits the words, not the structure.

export const SLOTS = [
  // Home
  { key: 'home.hero_image', type: 'image', page: 'Home', label: 'Foto kryesore', hint: 'Fotoja e madhe në krye të faqes Home. Ideale horizontale, rreth 6:5 (p.sh. 1800 × 1500 px). Pritet vetë që të mbushë kornizën.' },
  { key: 'home.badge', type: 'toggle', page: 'Home', label: 'Rrethi mbi foto "Max … guests"', hint: 'Shfaq ose fshih rrethin e kuq mbi foto. Numri merret nga "Maks. mysafirë për grup" më poshtë.' },
  { key: 'home.hero_title', type: 'text', page: 'Home', label: 'Titulli kryesor (H1)', hint: 'Një titull i vetëm për faqe: Google e lexon si temën e faqes. Vendos *yje* rreth fjalës që do të dalë me kontur, p.sh. *days*.', fallback: 'Small-group *days* with a local guide.' },
  { key: 'home.hero_lead', type: 'text', page: 'Home', label: 'Nën-titulli (paragraf)', hint: 'Një ose dy fjali nën titull. Mund të shkruash {max} për numrin e mysafirëve.', fallback: 'A private day for a small group, at your pace, with someone who grew up here.' },
  // Tours
  { key: 'tours.cover', type: 'image', page: 'Tours', label: 'Foto kopertinë', hint: 'Shfaqet pas titullit të faqes Tours.' },
  { key: 'tours.title', type: 'text', page: 'Tours', label: 'Titulli (H1)', hint: 'Titulli kryesor i faqes (një për faqe).', fallback: 'Our days, one local guide.' },
  { key: 'tours.lead', type: 'text', page: 'Tours', label: 'Nën-titulli (paragraf)', fallback: 'Every day is private for up to {max} guests. Don’t see what you want? I’ll build a custom day around your trip.' },
  // About
  { key: 'about.cover', type: 'image', page: 'About', label: 'Foto kopertinë', hint: 'Shfaqet pas titullit të faqes About.' },
  { key: 'about.portrait', type: 'image', page: 'About', label: 'Foto e guidës', hint: 'Foto e madhe pranë tekstit "My story". Ideale 3:4.' },
  { key: 'about.title', type: 'text', page: 'About', label: 'Titulli (H1)', hint: 'Titulli kryesor i faqes (një për faqe).', fallback: 'Hi, I’m your guide.' },
  { key: 'about.lead', type: 'text', page: 'About', label: 'Nën-titulli (paragraf)', fallback: 'I grew up in Albania and I still get excited by a good road trip. This is the job I always wanted.' },
  // Journal
  { key: 'journal.cover', type: 'image', page: 'Journal', label: 'Foto kopertinë', hint: 'Shfaqet pas titullit të faqes Journal.' },
  { key: 'journal.title', type: 'text', page: 'Journal', label: 'Titulli (H1)', hint: 'Titulli kryesor i faqes (një për faqe).', fallback: 'Stories from the road.' },
  { key: 'journal.lead', type: 'text', page: 'Journal', label: 'Nën-titulli (paragraf)', fallback: 'Days we spent with our groups, routes worth stealing and honest tips from a local guide.' },
  // Contact
  { key: 'contact.cover', type: 'image', page: 'Contact', label: 'Foto kopertinë', hint: 'Shfaqet pas titullit të faqes Contact.' },
  { key: 'contact.title', type: 'text', page: 'Contact', label: 'Titulli (H1)', hint: 'Titulli kryesor i faqes (një për faqe).', fallback: 'Book a day.' },
  { key: 'contact.lead', type: 'text', page: 'Contact', label: 'Nën-titulli (paragraf)', fallback: 'Tell me when you’re in Albania and what you’d love to see. I reply within 24 hours, usually faster.' },
  // General
  { key: 'general.max_guests', type: 'setting', setting: 'default_max_guests', page: 'Të përgjithshme', label: 'Maks. mysafirë për grup', hint: 'Shfaqet kudo në faqe (rrethi mbi foto, tekstet, lista te formulari) dhe kufizon rezervimet. Një tur mund të ketë kufirin e vet.', min: 1, max: 50 }
];

export const SLOT_BY_KEY = Object.fromEntries(SLOTS.map((s) => [s.key, s]));

// The parts of the website the guide can change from the admin ("Faqja" screen).
// Each slot is a photo, a text, an on/off switch ('toggle') or a number stored in the settings table ('setting').
// The website falls back to its built-in default while a slot is empty.
// To make something else editable: add it here, then add data-slot="key" (text) or data-slot-img="key" (photo)
// to the element in the page's HTML.
//
// `page` and `section` decide where it appears in the admin (sections are folded away except the first one).
// `label` is shown in the admin (Albanian). `fallback` is the English text the site ships with.
// In text slots, *word* is shown with the outlined style used in the headlines, and {max} becomes the group limit.
// Titles are always the page's H1/H2 and the lines under them are paragraphs: the guide edits the words, not the structure.

const cover = (page, key, extra) => [
  { key: key + '.cover', type: 'image', page, section: 'Kopertina', label: 'Foto kopertinë' },
  ...(extra || [])
];

export const SLOTS = [
  // ---- Home
  { key: 'home.hero_image', type: 'image', page: 'Home', section: 'Kopertina', label: 'Foto kryesore' },
  { key: 'home.badge', type: 'toggle', page: 'Home', section: 'Kopertina', label: 'Rrethi mbi foto "Max … guests"' },
  { key: 'home.hero_title', type: 'text', page: 'Home', section: 'Kopertina', label: 'Titulli kryesor (H1)', fallback: 'Small-group *days* with a local guide.' },
  { key: 'home.hero_lead', type: 'text', page: 'Home', section: 'Kopertina', label: 'Nën-titulli (paragraf)', fallback: 'A private day for a small group, at your pace, with someone who grew up here.' },

  { key: 'home.tours_title', type: 'text', page: 'Home', section: 'Turet e zgjedhura', label: 'Titulli i seksionit (H2)', fallback: 'Popular day trips in Albania, or invent your own.' },

  { key: 'home.how_title', type: 'text', page: 'Home', section: 'Si funksionon', label: 'Titulli i seksionit (H2)', fallback: 'Three steps, no packages.' },
  { key: 'home.step1_title', type: 'text', page: 'Home', section: 'Si funksionon', label: 'Hapi 1: titulli', fallback: 'Tell me your dates' },
  { key: 'home.step1_text', type: 'text', page: 'Home', section: 'Si funksionon', label: 'Hapi 1: teksti', fallback: 'Send me the days you’re in Albania, how many of you there are and what you love: food, hiking, history or the sea.' },
  { key: 'home.step2_title', type: 'text', page: 'Home', section: 'Si funksionon', label: 'Hapi 2: titulli', fallback: 'I plan your day' },
  { key: 'home.step2_text', type: 'text', page: 'Home', section: 'Si funksionon', label: 'Hapi 2: teksti', fallback: 'You get a simple plan with timings and a fixed price. Change anything you like, it’s your day.' },
  { key: 'home.step3_title', type: 'text', page: 'Home', section: 'Si funksionon', label: 'Hapi 3: titulli', fallback: 'We go' },
  { key: 'home.step3_text', type: 'text', page: 'Home', section: 'Si funksionon', label: 'Hapi 3: teksti', fallback: 'I pick you up at your hotel and we take the day at your pace. Long lunches and photo stops are included.' },

  { key: 'home.why_title', type: 'text', page: 'Home', section: 'Pse një vendas', label: 'Titulli i seksionit (H2)', fallback: 'Albania, through someone’s own door.' },
  { key: 'home.why1_title', type: 'text', page: 'Home', section: 'Pse një vendas', label: 'Karta 1: titulli', fallback: 'Never more than {max}' },
  { key: 'home.why1_text', type: 'text', page: 'Home', section: 'Pse një vendas', label: 'Karta 1: teksti', fallback: 'A private day, not a bus. No strangers, no schedule you didn’t choose.' },
  { key: 'home.why2_title', type: 'text', page: 'Home', section: 'Pse një vendas', label: 'Karta 2: titulli', fallback: 'Born and raised here' },
  { key: 'home.why2_text', type: 'text', page: 'Home', section: 'Pse një vendas', label: 'Karta 2: teksti', fallback: 'Family restaurants, quiet beaches and the stories behind the ruins.' },
  { key: 'home.why3_title', type: 'text', page: 'Home', section: 'Pse një vendas', label: 'Karta 3: titulli', fallback: 'Your pace' },
  { key: 'home.why3_text', type: 'text', page: 'Home', section: 'Pse një vendas', label: 'Karta 3: teksti', fallback: 'Stay longer where you love it. Skip what you don’t. I’ll adjust on the road.' },
  { key: 'home.why4_title', type: 'text', page: 'Home', section: 'Pse një vendas', label: 'Karta 4: titulli', fallback: 'Clear prices' },
  { key: 'home.why4_text', type: 'text', page: 'Home', section: 'Pse një vendas', label: 'Karta 4: teksti', fallback: 'One price per person, with transport, entrance fees and lunch listed up front.' },

  { key: 'home.journal_title', type: 'text', page: 'Home', section: 'Journal', label: 'Titulli i seksionit (H2)', fallback: 'Stories and tips from Albania.' },

  { key: 'home.cta_title', type: 'text', page: 'Home', section: 'Thirrja e fundit', label: 'Titulli (H2)', fallback: 'Ready for your day in Albania?' },
  { key: 'home.cta_text', type: 'text', page: 'Home', section: 'Thirrja e fundit', label: 'Teksti', fallback: 'Tell me your dates and what you love. I’ll reply within a day with a plan that fits.' },
  { key: 'home.cta_button', type: 'text', page: 'Home', section: 'Thirrja e fundit', label: 'Butoni', fallback: 'Book a day' },

  // ---- Tours
  ...cover('Tours', 'tours'),
  { key: 'tours.title', type: 'text', page: 'Tours', section: 'Kopertina', label: 'Titulli (H1)', fallback: 'Our days, one local guide.' },
  { key: 'tours.lead', type: 'text', page: 'Tours', section: 'Kopertina', label: 'Nën-titulli (paragraf)', fallback: 'Every day is private for up to {max} guests. Don’t see what you want? I’ll build a custom day around your trip.' },

  // ---- About
  ...cover('About', 'about', [{ key: 'about.portrait', type: 'image', page: 'About', section: 'Kopertina', label: 'Foto e guidës' }]),
  { key: 'about.title', type: 'text', page: 'About', section: 'Kopertina', label: 'Titulli (H1)', fallback: 'Hi, I’m your guide.' },
  { key: 'about.lead', type: 'text', page: 'About', section: 'Kopertina', label: 'Nën-titulli (paragraf)', fallback: 'I grew up in Albania and I still get excited by a good road trip. This is the job I always wanted.' },

  // ---- Journal
  ...cover('Journal', 'journal'),
  { key: 'journal.title', type: 'text', page: 'Journal', section: 'Kopertina', label: 'Titulli (H1)', fallback: 'Stories from the road.' },
  { key: 'journal.lead', type: 'text', page: 'Journal', section: 'Kopertina', label: 'Nën-titulli (paragraf)', fallback: 'Days we spent with our groups, routes worth stealing and honest tips from a local guide.' },

  // ---- Contact
  ...cover('Contact', 'contact'),
  { key: 'contact.title', type: 'text', page: 'Contact', section: 'Kopertina', label: 'Titulli (H1)', fallback: 'Book a day.' },
  { key: 'contact.lead', type: 'text', page: 'Contact', section: 'Kopertina', label: 'Nën-titulli (paragraf)', fallback: 'Tell me when you’re in Albania and what you’d love to see. I reply within 24 hours, usually faster.' },

  // ---- General
  { key: 'general.max_guests', type: 'setting', setting: 'default_max_guests', page: 'Të përgjithshme', section: 'Të përgjithshme', label: 'Maks. mysafirë për grup', min: 1, max: 50 }
];

export const SLOT_BY_KEY = Object.fromEntries(SLOTS.map((s) => [s.key, s]));

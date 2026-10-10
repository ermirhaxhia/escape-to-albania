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
  { key: "about.cover", type: "image", page: "About", section: "Kopertina", label: "Foto kopertinë" },
  { key: "about.title", type: "text", page: "About", section: "Kopertina", label: "Titulli (H1)", fallback: "Hi, I’m your guide." },
  { key: "about.lead", type: "text", page: "About", section: "Kopertina", label: "Nën-titulli (paragraf)", fallback: "I grew up in Albania and I still get excited by a good road trip. This is the job I always wanted." },
  { key: "about.portrait", type: "image", page: "About", section: "Historia ime", label: "Foto e guidës" },
  { key: "about.story_title", type: "text", page: "About", section: "Historia ime", label: "Titulli i seksionit (H2)", fallback: "Showing Albania the way I would show a friend." },
  { key: "about.story", type: "text", page: "About", section: "Historia ime", label: "Historia (paragrafët i ndan me një rresht bosh)", fallback: "I started guiding after years of watching big groups rush through places I love. Twenty people, a flag, forty minutes. It always felt wrong.\n\nSo I made the opposite: days for a small group, in my own car, with room to stop at a roadside fruit stand or spend two extra hours on a beach nobody told you about.\n\nI’ll tell you the real history, the family stories and the best place for coffee. I’ll also tell you when to skip something.", rows: 9 },
  { key: "about.stat1_value", type: "text", page: "About", section: "Statistikat shtesë", label: "Statistika 1: numri", fallback: "" },
  { key: "about.stat1_label", type: "text", page: "About", section: "Statistikat shtesë", label: "Statistika 1: teksti", fallback: "" },
  { key: "about.stat2_value", type: "text", page: "About", section: "Statistikat shtesë", label: "Statistika 2: numri", fallback: "" },
  { key: "about.stat2_label", type: "text", page: "About", section: "Statistikat shtesë", label: "Statistika 2: teksti", fallback: "" },
  { key: "about.day_title", type: "text", page: "About", section: "Një ditë me mua", label: "Titulli i seksionit (H2)", fallback: "What a typical day feels like." },
  { key: "about.day_lead", type: "text", page: "About", section: "Një ditë me mua", label: "Teksti nën titull", fallback: "Every route is different, but the rhythm stays the same." },
  { key: "about.timeline", type: "text", page: "About", section: "Një ditë me mua", label: "Orari (një rresht për çdo moment: ora | titulli | teksti)", fallback: "08:00 | Pickup at your door | Coffee in hand, plan in my head. I’ll check how you slept and what you feel like doing.\n10:30 | The first big stop | The castle, the canyon or the old town, before the tour buses arrive.\n13:30 | A long, slow lunch | Always at a family place and always more food than you planned for.\n16:00 | Swim, walk or wander | The part of the day that depends on you: the river, the beach or the back streets.\n19:00 | Back to your hotel | Tired in a good way, with a phone full of photos and a list for next time.", rows: 8 },
  { key: "about.reviews_title", type: "text", page: "About", section: "Vlerësimet", label: "Titulli i seksionit (H2)", fallback: "Kind words from the road." },
  { key: "about.cta_title", type: "text", page: "About", section: "Thirrja e fundit", label: "Titulli (H2)", fallback: "Ready for your day in Albania?" },
  { key: "about.cta_text", type: "text", page: "About", section: "Thirrja e fundit", label: "Teksti", fallback: "Tell me your dates and what you love. I’ll reply within a day with a plan that fits." },
  { key: "about.cta_button", type: "text", page: "About", section: "Thirrja e fundit", label: "Butoni", fallback: "Book a day" },

  // ---- Journal
  ...cover('Journal', 'journal'),
  { key: 'journal.title', type: 'text', page: 'Journal', section: 'Kopertina', label: 'Titulli (H1)', fallback: 'Stories from the road.' },
  { key: 'journal.lead', type: 'text', page: 'Journal', section: 'Kopertina', label: 'Nën-titulli (paragraf)', fallback: 'Days we spent with our groups, routes worth stealing and honest tips from a local guide.' },

  // ---- Contact
  ...cover('Contact', 'contact'),
  { key: 'contact.title', type: 'text', page: 'Contact', section: 'Kopertina', label: 'Titulli (H1)', fallback: 'Book a day.' },
  { key: 'contact.lead', type: 'text', page: 'Contact', section: 'Kopertina', label: 'Nën-titulli (paragraf)', fallback: 'Tell me when you’re in Albania and what you’d love to see. I reply within 24 hours, usually faster.' },
  { key: 'contact.email', type: 'setting', text: true, setting: 'contact_email', page: 'Contact', section: 'Të dhënat e kontaktit', label: 'Email' },
  { key: 'contact.whatsapp', type: 'setting', text: true, setting: 'contact_whatsapp', page: 'Contact', section: 'Të dhënat e kontaktit', label: 'WhatsApp' },
  { key: 'contact.instagram', type: 'setting', text: true, setting: 'contact_instagram', page: 'Contact', section: 'Të dhënat e kontaktit', label: 'Instagram' },
  { key: 'contact.based', type: 'text', page: 'Contact', section: 'Të dhënat e kontaktit', label: 'Ku ndodhem (teksti te kartela)', fallback: 'Tirana, Albania. Pickups in Tirana, Durrës, Shkodër, Vlorë & Sarandë.', rows: 3 },
  { key: 'contact.form_button', type: 'text', page: 'Contact', section: 'Forma', label: 'Butoni i dërgimit', fallback: 'Send request' },
  { key: 'contact.form_note', type: 'text', page: 'Contact', section: 'Forma', label: 'Teksti nën buton', fallback: 'No payment now. I’ll reply with a plan and a fixed price.' },
  { key: 'contact.thanks_text', type: 'text', page: 'Contact', section: 'Forma', label: 'Mesazhi pas dërgimit', fallback: 'You’ll hear back within 24 hours, usually faster.' },
  { key: 'contact.faq_title', type: 'text', page: 'Contact', section: 'Pyetjet', label: 'Titulli i seksionit (H2)', fallback: 'Questions, answered.' },
  { key: 'contact.faq', type: 'text', page: 'Contact', section: 'Pyetjet', label: 'Pyetjet (një rresht për çdo pyetje: pyetja | përgjigja)', maxLen: 4000, rows: 12, fallback: "How many people can join? | One to {max} guests. That’s the whole idea: a private day, never a crowd.\nWhat is included in the price? | Private transport, fuel, your guide and the entrance fees named on each tour. Lunch is included on most days and clearly marked.\nCan we change the route? | Yes. Each day is a starting point. Tell me what to add or skip and I’ll adjust the plan and price.\nWhat if the weather is bad? | I watch the forecast for you. If the plan doesn’t work, we switch days or choose a better route at no extra cost.\nHow do I pay? | A small deposit holds the date, and the balance is paid on the day by cash or card." },

  // ---- SEO of the pages: the title and the description Google shows (written into the page by the server)
  { key: 'home.seo_title', type: 'text', page: 'Home', section: 'SEO', label: 'SEO title', fallback: "Escape to Albania | Private Day Trips with a Local Guide", range: [50, 60] },
  { key: 'home.seo_description', type: 'text', page: 'Home', section: 'SEO', label: 'Meta description', fallback: "Private day trips across Albania for small groups with a local guide. Hotel pickup, your own pace and clear prices, from the mountains to the coast.", rows: 3, range: [140, 160] },
  { key: 'tours.seo_title', type: 'text', page: 'Tours', section: 'SEO', label: 'SEO title', fallback: "Day Trips in Albania with a Local Guide | Escape to Albania", range: [50, 60] },
  { key: 'tours.seo_description', type: 'text', page: 'Tours', section: 'SEO', label: 'Meta description', fallback: "Browse our day trips in Albania: mountains, old stone towns, the coast and food walks with a local guide. Small private groups and clear prices.", rows: 3, range: [140, 160] },
  { key: 'about.seo_title', type: 'text', page: 'About', section: 'SEO', label: 'SEO title', fallback: "About Your Local Guide in Albania | Escape to Albania", range: [50, 60] },
  { key: 'about.seo_description', type: 'text', page: 'About', section: 'SEO', label: 'Meta description', fallback: "Meet your local guide in Albania: who I am, how a day with me works and why I keep every group small. Private day trips with hotel pickup and clear prices.", rows: 3, range: [140, 160] },
  { key: 'journal.seo_title', type: 'text', page: 'Journal', section: 'SEO', label: 'SEO title', fallback: "Albania Travel Journal: Stories and Tips | Escape to Albania", range: [50, 60] },
  { key: 'journal.seo_description', type: 'text', page: 'Journal', section: 'SEO', label: 'Meta description', fallback: "Stories, routes and honest tips from a local guide in Albania: what to see, where to eat and how to plan your days on the road, written from experience.", rows: 3, range: [140, 160] },
  { key: 'contact.seo_title', type: 'text', page: 'Contact', section: 'SEO', label: 'SEO title', fallback: "Book a Private Day Trip in Albania | Escape to Albania", range: [50, 60] },
  { key: 'contact.seo_description', type: 'text', page: 'Contact', section: 'SEO', label: 'Meta description', fallback: "Tell us your dates and what you love and get a plan with a fixed price within a day. Private day trips in Albania for small groups with a local guide.", rows: 3, range: [140, 160] },

  // ---- General
  { key: 'general.max_guests', type: 'setting', setting: 'default_max_guests', page: 'Të përgjithshme', section: 'Të përgjithshme', label: 'Maks. mysafirë për grup', min: 1, max: 50 }
];

export const SLOT_BY_KEY = Object.fromEntries(SLOTS.map((s) => [s.key, s]));

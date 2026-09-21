export const site = {
  name: 'Justas Andžius',
  brand: 'j.a',
  email: 'justasandzius@gmail.com',
  // TODO: replace with the real Instagram handle
  instagram: 'https://www.instagram.com/',
  cities: { left: 'Pasvalys', right: 'Vilnius' },
  nav: [
    { label: 'Darbai', href: '/darbai/' },
    { label: 'Apie mane', href: '/apie/' },
    { label: 'Susisiekite', href: 'mailto:justasandzius@gmail.com' },
  ],
} as const;

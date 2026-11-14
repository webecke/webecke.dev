/** Everything about the wedding the page shows, in one place. */

/** Link to the couple's wedding website on The Knot. Leave empty to hide the button. */
export const THE_KNOT_URL = '';

export const REGISTRY_URL = 'https://www.amazon.com/wedding/share/sierraanddallin';

/** Local midnight on the wedding day, for the countdown. */
export const WEDDING_DATE = new Date(2027, 0, 16);

const maps = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export type Art = 'temple' | 'barn' | 'stake';

export interface WeddingEvent {
  id: string;
  title: string;
  art: Art;
  /** Printed where a postage stamp's price would be. */
  stampValue: string;
  when: string;
  where: string;
  mapUrl: string;
  calendarUrl?: string;
}

export const SEALING: WeddingEvent = {
  id: 'sealing',
  title: 'Sealing',
  art: 'temple',
  stampValue: 'Jan 16',
  when: 'Saturday, January 16',
  where: 'Taylorsville Utah Temple',
  mapUrl: maps('Taylorsville Utah Temple, 2603 W 4700 S, Taylorsville, UT'),
};

export const RECEPTIONS: WeddingEvent[] = [
  {
    id: 'utah',
    title: 'Utah',
    art: 'barn',
    stampValue: '6:30',
    when: 'Sat, Jan 16 · 6:30–8:30 pm',
    where: 'Walker Farms · Lindon',
    mapUrl: maps('Walker Farms, 26 S 500 E, Lindon, UT 84042'),
    calendarUrl: '/utah-reception.ics',
  },
  {
    id: 'missouri',
    title: 'Missouri',
    art: 'stake',
    stampValue: '6:30',
    when: 'Sat, Jan 23 · 6:30–8:30 pm',
    where: 'Liberty Stake Center · Kansas City',
    mapUrl: maps('Liberty Missouri Stake Center, 6751 NE 70th St, Kansas City, MO'),
    calendarUrl: '/missouri-reception.ics',
  },
];

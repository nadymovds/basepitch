import {
  FocusEvent as ReactFocusEvent,
  FormEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import './App.css';

type VisualType = 'schedule' | 'lineup' | 'stats' | 'cards';
type SlideKind =
  | 'image'
  | 'schedule-overview'
  | 'match-countdown'
  | 'rsvp-board'
  | 'match-location'
  | 'admin-schedule'
  | 'lineup-builder'
  | 'lineup-share'
  | 'lineup-next-match'
  | 'lineup-mobile'
  | 'stats-standings'
  | 'stats-active-players'
  | 'stats-hall-of-fame'
  | 'stats-previous-match'
  | 'social-feed'
  | 'social-card-preview'
  | 'social-card-editor'
  | 'social-milestones';

type Job = {
  id: VisualType;
  number: string;
  tabLabel: string;
  eyebrow: string;
  title: string;
  short: string;
  actions: string[];
  result: string;
  metrics: string[];
};

type SimpleCard = {
  title: string;
  body: string;
};

type FeatureSlide = {
  id: string;
  label: string;
  title: string;
  kind: SlideKind;
  image?: FeatureImage;
};

type FeatureImage = {
  alt: string;
  src: string;
  variant?: 'desktop' | 'phone' | 'post' | 'wide' | 'portrait' | 'lineup-card';
  objectPosition?: string;
};

type EventCount = {
  label: string;
  value: number;
  tone: 'yes' | 'maybe' | 'no';
};

type UpcomingEvent = {
  date: string;
  type: string;
  title: string;
  meta: string;
  accent: 'blue' | 'red' | 'neutral';
  counts: EventCount[];
};

type SocialMilestone = {
  date: string;
  label: string;
  title: string;
  body: string;
  tone: 'purple' | 'blue' | 'green' | 'gold';
};

type LeadFormStatus = 'idle' | 'submitting' | 'success' | 'error';
type LeadFormIntent = 'pilot' | 'contact';

type LineupPlayer = {
  position: string;
  name: string;
  x: number;
  y: number;
  assigned?: boolean;
};

type BenchGroup = {
  title: string;
  count: number;
  players: string[];
};

type StandingRow = {
  rank: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: string;
  points: number;
  highlight?: boolean;
  tone: 'black' | 'yellow' | 'green' | 'orange' | 'red' | 'gray';
};

type PlayerStatCard = {
  number: string;
  position: string;
  name: string;
  country: string;
  matches: number;
  goals: number;
  since: number;
  tone: 'gold' | 'red';
  portrait: 'photo' | 'silhouette';
};

type FameTable = {
  title: string;
  unit: string;
  rows: Array<{
    rank: number;
    name: string;
    value: number;
    active?: boolean;
  }>;
};

const CAROUSEL_AUTO_ADVANCE_MS = 7000;

const featureSlides: Record<VisualType, FeatureSlide[]> = {
  schedule: [
    {
      id: 'schedule-upcoming-match',
      label: 'Match',
      title: 'Upcoming match countdown',
      kind: 'image',
      image: {
        alt: 'Upcoming match countdown screenshot',
        src: '/feature-screenshots/schedule-upcoming-match.png',
        variant: 'wide',
      },
    },
    {
      id: 'schedule-calendar-events',
      label: 'Calendar',
      title: 'Schedule calendar and RSVP overview',
      kind: 'image',
      image: {
        alt: 'Schedule calendar and upcoming events screenshot',
        src: '/feature-screenshots/schedule-calendar-events.png',
      },
    },
    {
      id: 'schedule-match-details-rsvp',
      label: 'RSVP',
      title: 'Match details with map and RSVP',
      kind: 'image',
      image: {
        alt: 'Match details page with map and RSVP screenshot',
        src: '/feature-screenshots/schedule-match-details-rsvp.png',
        variant: 'portrait',
      },
    },
    {
      id: 'schedule-admin-list',
      label: 'Admin',
      title: 'Admin schedule import and event management',
      kind: 'image',
      image: {
        alt: 'Admin schedule management screenshot',
        src: '/feature-screenshots/schedule-admin-list.png',
      },
    },
  ],
  lineup: [
    {
      id: 'lineup-builder-editor',
      label: 'Builder',
      title: 'Lineup builder from RSVP responses',
      kind: 'image',
      image: {
        alt: 'Lineup builder editor with pitch and RSVP candidates screenshot',
        src: '/feature-screenshots/lineup-builder-editor.png',
      },
    },
    {
      id: 'lineup-internal-card',
      label: 'Internal',
      title: 'Internal lineup card for match coordination',
      kind: 'image',
      image: {
        alt: 'Internal lineup card screenshot',
        src: '/feature-screenshots/lineup-internal-card.png',
        variant: 'portrait',
      },
    },
    {
      id: 'lineup-social-card',
      label: 'Share',
      title: 'Social sharing lineup card',
      kind: 'image',
      image: {
        alt: 'Social sharing lineup card screenshot',
        src: '/feature-screenshots/lineup-social-card.png',
        variant: 'lineup-card',
      },
    },
  ],
  stats: [
    {
      id: 'website-standings-results',
      label: 'Results',
      title: 'Auto-updated standings and latest results',
      kind: 'image',
      image: {
        alt: 'Website standings, latest results and player leaderboards screenshot',
        src: '/feature-screenshots/website-standings-results.png',
      },
    },
    {
      id: 'website-active-players',
      label: 'Players',
      title: 'Player cards refreshed from match statistics',
      kind: 'image',
      image: {
        alt: 'Website active players statistics cards screenshot',
        src: '/feature-screenshots/website-active-players.png',
      },
    },
    {
      id: 'website-hall-of-fame',
      label: 'Records',
      title: 'Hall of fame updated from club history',
      kind: 'image',
      image: {
        alt: 'Website hall of fame records screenshot',
        src: '/feature-screenshots/website-hall-of-fame.png',
      },
    },
  ],
  cards: [
    {
      id: 'social-appearance-card',
      label: 'Card',
      title: 'Generated milestone card for social channels',
      kind: 'image',
      image: {
        alt: 'Generated social appearance milestone card screenshot',
        src: '/feature-screenshots/social-appearance-card.png',
        variant: 'post',
      },
    },
    {
      id: 'social-milestones-timeline',
      label: 'Timeline',
      title: 'Match-triggered milestone feed',
      kind: 'image',
      image: {
        alt: 'Milestones timeline screenshot',
        src: '/feature-screenshots/social-milestones-timeline.png',
        variant: 'portrait',
      },
    },
    {
      id: 'social-card-editor',
      label: 'Editor',
      title: 'Social card editor with live preview',
      kind: 'image',
      image: {
        alt: 'Social card editor screenshot',
        src: '/feature-screenshots/social-card-editor.png',
      },
    },
  ],
};

const featureLabels: Record<VisualType, string> = {
  schedule: 'Schedule and RSVP product visuals',
  lineup: 'Lineup builder product visual',
  stats: 'Auto-updating website stats visuals',
  cards: 'Social card product visual',
};

const calendarEvents: Record<number, string[]> = {
  4: ['blue'],
  7: ['gray'],
  14: ['blue', 'gray'],
  17: ['red'],
  19: ['blue'],
  20: ['red'],
  24: ['gray'],
  25: ['blue'],
  28: ['red'],
  30: ['gray'],
};

const upcomingEvents: UpcomingEvent[] = [
  {
    date: 'MAY 24',
    type: 'Training',
    title: 'Training session',
    meta: '18:00-19:30 / North Park Pitch',
    accent: 'neutral',
    counts: [
      { label: 'Yes', value: 7, tone: 'yes' },
      { label: 'Maybe', value: 2, tone: 'maybe' },
      { label: 'No', value: 2, tone: 'no' },
    ],
  },
  {
    date: 'MAY 25',
    type: 'Home',
    title: 'Harbor FC vs Pine United',
    meta: '20:10-21:50 / Riverfront Field',
    accent: 'blue',
    counts: [
      { label: 'Yes', value: 7, tone: 'yes' },
      { label: 'Maybe', value: 1, tone: 'maybe' },
      { label: 'No', value: 1, tone: 'no' },
    ],
  },
  {
    date: 'MAY 28',
    type: 'Away',
    title: 'Metro Athletic vs Harbor FC',
    meta: '20:15-21:55 / Eastside Pitch',
    accent: 'red',
    counts: [
      { label: 'Yes', value: 8, tone: 'yes' },
      { label: 'Maybe', value: 1, tone: 'maybe' },
      { label: 'No', value: 2, tone: 'no' },
    ],
  },
  {
    date: 'MAY 30',
    type: 'Training',
    title: 'Training session',
    meta: '13:00-14:30 / North Park Pitch',
    accent: 'neutral',
    counts: [
      { label: 'Yes', value: 2, tone: 'yes' },
      { label: 'Maybe', value: 0, tone: 'maybe' },
      { label: 'No', value: 0, tone: 'no' },
    ],
  },
];

const rsvpGroups = [
  {
    label: 'YES (7)',
    tone: 'yes',
    names: ['Mika', 'Noah', 'Elias', 'Arman', 'Leo', 'Karim', 'Oskari'],
  },
  {
    label: 'MAYBE (2)',
    tone: 'maybe',
    names: ['Sofia', 'Nora'],
  },
  {
    label: 'NO (2)',
    tone: 'no',
    names: ['Luca', 'Emil'],
  },
];

const adminEvents = [
  {
    date: 'Sun, 24 May 2026',
    time: '18:00 - 19:30',
    type: 'Training',
    title: 'Training session',
    location: 'North Park Pitch',
    note: 'Guests 7 euros',
    accent: 'neutral',
  },
  {
    date: 'Mon, 25 May 2026',
    time: '20:10 - 21:50',
    type: 'Match',
    title: 'Harbor FC vs Pine United',
    location: 'Riverfront Field',
    note: 'Synced from league',
    accent: 'blue',
  },
  {
    date: 'Thu, 28 May 2026',
    time: '20:15 - 21:55',
    type: 'Match',
    title: 'Metro Athletic vs Harbor FC',
    location: 'Eastside Pitch',
    note: 'Synced from league',
    accent: 'red',
  },
  {
    date: 'Sat, 30 May 2026',
    time: '13:00 - 14:30',
    type: 'Training',
    title: 'Training session',
    location: 'North Park Pitch',
    note: 'Guests 7 euros',
    accent: 'neutral',
  },
];

const lineupPlayers: LineupPlayer[] = [
  { position: 'GK', name: 'Leo Romero', x: 9, y: 48 },
  { position: 'LB', name: 'Noah', x: 30, y: 16 },
  { position: 'CB', name: 'Emil', x: 29, y: 39 },
  { position: 'CB', name: 'Henri', x: 28, y: 64 },
  { position: 'RB', name: 'Dion', x: 28, y: 84 },
  { position: 'DM', name: 'Karim', x: 48, y: 39 },
  { position: 'DM', name: 'Mika', x: 48, y: 64 },
  { position: 'LAM', name: 'Samir', x: 66, y: 16 },
  { position: 'CAM', name: 'Unassigned', x: 69, y: 48, assigned: false },
  { position: 'RAM', name: 'Elias', x: 67, y: 84 },
  { position: 'ST', name: 'Arman', x: 88, y: 48 },
];

const benchGroups: BenchGroup[] = [
  { title: 'Goalkeeper', count: 0, players: [] },
  { title: 'Defenders', count: 3, players: ['Oskari', 'Pavel', 'Nader'] },
  { title: 'Defensive midfielders', count: 0, players: [] },
  { title: 'Attacking midfielders', count: 4, players: ['Zohir', 'Souhail', 'Nora', 'Niko'] },
  { title: 'Attack', count: 1, players: ['Milan'] },
];

const lineupStarters = ['Leo Romero', 'Noah', 'Emil', 'Henri', 'Dion', 'Karim', 'Mika', 'Samir', 'Elias', 'Arman'];
const lineupSubstitutes = ['Oskari', 'Pavel', 'Nader', 'Zohir', 'Souhail', 'Nora', 'Niko', 'Milan'];
const mobileAvailablePlayers = ['Ari', 'Kosti', 'Bilel', 'Jonas', 'Pavel', 'Jared', 'Angel'];

const standingsRows: StandingRow[] = [
  { rank: 1, team: 'North City', played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 7, goalsAgainst: 0, goalDifference: '+7', points: 9, tone: 'black' },
  { rank: 2, team: 'Lynx / 5', played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 4, goalsAgainst: 2, goalDifference: '+2', points: 4, tone: 'yellow' },
  { rank: 3, team: 'River Athletic', played: 2, won: 1, drawn: 1, lost: 0, goalsFor: 4, goalsAgainst: 3, goalDifference: '+1', points: 4, tone: 'gray' },
  { rank: 4, team: 'East Town', played: 4, won: 1, drawn: 1, lost: 2, goalsFor: 8, goalsAgainst: 9, goalDifference: '-1', points: 4, tone: 'green' },
  { rank: 5, team: 'Harbor FC', played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 3, goalsAgainst: 5, goalDifference: '-2', points: 3, highlight: true, tone: 'red' },
  { rank: 6, team: 'Metro Athletic', played: 2, won: 0, drawn: 1, lost: 1, goalsFor: 1, goalsAgainst: 3, goalDifference: '-2', points: 1, tone: 'orange' },
  { rank: 7, team: 'Forest United', played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 2, goalDifference: '-2', points: 0, tone: 'gray' },
  { rank: 8, team: 'Pine United', played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 3, goalDifference: '-3', points: 0, tone: 'black' },
];

const activePlayerCards: PlayerStatCard[] = [
  { number: '06', position: 'CM', name: 'Angel Moreno', country: 'FI', matches: 226, goals: 57, since: 2018, tone: 'gold', portrait: 'photo' },
  { number: '19', position: 'CB', name: 'Cyp Martin', country: 'FR', matches: 213, goals: 43, since: 2018, tone: 'gold', portrait: 'photo' },
  { number: '14', position: 'AM', name: 'Ahmad Russo', country: 'FI', matches: 128, goals: 9, since: 2017, tone: 'gold', portrait: 'silhouette' },
  { number: '10', position: 'ST', name: 'Abbas Barlow', country: 'GM', matches: 126, goals: 67, since: 2018, tone: 'gold', portrait: 'photo' },
  { number: '22', position: 'RW', name: 'Ismail Bello', country: 'MA', matches: 124, goals: 55, since: 2022, tone: 'gold', portrait: 'photo' },
  { number: '01', position: 'GK', name: 'Dmitry Kalev', country: 'EE', matches: 115, goals: 1, since: 2020, tone: 'gold', portrait: 'silhouette' },
  { number: '23', position: 'LB', name: 'Mika Salonen', country: 'ET', matches: 100, goals: 4, since: 2020, tone: 'gold', portrait: 'photo' },
  { number: '05', position: 'DM', name: 'Freddy Arias', country: 'FI', matches: 94, goals: 21, since: 2023, tone: 'red', portrait: 'silhouette' },
];

const fameTables: FameTable[] = [
  {
    title: 'Top Goals',
    unit: 'goals',
    rows: [
      { rank: 1, name: 'Abbas Barlow', value: 67, active: true },
      { rank: 2, name: 'Angel Moreno', value: 57, active: true },
      { rank: 3, name: 'Ismail Bello', value: 55, active: true },
      { rank: 4, name: 'Cyp Martin', value: 43, active: true },
      { rank: 5, name: 'Kenan Bari', value: 37 },
      { rank: 6, name: 'Kamal Mata', value: 37 },
      { rank: 7, name: 'Thomas Vale', value: 34 },
      { rank: 8, name: 'Miki Pohja', value: 27 },
      { rank: 9, name: 'Jose Raul', value: 23 },
      { rank: 10, name: 'Martin Salo', value: 23, active: true },
    ],
  },
  {
    title: 'Top Games',
    unit: 'games',
    rows: [
      { rank: 1, name: 'Angel Moreno', value: 226, active: true },
      { rank: 2, name: 'Cyp Martin', value: 213, active: true },
      { rank: 3, name: 'Miki Pohja', value: 128 },
      { rank: 4, name: 'Ahmad Russo', value: 128, active: true },
      { rank: 5, name: 'Abbas Barlow', value: 126, active: true },
      { rank: 6, name: 'Ismail Bello', value: 124, active: true },
      { rank: 7, name: 'Dmitry Kalev', value: 115, active: true },
      { rank: 8, name: 'Mika Salonen', value: 100, active: true },
      { rank: 9, name: 'Freddy Arias', value: 94, active: true },
      { rank: 10, name: 'Bilel Aziz', value: 87, active: true },
    ],
  },
  {
    title: 'Top Competitions',
    unit: 'competitions',
    rows: [
      { rank: 1, name: 'Cyp Martin', value: 20, active: true },
      { rank: 2, name: 'Angel Moreno', value: 18, active: true },
      { rank: 3, name: 'Ahmad Russo', value: 13, active: true },
      { rank: 4, name: 'Abbas Barlow', value: 13, active: true },
      { rank: 5, name: 'Dmitry Kalev', value: 13, active: true },
      { rank: 6, name: 'Miki Pohja', value: 11 },
      { rank: 7, name: 'Ismail Bello', value: 11, active: true },
      { rank: 8, name: 'Mika Salonen', value: 10, active: true },
      { rank: 9, name: 'Freddy Arias', value: 9, active: true },
      { rank: 10, name: 'Aleks Altin', value: 9, active: true },
    ],
  },
];

const socialMilestones: SocialMilestone[] = [
  {
    date: '20.5.2026',
    label: 'Man of the Match',
    title: 'Man of the Match',
    body: 'Match award for #22 Elias Moreno',
    tone: 'purple',
  },
  {
    date: '20.5.2026',
    label: 'Appearance Milestone',
    title: 'Appearance Milestone',
    body: '100 appearances for Mika Salonen',
    tone: 'blue',
  },
  {
    date: '20.5.2026',
    label: 'Player Debut',
    title: 'Player Debut',
    body: 'Debut alert: Arman Vela made his first appearance against East Town.',
    tone: 'green',
  },
  {
    date: '14.5.2026',
    label: 'Milestone Record',
    title: 'Club Milestone',
    body: 'Noah Lehto reached 50 matches for Harbor FC.',
    tone: 'gold',
  },
];

const jobs: Job[] = [
  {
    id: 'schedule',
    number: '01',
    tabLabel: 'Fixtures & RSVP',
    eyebrow: 'Matches and trainings',
    title: 'When a session or match is coming up, publish the plan once for players and staff.',
    short:
      'Create sessions and matches, collect RSVP responses and give players one clear link for time, pitch and maps.',
    actions: ['Create event', 'Collect RSVP', 'Share location'],
    result:
      'The club has one live source for schedule, attendance and venue details before the session starts, and adding an event or finding the schedule takes about a minute.',
    metrics: ['TASO sync', 'Calendar sync', 'Maps link'],
  },
  {
    id: 'lineup',
    number: '02',
    tabLabel: 'Lineups',
    eyebrow: 'Match preparation',
    title: 'When availability changes before kickoff, build the lineup from the current squad.',
    short:
      'Choose a formation, place players into positions and update the team quickly when availability changes before kickoff.',
    actions: ['Pick formation', 'Place players', 'Share lineup'],
    result: 'Coaches and team managers can share the match plan earlier and adjust it from a phone, with lineup management taking no more than five minutes.',
    metrics: ['Phone-ready', 'RSVP-based'],
  },
  {
    id: 'stats',
    number: '03',
    tabLabel: 'Website stats',
    eyebrow: 'Automatic updates',
    title: 'When official data changes, keep results, tables and player stats current.',
    short:
      'Sync match data once, then keep standings, latest results, player cards and club records current across the website.',
    actions: ['Sync results', 'Refresh tables', 'Update players'],
    result:
      'Supporters, sponsors and players see current statistics without a weekly website rebuild and without time cost for manual updates.',
    metrics: ['Auto-sync updates', 'Live standings', 'Player stats'],
  },
  {
    id: 'cards',
    number: '04',
    tabLabel: 'Social graphics',
    eyebrow: 'Ready-to-post visuals',
    title: 'When the match is ready to publish, turn real club data into clean media cards.',
    short:
      'Generate match previews, result cards and player milestones using your club style and real football data.',
    actions: ['Preview match', 'Highlight player', 'Post card'],
    result: 'The media team can keep the club visible without designing every post from scratch.',
    metrics: ['Auto-generated cards', 'Club style', 'Milestones'],
  },
];

const seasonFlowCards: SimpleCard[] = [
  {
    title: 'Plan the fixture',
    body: 'Publish date, time, pitch and RSVP from one club record.',
  },
  {
    title: 'Collect availability',
    body: 'Players and staff respond early, so the matchday plan starts from the current squad.',
  },
  {
    title: 'Prepare matchday',
    body: 'Coaches choose the formation, place players and share the lineup view.',
  },
  {
    title: 'Update the website',
    body: 'Results, tables, player stats and records stay connected to official data.',
  },
  {
    title: 'Create club media',
    body: 'The media team creates previews, results and milestones from the same data.',
  },
];

const clubFitTags = [
  'Club admins',
  'Coaches',
  'Team managers',
  'Media staff',
  'Amateur clubs',
  'Semi-pro clubs',
  'Multi-team setups',
  'Growing football communities',
];

const pilotConditionItems = [
  'Free pilot for 2 months.',
  'Your club can influence upcoming feature development during the pilot.',
  'After the pilot: subscription, one-time infrastructure deployment, or stop.',
  'Training schedule management stays free with some limitations in all cases.',
];

const pilotProcessSteps = [
  'You submit a request.',
  'We contact your club directly.',
  'We deploy and configure BasePitch for your workflow.',
  'The free 2-month pilot starts when your setup is ready.',
];

const officialKeyHelpUrl =
  import.meta.env.VITE_OFFICIAL_KEY_HELP_URL || 'https://tuki.palloliitto.fi/fi/support/solutions/articles/103000036813-tason-rajapinta';

const pilotFormEndpoint = String(import.meta.env.VITE_PILOT_FORM_ENDPOINT || '').trim();

function resolveFormEndpoint() {
  if (!pilotFormEndpoint) {
    return '';
  }

  try {
    const endpoint = new URL(pilotFormEndpoint);
    endpoint.searchParams.set('origin', window.location.origin);
    return endpoint.toString();
  } catch {
    return pilotFormEndpoint;
  }
}

function LeadForm({ id, intent, onClose }: { id: string; intent: LeadFormIntent; onClose?: () => void }) {
  const [status, setStatus] = useState<LeadFormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const trapValue = String(formData.get('website') ?? '').trim();

    if (trapValue.length > 0) {
      return;
    }

    const resolvedFormEndpoint = resolveFormEndpoint();

    if (!resolvedFormEndpoint) {
      setStatus('error');
      setErrorMessage('Pilot form is not configured yet. Please contact us directly by email.');
      return;
    }

    const payload = {
      clubName: String(formData.get('clubName') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      message: String(formData.get('message') ?? '').trim(),
      leadIntent: intent,
      source: 'basepitch-landing',
      submittedAt: new Date().toISOString(),
    };

    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch(resolvedFormEndpoint, {
        method: 'POST',
        headers: {
          // Keep this as a simple request for Apps Script web app compatibility.
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let backendMessage = '';
        try {
          const errorBody = (await response.json()) as { error?: string };
          backendMessage = typeof errorBody.error === 'string' ? errorBody.error : '';
        } catch {
          try {
            backendMessage = (await response.text()).trim();
          } catch {
            backendMessage = '';
          }
        }

        throw new Error(backendMessage || `Request failed with status ${response.status}`);
      }

      setStatus('success');
    } catch (error) {
      setStatus('error');
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(message || 'We could not send your request right now. Please try again or contact us directly.');
      return;
    }

    form.reset();
  }

  return (
    <form className="lead-form" id={id} onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">{intent === 'contact' ? 'Contact' : 'Pilot request'}</p>
        <h3>{intent === 'contact' ? 'Contact BasePitch' : 'Request a pilot for your club'}</h3>
        <p>
          {intent === 'contact'
            ? 'Send a message and we will contact you to discuss your club workflow and pilot setup.'
            : 'Send your details and we will contact you to prepare the pilot deployment for your club.'}
        </p>
      </div>

      <label>
        Club name
        <input name="clubName" ref={firstInputRef} type="text" placeholder="FC Example (optional)" />
      </label>

      <label>
        Email
        <input name="email" type="email" placeholder="alex@club.fi" required />
      </label>

      <label>
        Message
        <textarea
          name="message"
          placeholder="Tell us about your club and goals. If you already have a TASO key, add it here to speed up setup."
          required
          rows={5}
        />
      </label>
      <p className="lead-form-help">
        If you already have a TASO key, include it in your message to speed up setup.
        <a href={officialKeyHelpUrl} rel="noreferrer" target="_blank">
          TASO key guide
        </a>
      </p>

      <label className="lead-form-honeypot" aria-hidden="true">
        Website
        <input autoComplete="off" name="website" tabIndex={-1} type="text" />
      </label>

      <button className="button button-primary" disabled={status === 'submitting'} type="submit">
        {status === 'submitting' ? 'Sending request...' : intent === 'contact' ? 'Send message' : 'Request a pilot'}
      </button>

      {onClose && (
        <button className="button button-secondary" onClick={onClose} type="button">
          Back to pilot steps
        </button>
      )}

      {status === 'success' && (
        <p className="form-success" role="status">
          Thanks. Your pilot request has been sent, and we will follow up shortly.
        </p>
      )}

      {status === 'error' && (
        <p className="form-error" role="status">
          {errorMessage}
        </p>
      )}
    </form>
  );
}

function WorkflowNav({
  activeJobId,
  className,
  onSelect,
}: {
  activeJobId: VisualType;
  className?: string;
  onSelect: (jobId: VisualType) => void;
}) {
  return (
    <nav className={className ? `job-switcher ${className}` : 'job-switcher'} aria-label="BasePitch main workflows">
      {jobs.map((job) => (
        <a
          aria-current={activeJobId === job.id ? 'location' : undefined}
          className={activeJobId === job.id ? 'job-tab active' : 'job-tab'}
          href={`#workflow-${job.id}`}
          key={job.id}
          onClick={() => onSelect(job.id)}
        >
          <span>{job.number}</span>
          <strong>{job.tabLabel}</strong>
          <em>{job.eyebrow}</em>
        </a>
      ))}
    </nav>
  );
}

function WorkflowMenu({ activeJobId, onSelect }: { activeJobId: VisualType; onSelect: (jobId: VisualType) => void }) {
  return (
    <nav className="workflow-menu" aria-label="Workflow navigation">
      {jobs.map((job) => (
        <a
          aria-current={activeJobId === job.id ? 'location' : undefined}
          className={activeJobId === job.id ? 'workflow-menu-link active' : 'workflow-menu-link'}
          href={`#workflow-${job.id}`}
          key={job.id}
          onClick={() => onSelect(job.id)}
        >
          {job.tabLabel}
        </a>
      ))}
    </nav>
  );
}

function JobDetailPanel({ isActive, job }: { isActive: boolean; job: Job }) {
  const tags = getUniqueJobTags(job);

  return (
    <article
      aria-labelledby={`workflow-title-${job.id}`}
      className="job-detail workflow-block"
      id={`workflow-${job.id}`}
    >
      <div className="job-detail-copy">
        <h2 id={`workflow-title-${job.id}`}>{job.title}</h2>
        <p>{job.short}</p>
        <div className="action-tags job-tags" aria-label="Key workflow capabilities">
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="result-card">
          <span>Outcome</span>
          <p>{job.result}</p>
        </div>
      </div>
      <FeatureVisual isAutoPlayActive={isActive} type={job.id} />
    </article>
  );
}

function getUniqueJobTags(job: Job) {
  const seen = new Set<string>();

  return [...job.actions, ...job.metrics].filter((tag) => {
    const normalizedTag = tag.toLowerCase().replace(/[^a-z0-9]+/g, '');

    if (seen.has(normalizedTag)) {
      return false;
    }

    seen.add(normalizedTag);
    return true;
  });
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}

function FeatureVisual({ isAutoPlayActive, type }: { isAutoPlayActive: boolean; type: VisualType }) {
  const slides = featureSlides[type];

  return (
    <div className={`mockup mockup-${type}`} aria-label={featureLabels[type]}>
      <div className="mockup-toolbar">
        <span />
        <span />
        <span />
        <strong>{featureLabels[type]}</strong>
      </div>
      <FeatureCarousel isAutoPlayActive={isAutoPlayActive} slides={slides} type={type} />
    </div>
  );
}

function FeatureCarousel({
  isAutoPlayActive,
  slides,
  type,
}: {
  isAutoPlayActive: boolean;
  slides: FeatureSlide[];
  type: VisualType;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const isInViewport = useElementInViewport(carouselRef);
  const isPaused = isHovering || isFocused || isDragging;
  const hasMultipleSlides = slides.length > 1;
  const canAutoAdvance = isAutoPlayActive && isInViewport;
  const activeSlide = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    setActiveIndex(0);
  }, [type]);

  useEffect(() => {
    if (!hasMultipleSlides || !canAutoAdvance || prefersReducedMotion || isPaused) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setActiveIndex((currentIndex) => getWrappedIndex(currentIndex + 1, slides.length));
    }, CAROUSEL_AUTO_ADVANCE_MS);

    return () => window.clearInterval(timerId);
  }, [canAutoAdvance, hasMultipleSlides, isPaused, prefersReducedMotion, slides.length]);

  function goToSlide(index: number) {
    setActiveIndex(getWrappedIndex(index, slides.length));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!hasMultipleSlides) {
      return;
    }

    startXRef.current = event.clientX;
    pointerIdRef.current = event.pointerId;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId || startXRef.current === null) {
      return;
    }

    const dragDistance = event.clientX - startXRef.current;

    if (Math.abs(dragDistance) > 8) {
      event.preventDefault();
    }
  }

  function finishPointerGesture(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId || startXRef.current === null) {
      return;
    }

    const dragDistance = event.clientX - startXRef.current;

    if (Math.abs(dragDistance) > 46) {
      goToSlide(activeIndex + (dragDistance < 0 ? 1 : -1));
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    startXRef.current = null;
    pointerIdRef.current = null;
    setIsDragging(false);
  }

  function cancelPointerGesture(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    startXRef.current = null;
    pointerIdRef.current = null;
    setIsDragging(false);
  }

  function handleFocus() {
    setIsFocused(true);
  }

  function handleBlur(event: ReactFocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;

    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setIsFocused(false);
  }

  return (
    <div
      ref={carouselRef}
      className={hasMultipleSlides ? 'feature-carousel has-controls' : 'feature-carousel'}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        aria-live={isPaused ? 'polite' : 'off'}
        className={isDragging ? 'carousel-stage is-dragging' : 'carousel-stage'}
        onPointerCancel={cancelPointerGesture}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerGesture}
        role="group"
        aria-label={activeSlide.title}
      >
        <div className="feature-slide" key={activeSlide.id}>
          {renderFeatureSlide(activeSlide, type)}
        </div>
      </div>

      {hasMultipleSlides && (
        <div className="carousel-controls" aria-label={`${featureLabels[type]} carousel controls`}>
          <button className="carousel-arrow" onClick={() => goToSlide(activeIndex - 1)} type="button" aria-label="Previous slide">
            <span aria-hidden="true">&larr;</span>
          </button>
          <div className="carousel-dots" role="tablist" aria-label={`${featureLabels[type]} slides`}>
            {slides.map((slide, index) => (
              <button
                aria-controls={`${type}-${slide.id}`}
                aria-selected={activeIndex === index}
                aria-label={slide.title}
                className={activeIndex === index ? 'carousel-dot active' : 'carousel-dot'}
                key={slide.id}
                onClick={() => goToSlide(index)}
                role="tab"
                type="button"
              />
            ))}
          </div>
          <button className="carousel-arrow" onClick={() => goToSlide(activeIndex + 1)} type="button" aria-label="Next slide">
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      )}
    </div>
  );
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    function handleChange() {
      setPrefersReducedMotion(mediaQuery.matches);
    }

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

function useElementInViewport(elementRef: RefObject<HTMLElement | null>) {
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return undefined;
    }

    if (!('IntersectionObserver' in window)) {
      setIsInViewport(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting && entry.intersectionRatio >= 0.28);
      },
      {
        rootMargin: '-12% 0px -12% 0px',
        threshold: [0, 0.28, 0.5, 0.75],
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef]);

  return isInViewport;
}

function getWrappedIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function renderFeatureSlide(slide: FeatureSlide, type: VisualType) {
  if (slide.kind === 'image' && slide.image) {
    return <ScreenshotSlide image={slide.image} slideId={`${type}-${slide.id}`} title={slide.title} />;
  }

  switch (slide.kind) {
    case 'image':
      return <MissingScreenshotSlide slideId={`${type}-${slide.id}`} title={slide.title} />;
    case 'schedule-overview':
      return <ScheduleOverviewSlide id={slide.id} />;
    case 'match-countdown':
      return <MatchCountdownSlide id={slide.id} />;
    case 'rsvp-board':
      return <RsvpBoardSlide id={slide.id} />;
    case 'match-location':
      return <MatchLocationSlide id={slide.id} />;
    case 'admin-schedule':
      return <AdminScheduleSlide id={slide.id} />;
    case 'lineup-builder':
      return <LineupBuilderSlide id={slide.id} />;
    case 'lineup-share':
      return <LineupShareSlide id={slide.id} />;
    case 'lineup-next-match':
      return <LineupNextMatchSlide id={slide.id} />;
    case 'lineup-mobile':
      return <LineupMobileSlide id={slide.id} />;
    case 'stats-standings':
      return <StatsStandingsSlide id={slide.id} />;
    case 'stats-active-players':
      return <StatsActivePlayersSlide id={slide.id} />;
    case 'stats-hall-of-fame':
      return <StatsHallOfFameSlide id={slide.id} />;
    case 'stats-previous-match':
      return <StatsPreviousMatchSlide id={slide.id} />;
    case 'social-feed':
      return <SocialFeedSlide id={slide.id} />;
    case 'social-card-preview':
      return <SocialCardPreviewSlide id={slide.id} />;
    case 'social-card-editor':
      return <SocialCardEditorSlide id={slide.id} />;
    case 'social-milestones':
      return <SocialMilestonesSlide id={slide.id} />;
  }
}

function ScreenshotSlide({ image, slideId, title }: { image: FeatureImage; slideId: string; title: string }) {
  const variant = image.variant ?? 'desktop';

  return (
    <div className={`screenshot-slide slide-panel screenshot-${variant}`} id={slideId}>
      <div className="screenshot-frame">
        <img alt={image.alt} src={image.src} style={image.objectPosition ? { objectPosition: image.objectPosition } : undefined} />
      </div>
      <span className="screenshot-caption">{title}</span>
    </div>
  );
}

function MissingScreenshotSlide({ slideId, title }: { slideId: string; title: string }) {
  return (
    <div className="missing-screenshot-slide slide-panel" id={slideId}>
      <strong>{title}</strong>
      <p>Add the source screenshot to <code>public/feature-screenshots</code> and wire it in <code>featureSlides</code>.</p>
    </div>
  );
}

function ScheduleOverviewSlide({ id }: { id: string }) {
  const calendarDays = Array.from({ length: 35 }, (_, index) => (index < 4 ? null : index - 3));

  return (
    <div className="schedule-overview-slide slide-panel" id={`schedule-${id}`}>
      <div className="schedule-calendar">
        <div className="schedule-calendar-top">
          <button type="button" aria-label="Previous month">
            &larr;
          </button>
          <strong>May 2026</strong>
          <button type="button" aria-label="Next month">
            &rarr;
          </button>
        </div>
        <div className="weekday-row">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="calendar-grid-ui">
          {calendarDays.map((day, index) => (
            <div className={day === 23 ? 'calendar-day today' : 'calendar-day'} key={`${day ?? 'empty'}-${index}`}>
              {day && <span>{day}</span>}
              {day && calendarEvents[day] && (
                <div className="day-markers">
                  {calendarEvents[day].map((tone, markerIndex) => (
                    <em className={`marker ${tone}`} key={`${tone}-${markerIndex}`} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="calendar-legend">
          <span>
            <em className="marker blue" />
            Match
          </span>
          <span>
            <em className="marker gray" />
            Training
          </span>
          <span>
            <em className="marker amber" />
            Other
          </span>
        </div>
      </div>

      <div className="upcoming-panel">
        <div className="panel-heading-row">
          <span>Upcoming events</span>
          <a href="#pilot-request-form">Full schedule</a>
        </div>
        <div className="event-list">
          {upcomingEvents.map((event) => (
            <article className={`event-card ${event.accent}`} key={event.title + event.date}>
              <div className="event-date">
                <span>{event.date.split(' ')[0]}</span>
                <strong>{event.date.split(' ')[1]}</strong>
              </div>
              <div className="event-main">
                <span>{event.type}</span>
                <strong>{event.title}</strong>
                <p>{event.meta}</p>
              </div>
              <div className="event-counts">
                {event.counts.map((count) => (
                  <span className={count.tone} key={count.label}>
                    {count.label}
                    <strong>{count.value}</strong>
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchCountdownSlide({ id }: { id: string }) {
  return (
    <div className="match-countdown-slide slide-panel dark-panel" id={`schedule-${id}`}>
      <div className="match-ribbon">Upcoming match</div>
      <div className="team-row">
        <div className="team-block">
          <strong>Harbor FC</strong>
          <span className="club-crest red-crest">HFC</span>
        </div>
        <span className="versus-pill">VS</span>
        <div className="team-block">
          <strong>Pine United</strong>
          <span className="club-crest green-crest">PU</span>
        </div>
      </div>
      <div className="countdown-grid" aria-label="Countdown">
        {[
          ['02', 'days'],
          ['06', 'hrs'],
          ['37', 'min'],
          ['38', 'sec'],
        ].map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="match-meta-row">
        <span>25.5.2026 at 20:10</span>
        <span>Riverfront Field</span>
      </div>
      <a className="matchday-button" href="#pilot-request-form">
        Match day
      </a>
    </div>
  );
}

function RsvpBoardSlide({ id }: { id: string }) {
  return (
    <div className="rsvp-board-slide slide-panel" id={`schedule-${id}`}>
      <div className="rsvp-board-head">
        <div>
          <h3>RSVP</h3>
          <div className="rsvp-filter-row" aria-label="RSVP options">
            <button className="active yes" type="button">
              Yes
            </button>
            <button className="maybe" type="button">
              Maybe
            </button>
            <button className="no" type="button">
              No
            </button>
          </div>
        </div>
        <div className="rsvp-status">
          <span>Open</span>
          <p>Limit: 30 / left 23</p>
        </div>
        <div className="signed-in-card">
          <span>Signed in</span>
          <strong>Mika</strong>
          <div>
            <button type="button">Sign out</button>
            <button type="button">Edit</button>
          </div>
        </div>
      </div>

      <div className="rsvp-columns">
        {rsvpGroups.map((group) => (
          <div className="rsvp-column" key={group.label}>
            <strong>{group.label}</strong>
            <div>
              {group.names.map((name) => (
                <span className={`rsvp-person ${group.tone}`} key={name}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchLocationSlide({ id }: { id: string }) {
  return (
    <div className="match-location-slide slide-panel" id={`schedule-${id}`}>
      <span className="detail-chip">Game</span>
      <div className="detail-match-header">
        <div>
          <span>Opponent</span>
          <strong>Metro Athletic</strong>
        </div>
        <span className="versus-pill dark">VS</span>
        <div>
          <span>Our team</span>
          <strong>Harbor FC</strong>
        </div>
      </div>
      <div className="detail-info-row">
        <span>Thursday 28.5.2026</span>
        <span>Gathering 19:15</span>
        <span>20:15 - 21:55</span>
        <button type="button">Add to calendar</button>
      </div>
      <div className="venue-lines">
        <span>Eastside Pitch</span>
        <span>City Cup 2026</span>
      </div>
      <div className="map-layout">
        <div className="map-mock">
          <div className="map-road road-a" />
          <div className="map-road road-b" />
          <div className="map-road road-c" />
          <div className="map-park park-a" />
          <div className="map-park park-b" />
          <span className="map-pin">HFC</span>
        </div>
        <div className="map-actions">
          <button type="button">Open in maps</button>
          <button type="button">Copy address</button>
        </div>
      </div>
    </div>
  );
}

function AdminScheduleSlide({ id }: { id: string }) {
  return (
    <div className="admin-schedule-slide slide-panel" id={`schedule-${id}`}>
      <aside className="admin-sidebar">
        <span>Admin</span>
        <strong>Harbor FC</strong>
        {['Dashboard', 'Schedule', 'Players', 'Milestones', 'News'].map((item) => (
          <em className={item === 'Schedule' ? 'active' : undefined} key={item}>
            {item}
          </em>
        ))}
      </aside>
      <div className="admin-main">
        <div className="admin-top">
          <h3>Schedule</h3>
          <button type="button">Logout</button>
        </div>
        <div className="import-card">
          <strong>Official match import</strong>
          <p>Check for updates, then add changes to the calendar.</p>
          <div>
            <span>All teams</span>
            <button type="button">Check updates</button>
          </div>
        </div>
        <div className="admin-tabs">
          {['Upcoming', 'Past', 'All', 'Matches', 'Training'].map((tab) => (
            <span className={tab === 'Upcoming' ? 'active' : undefined} key={tab}>
              {tab}
            </span>
          ))}
        </div>
        <div className="admin-events">
          {adminEvents.map((event) => (
            <article className={`admin-event-row ${event.accent}`} key={event.title + event.date}>
              <div>
                <strong>{event.date}</strong>
                <span>{event.time}</span>
              </div>
              <span>{event.type}</span>
              <div>
                <strong>{event.title}</strong>
                <p>{event.location}</p>
                <em>{event.note}</em>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function LineupPitchBoard({ players, mobile = false }: { players: LineupPlayer[]; mobile?: boolean }) {
  return (
    <div className={mobile ? 'lineup-pitch-board mobile' : 'lineup-pitch-board'}>
      <div className="lineup-pitch-lines" />
      {players.map((player) => (
        <div
          className={player.assigned === false ? 'lineup-slot is-empty' : 'lineup-slot'}
          key={`${player.position}-${player.name}-${player.x}`}
          style={{ left: `${player.x}%`, top: `${player.y}%` }}
        >
          <span>{player.position}</span>
          <strong>{player.name}</strong>
        </div>
      ))}
    </div>
  );
}

function LineupBuilderSlide({ id }: { id: string }) {
  return (
    <div className="lineup-builder-slide slide-panel" id={`lineup-${id}`}>
      <div className="lineup-match-head">
        <div className="lineup-team-meta">
          <span className="club-crest lineup-crest red-crest">HFC</span>
          <div>
            <span>Harbor FC</span>
            <strong>Harbor FC vs Lynx / 5</strong>
            <p>Eastside Pitch</p>
          </div>
        </div>
        <span className="club-crest lineup-crest gold-crest">LYN</span>
      </div>
      <div className="lineup-meta-row">
        {['Tue, Apr 28', '20:05', '11x11', '4-2-3-1'].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="lineup-builder-body">
        <LineupPitchBoard players={lineupPlayers} />
      </div>
      <section className="substitutes-panel">
        <div className="substitutes-head">
          <div>
            <strong>Substitutes</strong>
            <p>Bench players grouped by line</p>
          </div>
          <span>8 selected</span>
        </div>
        <div className="bench-grid">
          {benchGroups.map((group) => (
            <article className="bench-card" key={group.title}>
              <div>
                <strong>{group.title}</strong>
                <span>{group.count}</span>
              </div>
              {group.players.length > 0 ? (
                <p>
                  {group.players.map((player) => (
                    <em key={player}>{player}</em>
                  ))}
                </p>
              ) : (
                <p className="empty-bench">No players</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function LineupShareSlide({ id }: { id: string }) {
  return (
    <div className="lineup-share-slide slide-panel" id={`lineup-${id}`}>
      <div className="share-view-heading">
        <strong>Social sharing view</strong>
        <p>Player lists for posts, ordered from goalkeeper to attack.</p>
      </div>
      <article className="lineup-share-card">
        <div className="share-card-top">
          <div>
            <span className="club-crest lineup-crest red-crest">HFC</span>
            <div>
              <span>Harbor FC</span>
              <strong>Harbor FC vs Lynx / 5</strong>
              <p>Eastside Pitch</p>
            </div>
          </div>
          <span className="club-crest lineup-crest gold-crest">LYN</span>
        </div>
        <div className="share-meta-row">
          <span>Tue, Apr 28</span>
          <span>20:05</span>
          <span>City Cup 2026</span>
        </div>
        <div className="share-pitch-list">
          <div className="share-pitch-lines" />
          <div className="share-list-columns">
            <div>
              <strong>Starters</strong>
              {lineupStarters.map((player) => (
                <span key={player}>{player}</span>
              ))}
            </div>
            <div>
              <strong>Substitutes</strong>
              {lineupSubstitutes.map((player) => (
                <span key={player}>{player}</span>
              ))}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

function LineupNextMatchSlide({ id }: { id: string }) {
  return (
    <div className="lineup-next-match-slide slide-panel" id={`lineup-${id}`}>
      <div className="lineup-next-card">
        <div className="next-match-top">
          <h3>Next match</h3>
          <span>1/24</span>
        </div>
        <div className="fixture-strip">
          <div>
            <span>Our team</span>
            <strong>Harbor FC</strong>
          </div>
          <span>VS</span>
          <div>
            <span>Opponent</span>
            <strong>Pine United</strong>
          </div>
        </div>
        <div className="lineup-status-grid">
          <div>
            <span>Mon, 25 May 2026 at 20:10</span>
            <strong>Riverfront Field</strong>
            <p>City Cup 2026 / Tampere</p>
          </div>
          <div>
            <span>RSVP</span>
            <p className="status-pills">
              <em>Yes 13</em>
              <em>Maybe 1</em>
              <em>No 1</em>
            </p>
          </div>
          <div>
            <span>Lineup</span>
            <strong>Not started</strong>
          </div>
          <div>
            <span>Kickoff in</span>
            <strong>10h 40m</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function LineupMobileSlide({ id }: { id: string }) {
  const unassignedSlots: LineupPlayer[] = [
    { position: 'ST', name: 'Unassigned', x: 50, y: 20, assigned: false },
    { position: 'LAM', name: 'Unassigned', x: 24, y: 43, assigned: false },
    { position: 'CAM', name: 'Unassigned', x: 50, y: 43, assigned: false },
    { position: 'RAM', name: 'Unassigned', x: 76, y: 43, assigned: false },
    { position: 'DM', name: 'Unassigned', x: 35, y: 70, assigned: false },
    { position: 'DM', name: 'Unassigned', x: 65, y: 70, assigned: false },
  ];

  return (
    <div className="lineup-mobile-slide slide-panel" id={`lineup-${id}`}>
      <div className="phone-frame">
        <div className="phone-status-row">
          <strong>9.32</strong>
          <span>40</span>
        </div>
        <div className="phone-app-bar">
          <span className="club-crest lineup-crest red-crest">HFC</span>
          <button type="button" aria-label="Open menu">
            =
          </button>
        </div>
        <section className="mobile-pitch-card">
          <div className="mobile-pitch-head">
            <div>
              <h3>Pitch</h3>
              <p>4-2-3-1 vertical layout</p>
            </div>
            <span>11 slots</span>
          </div>
          <LineupPitchBoard players={unassignedSlots} mobile />
        </section>
        <section className="assignment-sheet">
          <div className="assignment-selected">
            <strong>Unassigned</strong>
            <span>&#10003;</span>
          </div>
          <div className="assignment-list">
            {mobileAvailablePlayers.map((player) => (
              <div key={player}>
                <strong>{player}</strong>
                <span>Yes</span>
              </div>
            ))}
          </div>
        </section>
        <div className="phone-url">harborfc.fi</div>
      </div>
    </div>
  );
}

function StatsSyncBadge({ children }: { children: ReactNode }) {
  return <span className="stats-sync-badge">{children}</span>;
}

function StatsStandingsSlide({ id }: { id: string }) {
  return (
    <div className="stats-standings-slide slide-panel" id={`stats-${id}`}>
      <div className="stats-page-head">
        <div>
          <h3>Results</h3>
          <p>Standings, matches and player statistics</p>
        </div>
        <StatsSyncBadge>Auto synced</StatsSyncBadge>
      </div>
      <div className="competition-tabs">
        <span>Summer</span>
        <button className="active" type="button">
          Harbor FC (Men)
        </button>
        <button type="button">Harbor FC hobby</button>
        <span>Futsal</span>
        <button type="button">Harbor FC (Futsal)</button>
      </div>
      <div className="season-bar">
        <button type="button" aria-label="Previous season">
          &larr;
        </button>
        <div>
          <strong>2026</strong>
          <span>City League 2026 / Men</span>
        </div>
        <button type="button" aria-label="Next season">
          &rarr;
        </button>
      </div>
      <div className="standings-table-wrap">
        <div className="standings-label">Standings</div>
        <table className="standings-table">
          <thead>
            <tr>
              {['#', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'PTS'].map((heading) => (
                <th key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standingsRows.map((row) => (
              <tr className={row.highlight ? 'highlight' : undefined} key={row.team}>
                <td>{row.rank}</td>
                <td>
                  <span className={`team-dot ${row.tone}`} />
                  <strong>{row.team}</strong>
                </td>
                <td>{row.played}</td>
                <td className="win">{row.won}</td>
                <td className="draw">{row.drawn}</td>
                <td className="loss">{row.lost}</td>
                <td>{row.goalsFor}</td>
                <td>{row.goalsAgainst}</td>
                <td>{row.goalDifference}</td>
                <td>
                  <strong>{row.points}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="standings-footnote">P=Played / W=Won / D=Drawn / L=Lost / GD=Goal diff / Pts=Points</p>
      </div>
    </div>
  );
}

function StatPlayerCard({ player }: { player: PlayerStatCard }) {
  return (
    <article className={`stat-player-card ${player.tone}`}>
      <div className="stat-card-topline">
        <strong>#{player.number}</strong>
        <span className="club-crest tiny-crest red-crest">HFC</span>
      </div>
      <div className="stat-card-position">
        <span>{player.position}</span>
        <em>{player.country}</em>
      </div>
      <div className={player.portrait === 'photo' ? 'stat-card-portrait photo' : 'stat-card-portrait'} />
      <strong className="stat-card-name">{player.name}</strong>
      <div className="stat-card-numbers">
        <div>
          <strong>{player.matches}</strong>
          <span>Matches</span>
        </div>
        <div>
          <strong>{player.goals}</strong>
          <span>Goals</span>
        </div>
      </div>
      <p>Club since {player.since}</p>
    </article>
  );
}

function StatsActivePlayersSlide({ id }: { id: string }) {
  return (
    <div className="stats-active-slide slide-panel" id={`stats-${id}`}>
      <div className="stats-page-head">
        <div>
          <h3>Active Players</h3>
          <p>84 active players</p>
        </div>
        <div className="stats-segmented">
          <button className="active" type="button">Active Players</button>
          <button type="button">Hall of Fame</button>
        </div>
      </div>
      <div className="player-filter-row">
        <label>
          <span>Search</span>
          <input readOnly value="" placeholder="Search players by name" />
        </label>
        <div className="stats-segmented">
          <button className="active" type="button">All Players</button>
          <button type="button">By Team</button>
        </div>
      </div>
      <div className="stat-player-grid">
        {activePlayerCards.map((player) => (
          <StatPlayerCard key={player.number} player={player} />
        ))}
      </div>
    </div>
  );
}

function StatsHallOfFameSlide({ id }: { id: string }) {
  return (
    <div className="stats-hof-slide slide-panel" id={`stats-${id}`}>
      <div className="stats-page-head">
        <div>
          <h3>Players</h3>
          <p>Club statistics are available from 2016 onwards</p>
        </div>
        <div className="stats-segmented">
          <button type="button">Active Players</button>
          <button className="active" type="button">Hall of Fame</button>
        </div>
      </div>
      <div className="hof-heading-row">
        <div>
          <strong>Hall of Fame</strong>
          <p>Top 20 across all players in club history</p>
        </div>
        <StatsSyncBadge>Synced history</StatsSyncBadge>
      </div>
      <div className="hof-grid">
        {fameTables.map((table) => (
          <section className="hof-table-card" key={table.title}>
            <h4>{table.title}</h4>
            <div>
              {table.rows.map((row) => (
                <article className="hof-row" key={`${table.title}-${row.rank}`}>
                  <span>{row.rank}</span>
                  <strong>{row.name}</strong>
                  {row.active && <em aria-label="Active player" />}
                  <p>
                    {row.value} {table.unit}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function StatsPreviousMatchSlide({ id }: { id: string }) {
  return (
    <div className="stats-match-slide slide-panel" id={`stats-${id}`}>
      <article className="previous-match-card">
        <div className="next-match-top">
          <h3>Previous match</h3>
          <span>6/28</span>
        </div>
        <div className="previous-context-row">
          <span>Harbor FC (Men)</span>
          <StatsSyncBadge>Played</StatsSyncBadge>
        </div>
        <div className="previous-score-strip">
          <div>
            <span>Opponent</span>
            <strong>Lynx / 5</strong>
          </div>
          <div>
            <strong>0 - 1</strong>
            <span>Win</span>
          </div>
          <div>
            <span>Our team</span>
            <strong>Harbor FC</strong>
          </div>
        </div>
        <div className="previous-match-grid">
          <div>
            <span>Tue, 28 Apr 2026 at 20:05</span>
            <strong>Eastside Pitch</strong>
            <p>City League / Men</p>
          </div>
          <div>
            <span>RSVP</span>
            <p className="status-pills">
              <em>Yes 17</em>
              <em>Maybe 1</em>
              <em>No 1</em>
            </p>
          </div>
          <div>
            <span>Lineup</span>
            <strong>Ready (18 players)</strong>
          </div>
          <div>
            <span>Man of the match</span>
            <strong>Winner: Henri Laine</strong>
          </div>
        </div>
        <div className="match-derived-row">
          <span>Result imported</span>
          <span>Table recalculated</span>
          <span>Player totals updated</span>
        </div>
      </article>
    </div>
  );
}

function LineupMockup() {
  const players = ['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'LW', 'AM', 'RW', 'ST'];

  return (
    <div className="pitch-ui">
      <div className="pitch-lines" />
      {players.map((player, index) => (
        <span className={`player-dot player-${index}`} key={`${player}-${index}`}>
          {player}
        </span>
      ))}
    </div>
  );
}

function StatsMockup() {
  return (
    <div className="stats-ui">
      <div className="stat-hero">
        <span>Player stats</span>
        <strong>37 goals</strong>
      </div>
      <div className="table-ui">
        {['BasePitch FC', 'North City', 'Union 87', 'Harbor Town'].map((team, index) => (
          <div className="table-row" key={team}>
            <span>{index + 1}</span>
            <strong>{team}</strong>
            <em>{24 - index * 3} pts</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function SocialFeedSlide({ id }: { id: string }) {
  return (
    <div className="social-feed-slide slide-panel" id={`cards-${id}`}>
      <div className="social-slide-heading">
        <div>
          <h3>Milestone Feed</h3>
          <p>Recent achievements from played matches</p>
        </div>
        <button type="button" aria-label="Next milestones">
          &rarr;
        </button>
      </div>
      <div className="milestone-feed-grid">
        {socialMilestones.map((milestone) => (
          <article className="milestone-feed-card" key={`${milestone.title}-${milestone.body}`}>
            <div className="milestone-card-top">
              <span className={`milestone-icon ${milestone.tone}`}>{milestone.label.charAt(0)}</span>
              <time>{milestone.date}</time>
            </div>
            <span className={`milestone-label ${milestone.tone}`}>{milestone.label}</span>
            <strong>{milestone.title}</strong>
            <p>{milestone.body}</p>
          </article>
        ))}
      </div>
      <div className="feed-dots" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => (
          <span className={index === 0 ? 'active' : undefined} key={index} />
        ))}
      </div>
    </div>
  );
}

function GeneratedMilestoneCard({ compact = false }: { compact?: boolean }) {
  return (
    <article className={compact ? 'generated-social-card compact' : 'generated-social-card'}>
      <div className="generated-match-row">
        <div>
          <span className="club-crest social-mini-crest red-crest">HFC</span>
          <strong>Harbor FC</strong>
        </div>
        <strong className="generated-score">2-5</strong>
        <div>
          <span className="club-crest social-mini-crest green-crest">ET</span>
          <strong>East Town</strong>
        </div>
      </div>
      <h3>100 appearances</h3>
      <div className="player-card-preview">
        <div className="player-card-top">
          <strong>#23</strong>
          <span className="club-crest tiny-crest red-crest">HFC</span>
        </div>
        <span className="player-position">LB</span>
        <div className="portrait-shape" aria-hidden="true">
          <span />
        </div>
        <strong className="player-name">Mika Salonen</strong>
        <div className="player-stats">
          <div>
            <strong>100</strong>
            <span>Matches</span>
          </div>
          <div>
            <strong>4</strong>
            <span>Goals</span>
          </div>
        </div>
        <p>Club since 2020</p>
      </div>
    </article>
  );
}

function SocialCardPreviewSlide({ id }: { id: string }) {
  return (
    <div className="social-card-preview-slide slide-panel" id={`cards-${id}`}>
      <GeneratedMilestoneCard />
    </div>
  );
}

function SocialCardEditorSlide({ id }: { id: string }) {
  return (
    <div className="social-editor-slide slide-panel" id={`cards-${id}`}>
      <div className="editor-titlebar">
        <div>
          <h3>Social Card Editor</h3>
          <p>Appearance milestone / editable post template</p>
        </div>
        <button type="button" aria-label="Close editor">
          x
        </button>
      </div>
      <div className="editor-layout">
        <div className="editor-preview">
          <GeneratedMilestoneCard compact />
          <p>Live preview scaled from 1080x1350 export size.</p>
        </div>
        <div className="editor-controls">
          {[
            ['Title', 'Appearance Milestone', 'Position / Format / Variables'],
            ['Match block', 'Team crests, team names and score', 'Position / Format'],
            ['Text block', '100 appearances', 'Position / Format / Variables'],
          ].map(([title, value, tools]) => (
            <section className="editor-control-card" key={title}>
              <strong>{title}</strong>
              <label>
                Text
                {title === 'Text block' ? <textarea value={value} readOnly /> : <input value={value} readOnly />}
              </label>
              <div>
                {tools.split(' / ').map((tool) => (
                  <button type="button" key={tool}>
                    {tool}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function SocialMilestonesSlide({ id }: { id: string }) {
  return (
    <div className="social-milestones-slide slide-panel" id={`cards-${id}`}>
      <aside className="admin-sidebar social-sidebar">
        <span>Admin</span>
        <strong>Harbor FC</strong>
        {['Dashboard', 'Schedule', 'Players', 'Milestones', 'News'].map((item) => (
          <em className={item === 'Milestones' ? 'active' : undefined} key={item}>
            {item}
          </em>
        ))}
      </aside>
      <div className="milestones-admin-main">
        <div className="admin-top">
          <h3>Milestones</h3>
          <button type="button">Settings</button>
        </div>
        <div className="timeline-card">
          <div className="timeline-head">
            <div>
              <strong>Milestones Timeline</strong>
              <p>Unified timeline grouped by match context and run date.</p>
            </div>
            <button type="button">Refresh</button>
          </div>
          <article className="timeline-match-card preview">
            <strong>Match Preview</strong>
            <p>Harbor FC vs Pine United / 25.05.2026 / Riverfront Field</p>
          </article>
          <article className="timeline-match-card">
            <div className="timeline-match-title">
              <strong>Harbor FC vs East Town</strong>
              <button type="button">Expand</button>
            </div>
            <p>May 20, 2026 / 20:15 / 4 records</p>
            <div className="timeline-records">
              {socialMilestones.slice(0, 3).map((milestone) => (
                <div className="timeline-record" key={milestone.title}>
                  <span className={`milestone-icon ${milestone.tone}`}>{milestone.label.charAt(0)}</span>
                  <div>
                    <strong>{milestone.title}</strong>
                    <p>{milestone.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

function HeroDashboardPreview() {
  return (
    <aside className="hero-dashboard-preview" aria-label="Admin dashboard preview">
      <div className="hero-dashboard-label">
        <span>Admin dashboard</span>
        <strong>Match operations across all teams</strong>
      </div>
      <div className="hero-dashboard-frame">
        <img
          alt="Admin dashboard showing next match, previous match, RSVP, lineup and kickoff status"
          src="/feature-screenshots/admin-dashboard-match-ops.png"
        />
      </div>
      <p>Next match, previous match, RSVP and lineup status across teams.</p>
    </aside>
  );
}

function App() {
  const [activeJobId, setActiveJobId] = useState<VisualType>('schedule');
  const [leadFormIntent, setLeadFormIntent] = useState<LeadFormIntent | null>(null);

  useEffect(() => {
    const workflowSections = jobs
      .map((job) => document.getElementById(`workflow-${job.id}`))
      .filter((section): section is HTMLElement => section !== null);

    if (workflowSections.length === 0) {
      return undefined;
    }

    let frameId: number | null = null;

    function updateActiveWorkflow() {
      frameId = null;
      const activationLine = Math.min(window.innerHeight * 0.34, 320);
      let activeSection = workflowSections[0];

      for (const section of workflowSections) {
        const rect = section.getBoundingClientRect();

        if (rect.top <= activationLine && rect.bottom > activationLine) {
          activeSection = section;
          break;
        }

        if (rect.top <= activationLine) {
          activeSection = section;
        }
      }

      const nextActiveJobId = activeSection.id.replace('workflow-', '') as VisualType;
      setActiveJobId((currentId) => (currentId === nextActiveJobId ? currentId : nextActiveJobId));
    }

    function requestActiveWorkflowUpdate() {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(updateActiveWorkflow);
    }

    const observer = new IntersectionObserver(requestActiveWorkflowUpdate, {
      threshold: [0, 0.2, 0.4, 0.6, 0.8],
    });

    workflowSections.forEach((section) => observer.observe(section));
    window.addEventListener('scroll', requestActiveWorkflowUpdate, { passive: true });
    window.addEventListener('resize', requestActiveWorkflowUpdate);
    requestActiveWorkflowUpdate();

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      observer.disconnect();
      window.removeEventListener('scroll', requestActiveWorkflowUpdate);
      window.removeEventListener('resize', requestActiveWorkflowUpdate);
    };
  }, []);

  useEffect(() => {
    function syncLeadIntentFromHash() {
      if (window.location.hash === '#forms') {
        setLeadFormIntent('contact');
      }

      if (window.location.hash === '#pilot-request-form') {
        setLeadFormIntent('pilot');
      }
    }

    syncLeadIntentFromHash();
    window.addEventListener('hashchange', syncLeadIntentFromHash);

    return () => window.removeEventListener('hashchange', syncLeadIntentFromHash);
  }, []);

  function openLeadForm(intent: LeadFormIntent) {
    setLeadFormIntent(intent);
    window.requestAnimationFrame(() => {
      document.getElementById('pilot-request-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return (
    <main>
      <header className="site-header" id="top">
        <div className="topbar section-shell hero-shell">
          <div className="topbar-main">
            <a className="brand" href="#top" aria-label="BasePitch home">
              <span className="brand-mark" aria-hidden="true">
                <img src="/basepitch-logo.svg" alt="" />
              </span>
              <span>BasePitch</span>
            </a>
            <WorkflowMenu activeJobId={activeJobId} onSelect={setActiveJobId} />
          </div>
          <div className="nav-links">
            <a href="#pilot">Pilot</a>
            <a
              href="#forms"
              onClick={(event) => {
                event.preventDefault();
                openLeadForm('contact');
              }}
            >
              Contact
            </a>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="section-shell hero-shell">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Club season operations</p>
              <h1>BasePitch helps football clubs run matchday, stats and media in one place.</h1>
            </div>
            <div className="hero-intro-row">
              <div className="hero-intro-copy">
                <p className="hero-subtitle">
                  When sessions and matches are coming up, BasePitch gives club staff one place to track fixtures,
                  RSVP, lineups, kickoff status, results and matchday updates.
                </p>
                <div className="hero-actions">
                  <a
                    className="button button-primary"
                    href="#pilot-request-form"
                    onClick={(event) => {
                      event.preventDefault();
                      openLeadForm('pilot');
                    }}
                  >
                    Request a pilot
                  </a>
                  <a
                    className="button button-secondary"
                    href="#forms"
                    onClick={(event) => {
                      event.preventDefault();
                      openLeadForm('contact');
                    }}
                  >
                    Contact
                  </a>
                </div>
              </div>
              <HeroDashboardPreview />
            </div>
          </div>

          <div className="hero-jobs" id="jobs">
            <p className="eyebrow">Four connected workflows</p>
            <WorkflowNav activeJobId={activeJobId} className="hero-switcher" onSelect={setActiveJobId} />
            <div className="job-panels">
              {jobs.map((job, index) => (
                <div className="workflow-section-group" key={job.id}>
                  {index > 0 && (
                    <WorkflowNav
                      activeJobId={activeJobId}
                      className="inline-workflow-switcher"
                      onSelect={setActiveJobId}
                    />
                  )}
                  <JobDetailPanel isActive={job.id === activeJobId} job={job} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="season-flow section-shell">
        <SectionHeading
          eyebrow="Weekly club workflow"
          title="How the club workflow runs from fixture to published output."
          body="BasePitch connects the operational work around each match with the public outputs that keep the club current."
        />
        <div className="flow-grid">
          {seasonFlowCards.map((card, index) => (
            <article className="flow-card" key={card.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="club-fit section-shell">
        <div className="club-fit-card">
          <div>
            <p className="eyebrow">Built for club teams</p>
            <h2>For the people running the season, not only one role.</h2>
            <p>
              BasePitch can support club admins, coaches, team managers, media staff and growing amateur
              or semi-pro clubs that want one connected matchday workflow.
            </p>
          </div>
          <div className="friction-cloud" aria-label="Club roles and setups">
            {clubFitTags.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="pilot section-shell" id="pilot">
        <div className="pilot-shell" id="forms">
          <article className="pilot-plan-card">
            <p className="eyebrow">Pilot setup</p>
            <p className="pilot-plan-label">Free pilot</p>
            <h2>2 months</h2>
            <p className="pilot-plan-subtitle">Run BasePitch in your real club workflow with direct setup support.</p>
            <ul className="pilot-terms" aria-label="Pilot conditions">
              {pilotConditionItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="offer-actions">
              <a
                className="button button-primary"
                href="#pilot-request-form"
                onClick={(event) => {
                  event.preventDefault();
                  openLeadForm('pilot');
                }}
              >
                Request a pilot
              </a>
              <a
                className="button button-secondary"
                href="#forms"
                onClick={(event) => {
                  event.preventDefault();
                  openLeadForm('contact');
                }}
              >
                Contact
              </a>
            </div>
          </article>
          <div className="pilot-side-panel" id="pilot-request-form">
            {leadFormIntent ? (
              <LeadForm
                id="pilot-request-form-form"
                intent={leadFormIntent}
                onClose={() => {
                  setLeadFormIntent(null);
                  window.history.replaceState({}, '', '#forms');
                }}
              />
            ) : (
              <article className="pilot-steps-card">
                <p className="eyebrow">What happens next</p>
                <h3>From request to live pilot in four steps.</h3>
                <ol className="pilot-steps-list" aria-label="Pilot onboarding steps">
                  {pilotProcessSteps.map((step, index) => (
                    <li key={step}>
                      <span>{index + 1}</span>
                      <p>{step}</p>
                    </li>
                  ))}
                </ol>
                <p className="pilot-steps-note">
                  We stay available throughout setup and pilot operation.
                </p>
              </article>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;

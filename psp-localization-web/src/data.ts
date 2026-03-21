import yaml from 'js-yaml';

export interface Game {
  id: string;
  titles: {
    native: string;
    zh_cn?: string;
    en?: string;
  };
  developer?: string;
  genres?: string[];
  tags?: string[];
  external_links?: {
    vndb?: string;
    igdb?: string;
    psptimes?: string;
    redump_index?: string;
  };
  description?: string;
  localizations?: Localization[];
  releases?: Release[];
}

export interface FileNode {
  path: string;
  lba: number;
  size: number;
  modified: boolean;
  mtime: string;
}

export interface Localization {
  id: string;
  title?: string | null;
  parent_localization_id: string | null;
  groups: string[] | null;
  staff: { id: string; role: string }[];
  target_release: string[];
  lang: string;
  version: string | null;
  release_date: string | null;
  tech_stats: {
    psn_base: boolean;
    media_install_compatible: boolean | null;
    cheat_code_support: boolean | null;
    font_requirement: string | null;
  };
  links: { label: string; url: string }[];
  notes?: string[];
  files?: FileNode[];
}

function deriveLocalizationTitle(loc: Localization): string {
  const explicitTitle = typeof loc.title === 'string' ? loc.title.trim() : '';
  if (explicitTitle) return explicitTitle;

  const sourceLine = loc.notes?.find((n) => n.includes('原始条目:'));
  if (sourceLine) {
    const match = sourceLine.match(/原始条目:\s*[^–-]+[–-]\s*(.+)$/);
    const raw = match ? match[1] : sourceLine;
    // 仅去除方括号内的标签（如 [简][汉化组]），保留圆括号中的版本区分信息（如 UMD Disc 2）
    const normalized = raw.replace(/\[[^\]]*\]/g, '').trim();
    if (normalized) return normalized;
  }

  if (loc.version) return `版本 ${loc.version}`;
  return loc.id;
}

export interface Release {
  id: string;
  csv_id: string;
  game_id: string;
  catalog_id: string;
  title: string;
  region: string;
  version: string;
  media: string;
  release_date: string | null;
  size: number;
  hashes: {
    crc32: string;
    md5: string;
    sha1: string;
  };
}

export interface Group {
  id: string;
  name: string;
  status?: string;
  founded?: number;
  description?: string;
  website?: string;
  archives?: { label: string; url: string }[];
}

const gameFiles = import.meta.glob('../../content/games/*/game.yml', { eager: true, query: '?raw', import: 'default' });
const localizationFiles = import.meta.glob('../../content/games/*/localizations/*.yml', { eager: true, query: '?raw', import: 'default' });
const releaseFiles = import.meta.glob('../../content/games/*/releases/*.yml', { eager: true, query: '?raw', import: 'default' });
const groupFiles = import.meta.glob('../../entities/groups/*.yml', { eager: true, query: '?raw', import: 'default' });

let cachedGames: Game[] | null = null;
let cachedGroups: Map<string, Group> | null = null;

export async function loadGames(): Promise<Game[]> {
  if (cachedGames) return cachedGames;

  const games: Game[] = [];

  for (const [path, content] of Object.entries(gameFiles)) {
    try {
      const game = yaml.load(content as string) as Game;
      if (game && game.id) {
        const gameDir = path.split('/').slice(-2, -1)[0];
        const localizations = loadLocalizationsForGame(gameDir);
        const releases = loadReleasesForGame(gameDir);
        games.push({
          ...game,
          localizations,
          releases,
        });
      }
    } catch (e) {
      console.error('Failed to parse game:', path, e);
    }
  }

  cachedGames = games.sort((a, b) => a.id.localeCompare(b.id));
  return cachedGames;
}

function loadLocalizationsForGame(gameDir: string): Localization[] {
  const localizations: Localization[] = [];
  const prefix = `../../content/games/${gameDir}/localizations/`;

  for (const [path, content] of Object.entries(localizationFiles)) {
    if (path.startsWith(prefix) && path.endsWith('.yml') && !path.includes('_files') && !path.includes('_story')) {
      try {
        const loc = yaml.load(content as string) as Localization;
        if (loc && loc.id) {
          loc.title = deriveLocalizationTitle(loc);
          // 尝试寻找对应的 files.yml
          const filesPath = path.replace('.yml', '_files.yml');
          if (localizationFiles[filesPath]) {
             try {
                const filesData = yaml.load(localizationFiles[filesPath] as string) as any;
                if (filesData && filesData.file_tree) {
                   loc.files = filesData.file_tree;
                }
             } catch (e) {
                 console.error('Failed to parse localization files:', filesPath, e);
             }
          }
          localizations.push(loc);
        }
      } catch (e) {
        console.error('Failed to parse localization:', path, e);
      }
    }
  }

  return localizations.sort((a, b) => a.id.localeCompare(b.id));
}

export function loadReleasesForGame(gameDir: string): Release[] {
  const releases: Release[] = [];
  const prefix = `../../content/games/${gameDir}/releases/`;

  for (const [path, content] of Object.entries(releaseFiles)) {
    if (path.startsWith(prefix) && path.endsWith('.yml')) {
      try {
        const release = yaml.load(content as string) as Release;
        if (release && release.id) {
          releases.push(release);
        }
      } catch (e) {
        console.error('Failed to parse release:', path, e);
      }
    }
  }

  return releases.sort((a, b) => a.id.localeCompare(b.id));
}

export async function loadGameById(id: string): Promise<Game | null> {
  const games = await loadGames();
  return games.find(g => g.id === id) || null;
}

export async function loadGroups(): Promise<Map<string, Group>> {
  if (cachedGroups) return cachedGroups;

  cachedGroups = new Map();

  for (const [path, content] of Object.entries(groupFiles)) {
    try {
      const group = yaml.load(content as string) as Group;
      if (group && group.id) {
        cachedGroups.set(group.id, group);
      }
    } catch (e) {
      console.error('Failed to parse group:', path, e);
    }
  }

  return cachedGroups;
}

export async function loadGroupById(id: string): Promise<Group | null> {
  const groups = await loadGroups();
  return groups.get(id) || null;
}

export function getAllGroups(games: Game[]): { id: string; name: string }[] {
  const groupIds = new Set<string>();
  games.forEach(game => {
    game.localizations?.forEach(loc => {
      if (loc.groups) {
        loc.groups.forEach(g => groupIds.add(g));
      }
    });
  });

  const result: { id: string; name: string }[] = [];
  groupIds.forEach(id => {
    result.push({ id, name: id });
  });

  return result.sort((a, b) => a.id.localeCompare(b.id));
}

export function getAllLanguages(games: Game[]): string[] {
  const languages = new Set<string>();
  games.forEach(game => {
    game.localizations?.forEach(loc => {
      if (loc.lang) {
        languages.add(loc.lang);
      }
    });
  });
  return Array.from(languages).sort();
}

export function filterGames(
  games: Game[],
  filters: {
    search?: string;
    language?: string;
    group?: string;
  }
): Game[] {
  return games.filter(game => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchTitle = game.titles?.native?.toLowerCase().includes(searchLower) ||
                         game.titles?.zh_cn?.toLowerCase().includes(searchLower) ||
                         game.titles?.en?.toLowerCase().includes(searchLower);
      const matchId = game.id.toLowerCase().includes(searchLower);
      if (!matchTitle && !matchId) return false;
    }

    if (filters.language && filters.language !== 'all') {
      const hasLang = game.localizations?.some(loc => loc.lang === filters.language);
      if (!hasLang) return false;
    }

    if (filters.group && filters.group !== 'all') {
      const hasGroup = game.localizations?.some(loc => loc.groups?.includes(filters.group!));
      if (!hasGroup) return false;
    }

    return true;
  });
}

export interface Game {
  id: string;
  title: string;
  language: string[];
  groups: string[] | null;
  official: boolean | null;
  version: string[] | null;
  disc: string | null;
  notes: string[] | null;
  raw: string;
}

export interface GameFull {
  id: string;
  titles: {
    native: string;
    zh_cn?: string;
    en?: string;
  };
  developer?: string;
  genres?: string[];
  tags?: string[];
  description?: string;
  external_links?: {
    vndb?: string;
    igdb?: string;
    psptimes?: string;
  };
}

export interface Localization {
  id: string;
  title: string;
  language: string[];
  groups: string[] | null;
  official: boolean | null;
  version: string[] | null;
  disc: string | null;
  notes: string[] | null;
  raw: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  website?: string;
}
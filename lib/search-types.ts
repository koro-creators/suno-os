export type SearchResultType = 'client' | 'skill' | 'document';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  label: string;
  sublabel?: string;
  href: string;
  color?: string;
  icon?: string;
}

export interface SearchGroup {
  type: SearchResultType;
  label: string;
  items: SearchResult[];
}

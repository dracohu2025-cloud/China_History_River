
export interface Dynasty {
  id: string;
  name: string;
  chineseName: string;
  startYear: number;
  endYear: number;
  color: string;
  description: string;
}

export interface HistoricalEvent {
  year: number;
  title: string;
  titleEn?: string;
  titleZh?: string;
  type: 'war' | 'culture' | 'politics' | 'science';
  description?: string;
  importance: 1 | 2 | 3 | 4 | 5; // 1 = Critical, 5 = Minor
}

export interface RiverDataPoint {
  year: number;
  [key: string]: number;
}

export interface Viewport {
  x: number;
  y: number;
  k: number;
}


export interface EventDetail {
  year: number;
  title: string;
  content: string;
}

export interface RiverPin {
  year: number;
  jobId: string;
  title?: string;
  doubanRating?: number | null;
}

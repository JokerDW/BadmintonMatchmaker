export enum Gender {
  MALE = '男',
  FEMALE = '女',
}

export interface Player {
  id?: number;
  name: string;
  level: number;
  gender: Gender;
  partner?: string; // Stores the name of the fixed partner
  gamesPlayed: number;
}

export interface Matchup {
  id?: number;
  playerIds: number[]; // Should always contain 4 IDs
  timestamp: number;
}

export interface Court {
  id?: number;
  name: string;
  players: Player[]; // Empty array if court is free
}

export interface GameHistory {
  id?: number;
  playerIds: number[];
  timestamp: number;
}

import Dexie, { Table } from 'dexie';
import { Player, Matchup, Court, GameHistory } from './types';

export class BadmintonDatabase extends Dexie {
  players!: Table<Player, number>;
  matchups!: Table<Matchup, number>; // Preparation area
  courts!: Table<Court, number>;
  history!: Table<GameHistory, number>;

  constructor() {
    super('BadmintonDB');
    (this as any).version(1).stores({
      players: '++id, name, level, gender, gamesPlayed',
      matchups: '++id',
      courts: '++id',
      history: '++id, *playerIds', // Index playerIds for efficient searching
    });
  }
}

export const db = new BadmintonDatabase();

// Initialize default courts if empty
(db as any).on('populate', () => {
  db.courts.bulkAdd([
    { name: '場地 1', players: [] },
    { name: '場地 2', players: [] },
    { name: '場地 3', players: [] },
  ]);
});
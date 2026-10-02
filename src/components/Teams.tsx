import type { Teams as T } from '../types';

/** A 隊 vs B 隊 */
export function TeamsView({ teams, nm }: { teams: T; nm: (id: string) => string }) {
  return (
    <div className="teams">
      <div className="side">
        <span>{nm(teams.a[0])}</span>
        <span>{nm(teams.a[1])}</span>
      </div>
      <span className="vs">vs</span>
      <div className="side right">
        <span>{nm(teams.b[0])}</span>
        <span>{nm(teams.b[1])}</span>
      </div>
    </div>
  );
}

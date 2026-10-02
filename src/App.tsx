import { useStore } from './store';
import { Nav } from './components/Nav';
import { PlayerDialog } from './components/PlayerDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { PlayersPage } from './pages/PlayersPage';
import { CourtsPage } from './pages/CourtsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ReservePage } from './pages/ReservePage';
import { FeesPage } from './pages/FeesPage';

const PAGES = {
  players: PlayersPage,
  courts: CourtsPage,
  history: HistoryPage,
  reserve: ReservePage,
  fees: FeesPage,
};

export default function App() {
  const { ui } = useStore();
  const Page = PAGES[ui.tab];
  return (
    <div className="app">
      <Nav />
      <main className="app-main">
        <Page />
      </main>
      <PlayerDialog />
      <SettingsDialog />
    </div>
  );
}

import { Card, PulseDot, Tabs } from '@kobold/ui';
import { useState } from 'react';
import './win-feed.css';

/**
 * Лента выигрышей.
 *
 * Своя строка подсвечивается: игрок должен находить себя в ленте без поиска
 * глазами. Проигрыш показывается наравне с выигрышем — лента, где все
 * выигрывают, врёт и это заметно.
 *
 * Данные пока статичные: живая лента приедет вместе со сводным каналом лобби.
 */
interface FeedRow {
  id: string;
  game: string;
  player: string;
  mine?: boolean;
  stake: string;
  multiplier: string | null;
  payout: string;
  won: boolean;
}

const ROWS: FeedRow[] = [
  { id: '1', game: 'Limbo', player: 'zvezda_77', stake: '500', multiplier: '412.60×', payout: '+206 300', won: true },
  { id: '2', game: 'Mines', player: 'koldun_777', mine: true, stake: '1 000', multiplier: '2.47×', payout: '+2 470', won: true },
  { id: '3', game: 'Crash', player: 'nochnoy', stake: '3 000', multiplier: '1.14×', payout: '+3 420', won: true },
  { id: '4', game: 'Towers', player: 'grib', stake: '250', multiplier: null, payout: '−250', won: false },
  { id: '5', game: 'Plinko', player: 'ratatui', stake: '100', multiplier: '26.00×', payout: '+2 600', won: true },
];

export function WinFeed() {
  const [tab, setTab] = useState('all');

  return (
    <Card flush className="win-feed">
      <div className="win-feed__head">
        <div className="kb-title-s">Лента выигрышей</div>
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'all', label: 'Все' },
            { value: 'big', label: 'Крупные' },
            { value: 'mine', label: 'Мои' },
          ]}
        />
        <span className="win-feed__status">
          <PulseDot tone="win" size={5} />
          <span className="kb-overline">обновляется</span>
        </span>
      </div>

      <div className="win-feed__row win-feed__row--head">
        <span>Игра</span>
        <span>Игрок</span>
        <span>Ставка</span>
        <span>Множ.</span>
        <span>Выплата</span>
      </div>

      {ROWS.filter((row) => (tab === 'mine' ? row.mine : true)).map((row) => (
        <div key={row.id} className={`win-feed__row${row.mine ? ' is-mine' : ''}`}>
          <span className="win-feed__game">{row.game}</span>
          <span className="win-feed__player">
            {row.player}
            {row.mine ? <span className="win-feed__me">· ты</span> : null}
          </span>
          <span className="kb-num win-feed__num">{row.stake}</span>
          <span className="kb-num win-feed__num win-feed__multiplier">
            {row.multiplier ?? '—'}
          </span>
          <span className={`kb-num win-feed__num win-feed__payout${row.won ? '' : ' is-loss'}`}>
            {row.payout}
          </span>
        </div>
      ))}
    </Card>
  );
}

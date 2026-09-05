import { useSessionStore } from '@/entities/session';
import { isApiError } from '@/shared/api';
import { GameFooter, GameShell } from '@/shared/ui';
import type { CurrencyCode } from '@kobold/money';
import { Button, Card } from '@kobold/ui';
import { useLimbo } from '../model/use-limbo.js';
import './bet-panel.css';
import { LimboDisplay, LimboHistory } from './LimboDisplay.js';

/**
 * Сборка Limbo: панель ставки, отрисовка, подвал честности.
 *
 * Граница «логика — представление» здесь та же, что на сервере:
 *   @kobold/game-engine — чистая математика,
 *   use-limbo           — состояние поверх useAtomicBet,
 *   LimboDisplay        — отрисовка,
 *   этот файл           — сборка.
 */
export function Limbo() {
  const currency = (useSessionStore((s) => s.user?.currency) ?? 'USD') as CurrencyCode;
  const game = useLimbo(currency);

  const lastMultiplier = game.lastResult ? Number(game.lastResult.result.multiplier) / 100 : null;

  return (
    <GameShell
      panel={
        <Card className="bet-panel">
          <label className="bet-panel__field">
            <span className="kb-overline">Ставка</span>
            <input
              className="kb-input"
              inputMode="decimal"
              value={game.stake}
              onChange={(e) => game.setStake(e.target.value)}
            />
          </label>

          <label className="bet-panel__field">
            <span className="kb-overline">Множитель</span>
            <input
              className="kb-input"
              inputMode="decimal"
              value={game.target}
              aria-invalid={!game.valid}
              onChange={(e) => game.setTarget(e.target.value)}
            />
          </label>

          <div className="bet-panel__field">
            <span className="kb-overline">Шанс</span>
            <span className="kb-money">
              {game.winChance === null ? '—' : `${(game.winChance * 100).toFixed(4)}%`}
            </span>
          </div>

          <Button block pending={game.isPending} disabled={!game.valid} onClick={game.play}>
            Играть
          </Button>

          {game.error ? (
            <span className="bet-panel__error">
              {isApiError(game.error) ? game.error.message : 'Ставка не прошла. Попробуй ещё раз.'}
            </span>
          ) : null}
        </Card>
      }
      footer={
        <GameFooter
          nonce={game.lastResult?.nonce ?? null}
          serverSeedHash={game.lastResult?.serverSeedHash ?? null}
          clientSeed={game.lastResult?.clientSeed ?? null}
        />
      }
    >
      <div className="limbo-stage">
        <LimboHistory
          items={game.history.map((h) => ({
            id: h.id,
            multiplier: h.result.multiplier,
            won: h.won,
          }))}
        />
        <LimboDisplay
          multiplier={lastMultiplier}
          won={game.lastResult?.won ?? null}
          animate={!game.isPending}
        />
      </div>
    </GameShell>
  );
}

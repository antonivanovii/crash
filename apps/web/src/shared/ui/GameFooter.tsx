import { Link } from '@tanstack/react-router';

/**
 * Подвал честности. Не сноска в футере сайта: nonce, хэш серверного сида
 * и ссылка на верификатор видны прямо на экране игры, в каждом раунде.
 */
export function GameFooter({
  nonce,
  serverSeedHash,
  clientSeed,
}: {
  nonce: number | null;
  serverSeedHash: string | null;
  clientSeed: string | null;
}) {
  return (
    <div className="game-footer">
      <span className="kb-overline">Честность</span>
      <span className="kb-num game-footer__item">nonce {nonce ?? '—'}</span>
      <span className="kb-num game-footer__item" title={serverSeedHash ?? undefined}>
        hash {serverSeedHash ? `${serverSeedHash.slice(0, 12)}…` : '—'}
      </span>
      <span className="kb-num game-footer__item">seed {clientSeed ?? '—'}</span>
      <Link to="/fairness/verify">Проверить раунд</Link>
    </div>
  );
}

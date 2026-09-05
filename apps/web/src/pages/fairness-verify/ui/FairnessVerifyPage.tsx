import { playDice, playLimbo, verifyServerSeed } from '@kobold/game-engine';
import { multiplierToDecimal } from '@kobold/money';
import { Button, Card } from '@kobold/ui';
import { useState } from 'react';
import './fairness-verify.css';

/**
 * Верификатор.
 *
 * Раз game-engine общий с бэкендом, это буквально вызов той же функции,
 * которой считал сервер. Двадцать строк кода и главный аргумент продукта:
 * игрок пересчитывает свой раунд у себя в браузере и сходится с нами
 * байт в байт.
 */
export function FairnessVerifyPage() {
  const [serverSeed, setServerSeed] = useState('');
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState('0');
  const [game, setGame] = useState<'limbo' | 'dice'>('limbo');
  const [output, setOutput] = useState<string | null>(null);

  const run = () => {
    const seed = {
      serverSeed: serverSeed.trim(),
      clientSeed: clientSeed.trim(),
      nonce: Number(nonce),
    };

    const commitment = serverSeedHash.trim()
      ? verifyServerSeed(seed.serverSeed, serverSeedHash.trim())
      : null;

    const lines = [
      commitment === null
        ? 'Хэш коммитмента не указан — проверка сида пропущена.'
        : commitment
          ? '✓ Раскрытый серверный сид сходится с опубликованным хэшем.'
          : '✗ Серверный сид НЕ сходится с хэшем. Это повод для разбора.',
      '',
    ];

    if (game === 'limbo') {
      const outcome = playLimbo(seed, { target: 100n });
      lines.push(`u = ${outcome.result.u}`);
      lines.push(`множитель = ${multiplierToDecimal(outcome.result.multiplier).toFixed(2)}×`);
    } else {
      const outcome = playDice(seed, { target: 5000, direction: 'UNDER' });
      lines.push(`u = ${outcome.result.u}`);
      lines.push(`ролл = ${(outcome.result.roll / 100).toFixed(2)}`);
    }

    setOutput(lines.join('\n'));
  };

  return (
    <div className="page">
      <h1 className="page__title">Проверка раунда</h1>
      <p className="page__stub">
        Пересчёт идёт у тебя в браузере той же функцией, которой считал сервер. Мы ничего не
        запрашиваем — код открыт и лежит в общем пакете.
      </p>

      <Card className="verify-form">
        <label className="verify-form__field">
          <span className="kb-overline">Серверный сид (раскрытый)</span>
          <input
            className="kb-input"
            value={serverSeed}
            onChange={(e) => setServerSeed(e.target.value)}
          />
        </label>

        <label className="verify-form__field">
          <span className="kb-overline">Опубликованный хэш</span>
          <input
            className="kb-input"
            value={serverSeedHash}
            onChange={(e) => setServerSeedHash(e.target.value)}
          />
        </label>

        <label className="verify-form__field">
          <span className="kb-overline">Клиентский сид</span>
          <input
            className="kb-input"
            value={clientSeed}
            onChange={(e) => setClientSeed(e.target.value)}
          />
        </label>

        <label className="verify-form__field">
          <span className="kb-overline">Nonce</span>
          <input
            className="kb-input"
            inputMode="numeric"
            value={nonce}
            onChange={(e) => setNonce(e.target.value)}
          />
        </label>

        <label className="verify-form__field">
          <span className="kb-overline">Игра</span>
          <select
            className="kb-input"
            value={game}
            onChange={(e) => setGame(e.target.value as 'limbo' | 'dice')}
          >
            <option value="limbo">Limbo</option>
            <option value="dice">Dice</option>
          </select>
        </label>

        <Button onClick={run} disabled={!serverSeed || !clientSeed}>
          Пересчитать
        </Button>

        {output ? <pre className="verify-form__output kb-num">{output}</pre> : null}
      </Card>
    </div>
  );
}

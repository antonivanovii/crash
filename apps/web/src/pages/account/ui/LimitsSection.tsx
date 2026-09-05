import { formatMoney } from '@kobold/money';
import { Alert, AmountInput, Badge, Button, Card, Check, Chip, Progress, Segmented, Slider } from '@kobold/ui';
import { useState } from 'react';
import {
  cancelPending,
  formatEffectiveAt,
  requestLimitChange,
  type LimitState,
} from '../model/limits.js';
import './limits.css';

const LOSS_OPTIONS = [
  { value: '500000', label: '5 000 ₽ в неделю' },
  { value: '1500000', label: '15 000 ₽ в неделю' },
  { value: 'custom', label: 'Свой' },
  { value: 'none', label: 'Без лимита' },
];

/**
 * Лимиты и пауза.
 *
 * Ужесточение применяется сразу, ослабление — через сутки. Макет обещает это
 * текстом, но не рисует, поэтому состояние отложенной заявки достроено:
 * бейдж, срок вступления в силу и кнопка отмены.
 */
export function LimitsSection() {
  const [deposit, setDeposit] = useState<LimitState>({ value: 2_000_000n });
  const [depositInput, setDepositInput] = useState('20 000,00');
  const [period, setPeriod] = useState('day');
  const [session, setSession] = useState(60);
  const [loss, setLoss] = useState('1500000');

  const applyDeposit = () => {
    const next = BigInt(depositInput.replace(/\D/g, '') || '0');
    setDeposit((state) => requestLimitChange(state, next));
  };

  return (
    <Card className="account-card account-card--wide">
      <div className="account-card__head">
        <div className="kb-title-s">Лимиты и пауза</div>
        <p className="account-card__note">
          Ужесточить можно сразу. Ослабить — только через 24 часа после заявки.
        </p>
      </div>

      <div className="limits-grid">
        {/* ── Депозит ────────────────────────────────────────────────────── */}
        <div className="limit-card">
          <div className="limit-card__head">
            <span className="limit-card__title">Лимит депозита</span>
            {deposit.pending ? (
              <Badge tone="escrow" size="s">
                ОТЛОЖЕНО
              </Badge>
            ) : null}
          </div>

          <Segmented
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'day', label: 'День' },
              { value: 'week', label: 'Неделя' },
              { value: 'month', label: 'Месяц' },
            ]}
          />

          <AmountInput
            value={depositInput}
            onValueChange={setDepositInput}
            suffix="₽"
            onBlur={applyDeposit}
          />

          <Progress value={500000} max={Number(deposit.value)} tone="win" />
          <div className="limit-card__note kb-num">
            использовано {formatMoney(500_000n, 'RUB')} из {formatMoney(deposit.value, 'RUB')}
          </div>

          {deposit.pending ? (
            <div className="limit-card__pending">
              <span>
                Новое значение {formatMoney(deposit.pending.value, 'RUB')} вступит в силу{' '}
                {formatEffectiveAt(deposit.pending.effectiveAt)}.
              </span>
              <Button
                variant="ghost"
                size="s"
                onClick={() => setDeposit((state) => cancelPending(state))}
              >
                Отменить заявку
              </Button>
            </div>
          ) : null}
        </div>

        {/* ── Время сессии ───────────────────────────────────────────────── */}
        <div className="limit-card limit-card--accent">
          <div className="limit-card__head">
            <span className="limit-card__title">Лимит времени в сессии</span>
          </div>

          <div className="limit-card__value">
            <span className="limit-card__number kb-num">{session}</span>
            <span className="limit-card__unit">минут за сессию</span>
          </div>

          <Slider
            min={15}
            max={180}
            step={15}
            value={session}
            onChange={(e) => setSession(Number(e.target.value))}
            scale={[15, 60, 'без лимита']}
            tone="amber"
          />

          <Alert tone="warning" title="Сейчас идёт 48-я минута">
            За пять минут до конца покажем предупреждение, потом закроем вход до 09:00.
          </Alert>
        </div>

        {/* ── Проигрыш ───────────────────────────────────────────────────── */}
        <div className="limit-card">
          <div className="limit-card__head">
            <span className="limit-card__title">Лимит проигрыша</span>
          </div>

          <div className="limit-card__options">
            {LOSS_OPTIONS.map((option) => (
              <Check
                key={option.value}
                variant="radio"
                name="loss-limit"
                checked={loss === option.value}
                onChange={() => setLoss(option.value)}
                label={option.label}
              />
            ))}
          </div>

          <Progress value={7200} max={15000} tone="loss" />
          <div className="limit-card__note kb-num">
            проиграно {formatMoney(720_000n, 'RUB')} из {formatMoney(1_500_000n, 'RUB')} · сброс в пн
          </div>
        </div>
      </div>

      <div className="limits-bottom">
        <div className="limit-card">
          <span className="limit-card__title">Тайм-аут</span>
          <p className="limit-card__note">
            Короткая пауза. Ставки закрыты, баланс остаётся на месте, вывод доступен.
          </p>
          <div className="limit-card__chips">
            <Chip>24 часа</Chip>
            <Chip>7 дней</Chip>
            <Chip>30 дней</Chip>
          </div>
        </div>

        <div className="limit-card limit-card--danger">
          <span className="limit-card__title limit-card__title--danger">Самоисключение</span>
          <p className="limit-card__note">
            От 6 месяцев. Аккаунт закрывается полностью, отменить решение до конца срока
            нельзя. Свободные средства выведем на твою карту.
          </p>
          <div className="limit-card__chips">
            <Button variant="danger" size="m">
              Оформить
            </Button>
            <span className="limit-card__note">Поддержка ответит в течение часа</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

import { Button, Card, PulseDot, Switch } from '@kobold/ui';

/**
 * Безопасность и активные сессии.
 *
 * Сессия с незнакомого устройства подсвечивается красным, а не просто
 * перечисляется: это единственная строка, ради которой сюда заходят.
 */
const SESSIONS = [
  {
    id: 'current',
    title: 'Chrome · macOS',
    place: 'Москва · 213.87.•.•',
    tone: 'win' as const,
    current: true,
  },
  { id: 'iphone', title: 'Safari · iPhone', place: 'Москва · 3 часа назад', tone: 'muted' as const },
  {
    id: 'unknown',
    title: 'Firefox · Windows',
    place: 'Казань · неизвестное устройство',
    tone: 'loss' as const,
    suspicious: true,
  },
];

export function SecuritySection() {
  return (
    <>
      <Card className="account-card">
        <div className="kb-title-s account-card__title">Безопасность</div>

        <div className="account-rows">
          <div className="account-row account-row--success">
            <span className="account-row__icon" aria-hidden>
              ✓
            </span>
            <div className="account-row__body">
              <div className="account-row__title">Двухфакторная защита</div>
              <div className="account-row__note kb-num">приложение-аутентификатор · с 04.06</div>
            </div>
            <Switch defaultChecked tone="win" aria-label="Двухфакторная защита" />
          </div>

          <div className="account-row">
            <span className="account-row__icon account-row__icon--neutral kb-num" aria-hidden>
              ✳
            </span>
            <div className="account-row__body">
              <div className="account-row__title">Пароль</div>
              <div className="account-row__note kb-num">изменён 92 дня назад</div>
            </div>
            <Button variant="secondary" size="s">
              Сменить
            </Button>
          </div>

          <div className="account-row">
            <div className="account-row__body">
              <div className="account-row__title">Подтверждать вывод по e-mail</div>
              <div className="account-row__note">каждая заявка требует кода из письма</div>
            </div>
            <Switch defaultChecked aria-label="Подтверждать вывод по e-mail" />
          </div>

          <div className="account-row">
            <div className="account-row__body">
              <div className="account-row__title">Уведомлять о входе с нового устройства</div>
            </div>
            <Switch aria-label="Уведомлять о входе с нового устройства" />
          </div>
        </div>
      </Card>

      <Card className="account-card">
        <div className="kb-overline account-card__overline">Активные сессии</div>

        <div className="account-sessions">
          {SESSIONS.map((session) => (
            <div
              key={session.id}
              className={`account-session${session.current ? ' is-current' : ''}`}
            >
              <PulseDot tone={session.tone} size={8} still={!session.suspicious} />
              <div className="account-session__body">
                <div className="account-session__title">
                  {session.title}
                  {session.current ? (
                    <span className="account-session__badge kb-num">· это устройство</span>
                  ) : null}
                </div>
                <div
                  className={`account-session__place kb-num${session.suspicious ? ' is-alert' : ''}`}
                >
                  {session.place}
                </div>
              </div>
              {session.current ? null : (
                <Button variant="ghost" size="s" className="account-session__revoke">
                  Завершить
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Кнопки в макете нет — добавлена: отзывать сессии по одной при угоне бессмысленно. */}
        <Button variant="danger" size="m" className="account-sessions__revoke-all">
          Завершить все, кроме текущей
        </Button>
      </Card>
    </>
  );
}

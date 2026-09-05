import { Card, Switch } from '@kobold/ui';

const CHANNELS = [
  { id: 'settle', title: 'Расчёт моих ставок', note: 'push и e-mail', on: true },
  { id: 'odds', title: 'Изменение коэффициента в купоне', note: 'только push', on: true },
  { id: 'bonus', title: 'Бонусы и турниры', note: 'не чаще раза в неделю', on: false },
  { id: 'session', title: 'Напоминание о лимите сессии', on: true, tone: 'amber' as const },
  {
    id: 'partners',
    title: 'Реклама партнёров',
    note: 'отключено в настройках приватности',
    on: false,
    disabled: true,
  },
];

export function NotificationsSection() {
  return (
    <Card className="account-card">
      <div className="kb-title-s account-card__title">Уведомления</div>

      <div className="account-toggles">
        {CHANNELS.map((channel) => (
          <div key={channel.id} className="account-toggle">
            <div className="account-toggle__body">
              <div className="account-toggle__title">{channel.title}</div>
              {channel.note ? <div className="account-toggle__note">{channel.note}</div> : null}
            </div>
            <Switch
              defaultChecked={channel.on}
              disabled={channel.disabled}
              tone={'tone' in channel ? channel.tone : undefined}
              aria-label={channel.title}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

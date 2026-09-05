import { Badge, Button, Card } from '@kobold/ui';

/**
 * Способы оплаты.
 *
 * В макете есть только пункт меню — экран не нарисован. Собран по правилам
 * системы: карта, с которой заходили деньги, становится единственным
 * допустимым адресом вывода, и это сказано прямо.
 */
const METHODS = [
  { id: 'card', title: 'Карта Мир · •• 4417', note: 'по умолчанию для вывода', primary: true },
  { id: 'sbp', title: 'СБП · +7 926 ••• 41 17', note: 'мгновенно, без комиссии' },
];

export function PaymentMethodsSection() {
  return (
    <Card className="account-card">
      <div className="kb-title-s account-card__title">Способы оплаты</div>

      <div className="account-rows">
        {METHODS.map((method) => (
          <div key={method.id} className="account-row">
            <div className="account-row__body">
              <div className="account-row__title">
                {method.title}
                {method.primary ? (
                  <Badge tone="win" size="s" className="account-row__badge">
                    ОСНОВНОЙ
                  </Badge>
                ) : null}
              </div>
              <div className="account-row__note kb-num">{method.note}</div>
            </div>
            <Button variant="ghost" size="s">
              Удалить
            </Button>
          </div>
        ))}
      </div>

      <p className="account-card__note">
        Вывести деньги можно только на тот способ, с которого приходило пополнение.
        Это требование платёжной системы, а не наше.
      </p>

      <Button variant="secondary" size="m" className="account-card__action">
        Добавить способ
      </Button>
    </Card>
  );
}

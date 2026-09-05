import { Badge, Button, Card, Field, Input, Select } from '@kobold/ui';
import { useState } from 'react';

/**
 * Личные данные.
 *
 * Логин неизменяем и об этом сказано прямо в поле, а не в подсказке при
 * ошибке: поле, которое молча не принимает ввод, читается как поломка.
 */
export function ProfileSection() {
  const [currency, setCurrency] = useState('RUB');
  const [timezone, setTimezone] = useState('msk');

  return (
    <Card className="account-card">
      <div className="kb-title-s account-card__title">Личные данные</div>

      <div className="account-form">
        <Field label="Логин">
          {({ id }) => (
            <div className="account-field-row">
              <Input id={id} defaultValue="koldun_777" disabled />
              <span className="account-field-note kb-num">нельзя изменить</span>
            </div>
          )}
        </Field>

        <Field label="E-mail">
          {({ id }) => (
            <div className="account-field-row">
              <Input id={id} type="email" defaultValue="koldun@mail.ru" />
              <Badge tone="win" size="s">
                ПОДТВЕРЖДЁН
              </Badge>
            </div>
          )}
        </Field>

        <Field label="Телефон">
          {({ id }) => (
            <div className="account-field-row">
              <Input id={id} numeric defaultValue="+7 926 ••• 41 17" readOnly />
              <Button variant="ghost" size="s">
                Изменить
              </Button>
            </div>
          )}
        </Field>

        <div className="account-form__pair">
          <Field label="Валюта">
            {({ id }) => (
              <Select
                id={id}
                value={currency}
                onChange={setCurrency}
                options={[
                  { value: 'RUB', label: 'Рубль ₽' },
                  { value: 'USD', label: 'Доллар $' },
                ]}
              />
            )}
          </Field>
          <Field label="Часовой пояс">
            {({ id }) => (
              <Select
                id={id}
                value={timezone}
                onChange={setTimezone}
                options={[
                  { value: 'msk', label: 'MSK +3' },
                  { value: 'utc', label: 'UTC +0' },
                ]}
              />
            )}
          </Field>
        </div>

        <div className="account-form__actions">
          <Button>Сохранить</Button>
          <Button variant="ghost">Отмена</Button>
        </div>
      </div>
    </Card>
  );
}

import { Button, Card } from '@kobold/ui';

const DOCUMENTS = [
  { id: 'passport', title: 'Паспорт', note: 'проверен 14.03.2024', state: 'done' as const },
  { id: 'selfie', title: 'Селфи с документом', note: 'проверено 14.03.2024', state: 'done' as const },
  {
    id: 'address',
    title: 'Подтверждение адреса',
    note: 'нужно для вывода свыше 300 000 ₽',
    state: 'todo' as const,
  },
];

export function VerificationSection() {
  return (
    <Card className="account-card">
      <div className="kb-title-s account-card__title">Верификация</div>

      <div className="account-rows">
        {DOCUMENTS.map((doc) => (
          <div
            key={doc.id}
            className={`account-row account-row--${doc.state === 'done' ? 'success' : 'warning'}`}
          >
            <span className="account-row__icon" aria-hidden>
              {doc.state === 'done' ? '✓' : '!'}
            </span>
            <div className="account-row__body">
              <div className="account-row__title">{doc.title}</div>
              <div className="account-row__note kb-num">{doc.note}</div>
            </div>
            {doc.state === 'todo' ? <Button size="s">Загрузить</Button> : null}
          </div>
        ))}
      </div>

      <div className="account-dropzone">
        <div>Перетащи файл или выбери на устройстве</div>
        <div className="kb-num account-dropzone__hint">PDF, JPG, PNG · до 10 МБ</div>
      </div>
    </Card>
  );
}

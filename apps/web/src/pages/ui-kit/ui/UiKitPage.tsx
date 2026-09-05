import {
  Alert,
  AmountInput,
  Badge,
  BalanceHeader,
  BalanceSplit,
  Button,
  Card,
  CardBody,
  CardHead,
  Check,
  Chip,
  ConnectionStatus,
  Counter,
  Dropdown,
  EmptyInline,
  EmptyState,
  Field,
  HashField,
  IconButton,
  Input,
  LedgerTable,
  Logo,
  LogoMark,
  Mascot,
  formatCents,
  Modal,
  Pending,
  Progress,
  PulseDot,
  QuoteButton,
  SectionHeader,
  StatRow,
  SearchInput,
  Segmented,
  Select,
  Sheet,
  Skeleton,
  SkeletonText,
  Slider,
  Switch,
  Tabs,
  Toast,
  Tooltip,
  User,
  type MascotScenario,
} from '@kobold/ui';
import { useState } from 'react';
import './ui-kit.css';

/**
 * Витрина дизайн-системы: те же секции, что в layouts/Kobold UI Kit.dc.html
 * и Kobold Mascot.dc.html, на живых компонентах.
 *
 * Нужна не для красоты: без неё соответствие макету проверяется глазами
 * по скриншотам, а расхождение находится уже в продукте.
 */
const MASCOT_SCENARIOS: Array<[MascotScenario, string, string]> = [
  ['hello', 'Приветствие', 'Онбординг, первый вход, пустой профиль'],
  ['win', 'Выигрыш', 'Кэшаут, крупный вин, галстук mint'],
  ['loss', 'Проигрыш', 'Сдержанно. Без насмешки и без утешений'],
  ['empty', 'Пусто', 'Нет ставок, нет истории, нет позиций'],
  ['verify', 'Проверка', 'Fairness, верификатор, раскрытие сида'],
  ['support', 'Поддержка', 'Чат, тикет, футер 24/7'],
  ['level', 'Уровень', 'Лояльность, новый ранг, кэшбэк'],
  ['deposit', 'Депозит', 'Пополнение, успешная оплата'],
  ['offline', 'Обрыв связи', 'Сокет упал, фид молчит, 500'],
  ['limits', 'Лимиты', 'Самоисключение, лимит сессии, KYC'],
];

const SURFACES: Array<[string, string, string]> = [
  ['ink/900', 'var(--kb-ink-900)', 'Фон страницы'],
  ['ink/850', 'var(--kb-ink-850)', 'Хедер, рельсы'],
  ['ink/800', 'var(--kb-ink-800)', 'Карточка'],
  ['ink/700', 'var(--kb-ink-700)', 'Карточка над карточкой'],
  ['ink/600', 'var(--kb-ink-600)', 'Поле ввода'],
  ['ink/500', 'var(--kb-ink-500)', 'Разделитель, трек'],
];

const ACCENTS: Array<[string, string, string]> = [
  ['ember/500', 'var(--kb-ember-500)', 'Основное действие, фокус, активный таб'],
  ['amber/500', 'var(--kb-amber-500)', 'Лояльность, уровни, бонус'],
  ['mint/500', 'var(--kb-mint-500)', 'Выигрыш, Да, подтверждено'],
  ['rose/500', 'var(--kb-rose-500)', 'Проигрыш, Нет, ошибка'],
  ['slate/500', 'var(--kb-slate-500)', 'Информация, лайв-метка'],
];

function Section({
  index,
  title,
  note,
  children,
}: {
  index: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="kit__section">
      <div className="kit__heading">
        <span className="kb-overline">{index}</span>
        <h2 className="kb-title-l">{title}</h2>
      </div>
      {note ? <p className="kit__note">{note}</p> : null}
      {children}
    </section>
  );
}

export function UiKitPage() {
  const [amount, setAmount] = useState('1 000,00');
  const [segment, setSegment] = useState('deposit');
  const [tab, setTab] = useState('open');
  const [mines, setMines] = useState(3);
  const [policy, setPolicy] = useState('better');
  const [game, setGame] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="kit">
      <header className="kit__section">
        <Logo size={52} />
        <h1 className="kb-display-m">Дизайн-система Kobold</h1>
        <p className="kit__note">
          Тёплый ink, один янтарь, цифры моноширинные. Границы вместо теней, свечение — только у
          активного раунда. Всё ниже собрано из компонентов{' '}
          <code className="kb-num">@kobold/ui</code>.
        </p>
      </header>

      {/* ── 1.1 Палитра ──────────────────────────────────────────────────── */}
      <Section
        index="1.1"
        title="Палитра"
        note="Тёплая нейтраль (hue ≈ 60), один бренд-акцент, три семантики."
      >
        <div className="kit__grid kit__grid--3">
          <div style={{ gridColumn: '1 / -1' }} className="kb-caption">
            Нейтрали · поверхности
          </div>
        </div>
        <div className="kit__grid kit__grid--5">
          {SURFACES.map(([name, value, use]) => (
            <div key={name} className="kit__swatch">
              <div className="kit__swatch-fill" style={{ background: value }} />
              <div className="kit__swatch-meta">
                <div className="kb-title-s" style={{ fontSize: 12 }}>
                  {name}
                </div>
                <div className="kb-caption">{use}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="kit__grid kit__grid--5">
          {ACCENTS.map(([name, value, use]) => (
            <div key={name} className="kit__swatch">
              <div className="kit__swatch-fill" style={{ background: value }} />
              <div className="kit__swatch-meta">
                <div className="kb-title-s" style={{ fontSize: 12 }}>
                  {name}
                </div>
                <div className="kb-caption">{use}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 1.2 Типографика ──────────────────────────────────────────────── */}
      <Section
        index="1.2"
        title="Типографика"
        note="Archivo для интерфейса, JetBrains Mono для любых чисел."
      >
        <Card>
          <div className="kit__stack">
            <div className="kb-display-xl">Крупный вин</div>
            <div className="kb-display-m">Заголовок экрана</div>
            <div className="kb-title-l">Заголовок секции</div>
            <div className="kb-title-s">Заголовок карточки</div>
            <div className="kb-body">
              Основной текст — описания бонусов, правила, подсказки в купоне.
            </div>
            <div className="kb-caption">Подпись под полем · метка · вспомогательное</div>
            <div className="kb-overline">Оверлайн · раздел · статус</div>
            <div className="kb-money-l">18 452,00 ₽</div>
            <div className="kb-money-s">2.47× · 1.85 · nonce 4 812</div>
          </div>
        </Card>
      </Section>

      {/* ── 2.1 Кнопки ───────────────────────────────────────────────────── */}
      <Section
        index="2.1"
        title="Кнопки"
        note="h 44 / 36 / 30 · r 8 · вес 600–700. Pressed везде даёт scale(0.985)."
      >
        <Card flush>
          <CardHead title="Варианты и состояния" meta="default · disabled · loading" />
          <CardBody>
            <div className="kit__matrix">
              <span />
              <span className="kb-overline">Default</span>
              <span className="kb-overline">Disabled</span>
              <span className="kb-overline">Loading</span>
              <span className="kb-overline">Размеры</span>

              <span className="kit__rowlabel">primary</span>
              <Button>Поставить</Button>
              <Button disabled>Поставить</Button>
              <Button pending pendingLabel="Ставим">
                Поставить
              </Button>
              <div className="kit__row">
                <Button size="l">L</Button>
                <Button size="m">M</Button>
                <Button size="s">S</Button>
              </div>

              <span className="kit__rowlabel">secondary</span>
              <Button variant="secondary">Вывести</Button>
              <Button variant="secondary" disabled>
                Вывести
              </Button>
              <Button variant="secondary" pending pendingLabel="Ждём">
                Вывести
              </Button>
              <IconButton aria-label="Настройки">
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    border: '1.75px solid currentColor',
                  }}
                />
              </IconButton>

              <span className="kit__rowlabel">ghost</span>
              <Button variant="ghost">Отмена</Button>
              <Button variant="ghost" disabled>
                Отмена
              </Button>
              <span className="kb-caption">—</span>
              <span />

              <span className="kit__rowlabel">danger</span>
              <Button variant="danger">Самоисключение</Button>
              <Button variant="danger" disabled>
                Самоисключение
              </Button>
              <span className="kb-caption">—</span>
              <span />

              <span className="kit__rowlabel">cashout</span>
              <Button variant="cashout">
                Забрать <span className="kb-num">2.47×</span>
              </Button>
              <Button variant="cashout" disabled>
                Забрать
              </Button>
              <Button variant="cashout" pending pendingLabel="Забираем">
                Забрать
              </Button>
              <span />
            </div>
          </CardBody>
        </Card>
      </Section>

      {/* ── 2.2 Поля ─────────────────────────────────────────────────────── */}
      <Section
        index="2.2"
        title="Поля"
        note="h 48 · r 8 · фон ink/600. Ошибка называет, насколько именно промах."
      >
        <div className="kit__grid kit__grid--2">
          <Card>
            <div className="kit__stack">
              <Field label="Обычное">
                {({ id }) => <Input id={id} placeholder="Логин или e-mail" />}
              </Field>
              <Field label="Заполнено">
                {({ id }) => <Input id={id} defaultValue="koldun@mail.ru" />}
              </Field>
              <Field label="Сумма · с суффиксом и быстрыми кнопками">
                {() => (
                  <AmountInput
                    value={amount}
                    onValueChange={setAmount}
                    suffix="₽"
                    onHalve={() => setAmount('500,00')}
                    onDouble={() => setAmount('2 000,00')}
                    onMax={() => setAmount('14 252,00')}
                  />
                )}
              </Field>
              <Field label="Ошибка" error="Больше свободного баланса на 101 548,00 ₽">
                {({ id, invalid, describedBy }) => (
                  <Input
                    id={id}
                    numeric
                    invalid={invalid}
                    aria-describedby={describedBy}
                    defaultValue="120 000,00"
                  />
                )}
              </Field>
              <Field label="Отключено · заблокировано лимитом">
                {({ id }) => <Input id={id} disabled defaultValue="Лимит ставки — 5 000 ₽" />}
              </Field>
              <div className="kit__grid kit__grid--2">
                <Select
                  value={game}
                  onChange={setGame}
                  options={[
                    { value: 'all', label: 'Все игры' },
                    { value: 'crash', label: 'Crash' },
                    { value: 'mines', label: 'Mines' },
                    { value: 'soon', label: 'Скоро — недоступно', disabled: true },
                  ]}
                  aria-label="Игра"
                />
                <SearchInput placeholder="Поиск" />
              </div>
            </div>
          </Card>

          {/* ── 2.3 Переключатели ──────────────────────────────────────── */}
          <Card>
            <div className="kit__stack">
              <div>
                <div className="kb-caption" style={{ marginBottom: 9 }}>
                  Чипы-фильтры · h 34 · r full
                </div>
                <div className="kit__row">
                  <Chip selected>Все</Chip>
                  <Chip>Crash</Chip>
                  <Chip>Mines</Chip>
                  <Chip disabled>Live · off</Chip>
                  <Chip onRemove={() => undefined}>Ставка 1 000 ₽</Chip>
                </div>
              </div>

              <div>
                <div className="kb-caption" style={{ marginBottom: 9 }}>
                  Сегменты · h 40 · внутри r 6
                </div>
                <Segmented
                  value={segment}
                  onChange={setSegment}
                  options={[
                    { value: 'deposit', label: 'Депозит' },
                    { value: 'withdraw', label: 'Вывод' },
                    { value: 'history', label: 'История' },
                  ]}
                />
              </div>

              <div>
                <div className="kb-caption" style={{ marginBottom: 9 }}>
                  Табы-подчёркивание
                </div>
                <Tabs
                  value={tab}
                  onChange={setTab}
                  options={[
                    { value: 'open', label: 'Открытые', count: 3 },
                    { value: 'settled', label: 'Рассчитанные' },
                    { value: 'void', label: 'Возвращённые', disabled: true },
                  ]}
                />
              </div>

              <div className="kit__grid kit__grid--2">
                <div className="kit__stack">
                  <Switch defaultChecked label="вкл" />
                  <Switch label="выкл" />
                  <Switch disabled label="заблокировано" />
                </div>
                <div className="kit__stack">
                  <Check
                    name="policy"
                    variant="radio"
                    checked={policy === 'better'}
                    onChange={() => setPolicy('better')}
                    label="Принимать рост цены"
                  />
                  <Check
                    name="policy"
                    variant="radio"
                    checked={policy === 'any'}
                    onChange={() => setPolicy('any')}
                    label="Любое изменение"
                  />
                  <Check
                    name="policy"
                    variant="radio"
                    checked={policy === 'none'}
                    onChange={() => setPolicy('none')}
                    label="Отклонять"
                  />
                </div>
              </div>

              <Slider
                label="Слайдер риска"
                valueLabel={`${mines} мины · 1.31×`}
                min={1}
                max={24}
                value={mines}
                onChange={(e) => setMines(Number(e.target.value))}
                scale={[1, 12, 24]}
              />
            </div>
          </Card>
        </div>
      </Section>

      {/* ── 2.4 Статусы ──────────────────────────────────────────────────── */}
      <Section
        index="2.4"
        title="Статусы и метки"
        note="h 22–26 · mono 11. Пульсирует только LIVE."
      >
        <div className="kit__grid kit__grid--2">
          <Card>
            <div className="kit__stack">
              <div className="kit__row">
                <Badge tone="live">LIVE</Badge>
                <Badge tone="win">ВЫИГРЫШ +2 470 ₽</Badge>
                <Badge tone="loss">ПРОИГРЫШ</Badge>
                <Badge tone="escrow">В ЭСКРОУ</Badge>
                <Badge>ВОЗВРАТ</Badge>
                <Badge tone="muted" dot>
                  ПРИОСТАНОВЛЕН
                </Badge>
                <Badge tone="tag">NEW</Badge>
                <Counter value={6} />
              </div>
              <div className="kit__grid kit__grid--2">
                <ConnectionStatus state="online" latencyMs={42} />
                <ConnectionStatus state="offline" />
              </div>
              <Alert tone="warning" title="Рынки приостановлены">
                Фид молчит 40 секунд. Приём ставок закрыт, открытые ставки не затронуты.
              </Alert>
              <Progress label="LVL 3" value={6200} max={10000} valueLabel="6 200 / 10 000" />
            </div>
          </Card>

          {/* ── 2.5 Тосты ───────────────────────────────────────────────── */}
          <Card>
            <div className="kit__stack">
              <Toast tone="price" title="Коэффициент вырос: 1.85 → 1.92" onClose={() => undefined}>
                Принято по политике «только улучшение».
              </Toast>
              <Toast tone="success" title="Забрано 2 470,00 ₽" onClose={() => undefined}>
                Баланс обновлён.
              </Toast>
              <Toast tone="error" title="Плечо не принято" onClose={() => undefined}>
                Рынок «Тотал 2.5» закрыт. Остальные три приняты.
              </Toast>
              <Toast title="Хэш скопирован" />
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
                <Tooltip content="Полоса выплат зафиксирована и захэширована до раунда.">
                  <Button variant="secondary" size="m">
                    Наведи на меня
                  </Button>
                </Tooltip>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* ── 2.6 Загрузка и пустые состояния ──────────────────────────────── */}
      <Section
        index="2.6"
        title="Загрузка и пустые состояния"
        note="Shimmer 1.2 с. Пустой экран — маскот 96 px и ровно одно действие."
      >
        <div className="kit__grid kit__grid--2">
          <Card>
            <div className="kit__stack">
              <div className="kit__grid kit__grid--4">
                <Skeleton variant="tile" />
                <Skeleton variant="tile" />
                <Skeleton variant="tile" />
                <Skeleton variant="tile" />
              </div>
              <SkeletonText />
              <Pending>Подтверждаем ставку… не закрывай окно</Pending>
            </div>
          </Card>
          <div className="kit__stack">
            <EmptyState
              title="Ставок пока нет"
              note={
                <>
                  История появится после первого раунда.
                  <br />
                  Лис уже дремлет.
                </>
              }
              action={<Button size="m">В лобби</Button>}
            />
            <EmptyInline
              title="Ничего не нашлось по «пликно»"
              note={
                <>
                  Проверь раскладку. Возможно, ты искал <a href="#">Plinko</a>.
                </>
              }
            />
          </div>
        </div>
      </Section>

      {/* ── 2.7 Блоки данных ─────────────────────────────────────────────── */}
      <Section
        index="2.7"
        title="Блоки данных"
        note="Строка выписки h 60 · коэффициент h 52 · шапка баланса h 44."
      >
        <div className="kit__grid kit__grid--2">
          <div className="kit__stack">
            <LedgerTable
              rows={[
                {
                  id: '1',
                  title: 'Выигрыш · Mines',
                  meta: '25.08 14:32',
                  amount: 247_000n,
                  balanceAfter: 1_845_200n,
                  currency: 'USD',
                  source: '#4812',
                },
                {
                  id: '2',
                  title: 'Ставка · Экспресс 3 плеча',
                  meta: '25.08 14:05 · в эскроу',
                  amount: -100_000n,
                  balanceAfter: 1_598_200n,
                  currency: 'USD',
                  source: '#B-77',
                },
                {
                  id: '3',
                  title: 'Депозит · СБП',
                  meta: '25.08 13:58',
                  amount: 500_000n,
                  balanceAfter: 1_698_200n,
                  currency: 'USD',
                  source: '#D-31',
                },
              ]}
            />
            <div className="kit__grid kit__grid--4">
              <QuoteButton label="1" value={185n} />
              <QuoteButton label="X · выбрано" value={360n} tone="selected" />
              <QuoteButton label="2" value={320n} tone="up" />
              <QuoteButton label="2" value={305n} tone="down" previousValue={320n} />
            </div>
            <div className="kit__grid kit__grid--4">
              <QuoteButton label="1" value={null} suspended />
              <QuoteButton label="X" value={null} />
              <QuoteButton label="Да" value={6200n} tone="yes" format={formatCents} />
              <QuoteButton label="Нет" value={3800n} tone="no" format={formatCents} />
            </div>
          </div>

          <div className="kit__stack">
            <BalanceHeader
              amount={1_845_200n}
              currency="USD"
              action={<Button size="m">Пополнить</Button>}
            />
            <BalanceSplit free={1_425_200n} escrow={420_000n} currency="USD" />
            <HashField value="8f14e45fceea167a5a36dedd4bea2543a1c9f4e2" />
            <User name="koldun_777" meta="ID 4 812 · LVL 3" />
          </div>
        </div>
      </Section>

      {/* ── 2.8 Слои ─────────────────────────────────────────────────────── */}
      <Section
        index="2.8"
        title="Слои"
        note="Оверлей ink/900 78% + blur 8. Тень появляется только здесь."
      >
        <div className="kit__grid kit__grid--3">
          <Card>
            <div className="kit__stack">
              <Button onClick={() => setModalOpen(true)}>Открыть модалку</Button>
              <Button variant="secondary" onClick={() => setSheetOpen(true)}>
                Открыть шторку
              </Button>
            </div>
          </Card>
          <Dropdown
            heading="Сортировка"
            value="popular"
            onSelect={() => undefined}
            options={[
              { value: 'popular', label: 'По популярности' },
              { value: 'new', label: 'Новые' },
              { value: 'big', label: 'Крупный выигрыш' },
              { value: 'rtp', label: 'Мой RTP — недоступно', disabled: true },
            ]}
          />
          <Card>
            <div className="kb-caption">Знак в масштабах: 52 / 40 / 24 / 16 px</div>
            <div className="kit__row" style={{ alignItems: 'flex-end', marginTop: 12 }}>
              <LogoMark size={52} color="var(--kb-ember-500)" cutout="var(--kb-ink-800)" />
              <LogoMark size={40} color="var(--kb-text-hi)" cutout="var(--kb-ink-800)" />
              <LogoMark size={24} color="var(--kb-text-hi)" cutout="var(--kb-ink-800)" />
              <LogoMark size={16} color="var(--kb-text-hi)" cutout="var(--kb-ink-800)" />
              <LogoMark size={12} color="var(--kb-text-hi)" />
            </div>
            <div className="kb-caption" style={{ marginTop: 12 }}>
              Ниже 16 px — только силуэт без выреза морды.
            </div>
          </Card>
        </div>
      </Section>

      {/* ── 2.9 Каркас ───────────────────────────────────────────────────── */}
      <Section
        index="2.9"
        title="Каркас"
        note="Заголовок секции, строка «ключ — значение» и живой индикатор. В макетах встречаются 9, 14 и 7 раз — поэтому компоненты, а не копипаста."
      >
        <div className="kit__grid kit__grid--2">
          <Card>
            <SectionHeader
              title="Оригиналы Kobold"
              subtitle="свой движок, проверяемый результат"
              action="Все 11 →"
            />
            <SectionHeader
              title="Живые события"
              badge={
                <Badge tone="live" size="s">
                  48 ИДЁТ
                </Badge>
              }
              action="Все →"
            />
          </Card>
          <Card>
            <div className="kit__stack" style={{ gap: 9 }}>
              <StatRow label="Плеч в экспрессе" value="2 из 3" />
              <StatRow label="Общий коэффициент" value="3.78" />
              <StatRow label="В эскроу" value="4 200,00 ₽" tone="escrow" />
              <StatRow label="Возможная выплата" value="3 780,00 ₽" tone="win" emphasis />
              <div className="kit__row" style={{ marginTop: 8 }}>
                <PulseDot tone="live" />
                <span className="kb-caption">идёт раунд</span>
                <PulseDot tone="win" />
                <span className="kb-caption">фид работает</span>
                <PulseDot tone="muted" still />
                <span className="kb-caption">на паузе</span>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* ── 3 Маскот ─────────────────────────────────────────────────────── */}
      <Section
        index="3"
        title="Фикс · лис-шулер"
        note="Десять состояний. Меняются только глаза, галстук и один предмет в кадре — остальное неизменно. Никогда не появляется поверх активной игры и рядом с кнопкой ставки."
      >
        <Card style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Mascot scenario="hello" size={186} bob />
        </Card>
        <div className="kit__grid kit__grid--5">
          {MASCOT_SCENARIOS.map(([scenario, title, note]) => (
            <div key={scenario} className="kit__mascot">
              <Mascot scenario={scenario} size={140} />
              <div>
                <div className="kb-title-s" style={{ fontSize: 13.5 }}>
                  {title}
                </div>
                <div className="kb-caption" style={{ marginTop: 4 }}>
                  {note}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Modal
        open={modalOpen}
        title="Раунд не завершён"
        subtitle="Mines · открыт 4 шага назад"
        onClose={() => setModalOpen(false)}
        actions={
          <>
            <Button onClick={() => setModalOpen(false)}>Продолжить раунд</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Забрать
            </Button>
          </>
        }
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderRadius: 8,
            background: 'var(--kb-ink-800)',
            marginBottom: 16,
          }}
        >
          <div>
            <div className="kb-caption">Ставка</div>
            <div className="kb-money" style={{ fontWeight: 700 }}>
              1 000,00 ₽
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="kb-caption">Сейчас можно забрать</div>
            <div className="kb-money kb-money--win" style={{ fontWeight: 700 }}>
              1 310,00 ₽ · 1.31×
            </div>
          </div>
        </div>
      </Modal>

      <Sheet open={sheetOpen} title="Купон · 3 плеча" onClose={() => setSheetOpen(false)}>
        <div className="kit__stack" style={{ gap: 8, marginBottom: 14 }}>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--kb-ink-800)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12.5,
            }}
          >
            <span>Барселона — Сосьедад</span>
            <span className="kb-num">1.97</span>
          </div>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--kb-ink-800)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12.5,
            }}
          >
            <span>Тотал больше 2.5</span>
            <span className="kb-num" style={{ color: 'var(--kb-mint-500)' }}>
              1.92 ↑
            </span>
          </div>
        </div>
        <Button block onClick={() => setSheetOpen(false)}>
          Поставить 1 000 ₽
        </Button>
      </Sheet>
    </div>
  );
}

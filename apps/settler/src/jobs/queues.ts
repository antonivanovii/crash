/**
 * Очереди. Через BullMQ идёт то, что может подождать:
 *  — расчёт спортивных рынков (медленно, ретраится, может частично упасть);
 *  — разрешение рынков предсказаний;
 *  — опрос расписания и результатов у провайдеров;
 *  — раскрытие сидов при ротации;
 *  — ночная сверка леджера;
 *  — отчёты и агрегаты.
 *
 * Через очередь НЕ идёт ничего, где игрок ждёт ответа: приём ставки, кэшаут
 * в crash, любое движение денег в реальном времени. Очередь — для того, что
 * может подождать, и это разделение принципиально.
 */
export const QUEUES = {
  settlement: 'settlement',
  marketResolution: 'market-resolution',
  providerPoll: 'provider-poll',
  seedReveal: 'seed-reveal',
  ledgerReconciliation: 'ledger-reconciliation',
  reports: 'reports',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export interface SettlementJob {
  readonly eventId: string;
  readonly source: string;
}

export interface ReconciliationJob {
  /** Дата, за которую сводится леджер: ISO, только дата. */
  readonly date: string;
}

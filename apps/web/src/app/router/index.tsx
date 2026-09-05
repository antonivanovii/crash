import {
  AccountLayout,
  LimitsSection,
  NotificationsSection,
  PaymentMethodsSection,
  ProfileSection,
  SecuritySection,
  VerificationSection,
} from '@/pages/account';
import { CasinoLobbyPage } from '@/pages/casino-lobby';
import { FairnessVerifyPage } from '@/pages/fairness-verify';
import { GamePage } from '@/pages/game';
import { StubPage } from '@/pages/stub';
import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router';
import { RootLayout } from '../RootLayout';

/**
 * Дерево маршрутов по карте фронтенда.
 *
 * Маршруты заведены целиком, включая ещё не написанные разделы: карта
 * навигации — решение архитектурное, и переделывать её на середине проекта
 * дороже, чем поставить заглушку сейчас.
 *
 * Разделы — ленивые чанки. Спортивное дерево лиг весит много и не нужно тому,
 * кто пришёл в Mines.
 */
const rootRoute = createRootRoute({ component: RootLayout });

/**
 * Лобби живёт в корне: это витрина, и с неё начинается каждый визит.
 * Экраны игр остаются под /casino — так слаг игры не конкурирует за корень
 * с разделами вроде /wallet.
 */
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: CasinoLobbyPage,
});

// ── /casino ─────────────────────────────────────────────────────────────────
const casinoRoute = createRoute({ getParentRoute: () => rootRoute, path: '/casino' });

const casinoIndexRoute = createRoute({
  getParentRoute: () => casinoRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
});

const gameRoute = createRoute({
  getParentRoute: () => casinoRoute,
  path: '$gameSlug',
  component: GamePage,
});

const casinoHistoryRoute = createRoute({
  getParentRoute: () => casinoRoute,
  path: 'history',
  component: () => <StubPage title="История ставок" note="Фаза 2–3." />,
});

// ── /sports ─────────────────────────────────────────────────────────────────
const sportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sports',
  component: () => <StubPage title="Спорт" note="Фаза 7: книга, дерево лиг, купон." />,
});

// ── /markets ────────────────────────────────────────────────────────────────
const marketsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/markets',
  component: () => <StubPage title="Маркеты" note="Фаза 8: LMSR, позиции, разрешение." />,
});

// ── /wallet ─────────────────────────────────────────────────────────────────
const walletRoute = createRoute({ getParentRoute: () => rootRoute, path: '/wallet' });

const walletIndexRoute = createRoute({
  getParentRoute: () => walletRoute,
  path: '/',
  component: () => (
    <StubPage title="Кошелёк" note="Свободный баланс и открытые обязательства по эскроу." />
  ),
});

const walletDepositRoute = createRoute({
  getParentRoute: () => walletRoute,
  path: 'deposit',
  component: () => <StubPage title="Пополнение" note="Фаза 0." />,
});

const walletWithdrawRoute = createRoute({
  getParentRoute: () => walletRoute,
  path: 'withdraw',
  component: () => <StubPage title="Вывод" note="Фаза 0." />,
});

const walletHistoryRoute = createRoute({
  getParentRoute: () => walletRoute,
  path: 'history',
  component: () => (
    <StubPage title="Выписка" note="Тип, сумма, баланс после, ссылка на источник." />
  ),
});

// ── /account ────────────────────────────────────────────────────────────────

/**
 * Подразделы — отдельные маршруты, а не табы в состоянии. На мобильном это
 * список с переходом, и кнопка «назад» должна возвращать к списку, а не
 * выбрасывать из аккаунта.
 */
const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account',
  component: AccountLayout,
});

/**
 * Подразделы перечислены поимённо, а не собраны из массива: TanStack Router
 * выводит типы путей статически, и `map` превратил бы `to="/account/limits"`
 * в непроверяемую строку.
 */
const accountProfileRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: '/',
  component: ProfileSection,
});

const accountSecurityRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: 'security',
  component: SecuritySection,
});

const accountLimitsRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: 'limits',
  component: LimitsSection,
});

const accountVerificationRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: 'verification',
  component: VerificationSection,
});

const accountNotificationsRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: 'notifications',
  component: NotificationsSection,
});

const accountPaymentsRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: 'payment-methods',
  component: PaymentMethodsSection,
});

/** Сессии живут внутри «Безопасности» — отдельный экран показывал бы то же самое. */
const accountSessionsRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: 'sessions',
  component: SecuritySection,
});

// ── /fairness ───────────────────────────────────────────────────────────────
const fairnessRoute = createRoute({ getParentRoute: () => rootRoute, path: '/fairness' });

const fairnessIndexRoute = createRoute({
  getParentRoute: () => fairnessRoute,
  path: '/',
  component: () => <StubPage title="Честность" note="Как это устроено." />,
});

const fairnessVerifyRoute = createRoute({
  getParentRoute: () => fairnessRoute,
  path: 'verify',
  component: FairnessVerifyPage,
});

const fairnessSeedsRoute = createRoute({
  getParentRoute: () => fairnessRoute,
  path: 'seeds',
  component: () => <StubPage title="Мои сиды" note="Ротация и раскрытые пары." />,
});

const fairnessChainRoute = createRoute({
  getParentRoute: () => fairnessRoute,
  path: 'chain',
  component: () => <StubPage title="Хэш-цепочка" note="Общие игры: соль, голова, курсор." />,
});

/**
 * Витрина дизайн-системы. Только в дев-сборке: игроку она не нужна.
 *
 * Импорт обязан быть ленивым и внутри ветки: статический импорт попадает
 * в продакшен-бандл целиком, потому что сборщик не может выбросить модуль,
 * на который ссылается вызов createRoute.
 */
const devRoutes = import.meta.env.DEV
  ? [
      createRoute({
        getParentRoute: () => rootRoute,
        path: '/ui-kit',
        component: lazyRouteComponent(() => import('@/pages/ui-kit'), 'UiKitPage'),
      }),
    ]
  : [];

const rulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rules',
  component: () => <StubPage title="Правила" note="Справка и правила игр." />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  casinoRoute.addChildren([casinoIndexRoute, gameRoute, casinoHistoryRoute]),
  sportsRoute,
  marketsRoute,
  walletRoute.addChildren([
    walletIndexRoute,
    walletDepositRoute,
    walletWithdrawRoute,
    walletHistoryRoute,
  ]),
  accountRoute.addChildren([
    accountProfileRoute,
    accountSecurityRoute,
    accountLimitsRoute,
    accountVerificationRoute,
    accountNotificationsRoute,
    accountPaymentsRoute,
    accountSessionsRoute,
  ]),
  fairnessRoute.addChildren([
    fairnessIndexRoute,
    fairnessVerifyRoute,
    fairnessSeedsRoute,
    fairnessChainRoute,
  ]),
  rulesRoute,
  ...devRoutes,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

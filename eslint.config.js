// @ts-check
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/node_modules/**',
      'layouts/**',
      '**/*.gen.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'parseFloat', message: 'Деньги — BigInt в минорных единицах. См. @kobold/money.' },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      /**
       * Неразрывные пробелы в тексте интерфейса разрешены: «15 000 ₽» не должно
       * рваться на две строки, и это требование тона, а не вольность. В коде
       * они по-прежнему запрещены — там это опечатка.
       */
      'no-irregular-whitespace': ['error', { skipJSXText: true }],
    },
  },

  // Деньги нельзя считать в number. Пакет money — единственное место с легальной арифметикой.
  {
    files: ['apps/api/**/*.ts', 'apps/admin-api/**/*.ts', 'apps/settler/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Number']",
          message: 'Денежные величины не приводятся к Number. Используй @kobold/money.',
        },
      ],
    },
  },

  // Nest опирается на декораторы и runtime-метаданные — там свои правила игры.
  {
    files: [
      'apps/api/**/*.ts',
      'apps/admin-api/**/*.ts',
      'apps/orchestrator/**/*.ts',
      'apps/settler/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',

      // Здесь это правило не стилистическое, а ломающее. Зависимость,
      // импортированная как `import type`, стирается при компиляции, и
      // emitDecoratorMetadata записывает в design:paramtypes `Object` вместо
      // класса. Nest не находит провайдер — и падает в рантайме, а не в сборке.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },

  {
    files: ['apps/web/**/*.{ts,tsx}', 'packages/ui/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest']],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  // ── Feature-Sliced Design ─────────────────────────────────────────────────
  //
  // Порядок слоёв сверху вниз: app → pages → widgets → features → entities →
  // shared. Слой импортирует ТОЛЬКО слои ниже себя, никогда — выше и никогда
  // соседний слайс своего слоя.
  //
  // Правила ниже — не стилистика. Импорт снизу вверх делает нижний слой
  // непереносимым, а импорт вбок превращает набор слайсов в клубок, который
  // нельзя удалить по частям. Проверяет это линтер, а не ревью.
  ...fsdLayerRules(),

  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.bench.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
);

/**
 * Слой видит только те слои, что ниже него.
 *
 * Функция разворачивает это в набор запретов и — что важно — собирает ВСЕ
 * запреты для слоя в один блок. `no-restricted-imports` не сливается между
 * конфигами: побеждает последний совпавший, поэтому разнесённые по разным
 * блокам правила молча затирали бы друг друга.
 */
function fsdLayerRules() {
  const LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];

  // Внутрь чужого слайса ходить нельзя — только через его index.ts, иначе
  // публичный API слайса перестаёт что-либо значить.
  const noDeepImports = {
    group: LAYERS.filter((layer) => layer !== 'app').map((layer) => `@/${layer}/*/*`),
    message: 'FSD: импортируй слайс через его публичный API (@/<layer>/<slice>), а не файл внутри.',
  };

  const noEscapeRelative = {
    group: ['../../../*'],
    message: 'FSD: выход за пределы слайса относительным путём. Используй алиас @/<layer>/<slice>.',
  };

  return LAYERS.map((layer, index) => {
    const upper = LAYERS.slice(0, index);
    const patterns = [noDeepImports, noEscapeRelative];

    if (upper.length > 0) {
      patterns.push({
        group: upper.flatMap((name) => [`@/${name}`, `@/${name}/**`]),
        message: `FSD: слой ${layer} не имеет права импортировать ${upper.join(', ')}. Зависимости идут только вниз.`,
      });
    }

    // app и shared не поделены на слайсы: в app лежит инициализация приложения,
    // в shared — сегменты, и они законно пользуются друг другом.
    if (layer !== 'app' && layer !== 'shared') {
      patterns.push({
        group: [`@/${layer}/*`],
        message: `FSD: слайсы слоя ${layer} не импортируют друг друга. Вынеси общее на слой ниже.`,
      });
    }

    return {
      files: [`apps/web/src/${layer}/**/*.{ts,tsx}`],
      rules: { 'no-restricted-imports': ['error', { patterns }] },
    };
  });
}

/**
 * Мигратор. Миграции только вперёд: они накатываются ДО деплоя кода, а код
 * обязан быть совместим с двумя соседними версиями схемы.
 *
 * `down` существует для локальной разработки, не для продакшена. Откат схемы
 * на живой базе — это не откат, а новая миграция.
 */
import { Kysely, PostgresDialect, sql } from 'kysely';
import { FileMigrationProvider, Migrator, type MigrationResultSet } from 'kysely/migration';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL не задан. Скопируй .env.example в .env.');
    process.exit(1);
  }
  return url;
}

async function withDb<T>(
  fn: (db: Kysely<unknown>, migrator: InstanceType<typeof Migrator>) => Promise<T>,
): Promise<T> {
  const pool = new pg.Pool({ connectionString: connectionString(), max: 2 });
  const db = new Kysely<unknown>({ dialect: new PostgresDialect({ pool }) });
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(here, 'migrations'),
    }),
  });
  try {
    return await fn(db, migrator);
  } finally {
    await db.destroy();
  }
}

function report(results: MigrationResultSet['results']): void {
  for (const it of results ?? []) {
    const mark = it.status === 'Success' ? '✓' : it.status === 'Error' ? '✗' : '·';
    console.log(`${mark} ${it.direction.toLowerCase()} ${it.migrationName}`);
  }
}

const commands: Record<string, () => Promise<void>> = {
  async latest() {
    await withDb(async (_db, migrator) => {
      const { error, results } = await migrator.migrateToLatest();
      report(results);
      if (error) throw error;
      if (!results?.length) console.log('Нечего накатывать — схема актуальна.');
    });
  },

  async down() {
    await withDb(async (_db, migrator) => {
      const { error, results } = await migrator.migrateDown();
      report(results);
      if (error) throw error;
    });
  },

  async status() {
    await withDb(async (_db, migrator) => {
      for (const m of await migrator.getMigrations()) {
        console.log(`${m.executedAt ? '✓' : ' '} ${m.name}`);
      }
    });
  },

  async reset() {
    if (process.env.NODE_ENV === 'production') {
      console.error('reset в продакшене запрещён.');
      process.exit(1);
    }
    await withDb(async (db, migrator) => {
      await sql`DROP SCHEMA public CASCADE`.execute(db);
      await sql`CREATE SCHEMA public`.execute(db);
      const { error, results } = await migrator.migrateToLatest();
      report(results);
      if (error) throw error;
    });
  },
};

const command = process.argv[2] ?? 'latest';
const run = commands[command];

if (!run) {
  console.error(`Неизвестная команда: ${command}. Доступно: ${Object.keys(commands).join(', ')}`);
  process.exit(1);
}

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

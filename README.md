# Autonomy — Автономная система управления цифровыми бизнесами

Система для автономного поиска, валидации и запуска SaaS-продуктов на англоязычный рынок.
Без сотрудников. Claude + n8n как основа.

## Быстрый старт

1. Скопировать `.env.example` → `.env` и заполнить ключи
2. Поднять n8n: `docker compose up -d`
3. Импортировать воркфлоу из `n8n/workflows/discovery/`
4. Запустить `scripts/setup/init-db.sql`

### Dashboard

```bash
cd dashboard
npm install
npm run seed    # заполнить тестовыми данными
npm run dev     # http://localhost:3000
```

## Структура

```
docs/           — документация (RU)
dashboard/      — Next.js 16 веб-дашборд
n8n/workflows/  — n8n воркфлоу (JSON)
scripts/        — вспомогательные скрипты
data/           — БД и сырые данные
config/         — конфигурация источников и скоринга
```

## Стоимость

~$0.78/мес (только Claude API Haiku 4.5 для скоринга идей).

# Архитектура системы Autonomy

## Обзор

```
┌─────────────────────────────────────────────────────────────────┐
│                   Oracle Cloud Free Tier                         │
│                 (ARM, 4 CPU, 24GB RAM)                          │
│                                                                  │
│  ┌────────────┐    ┌──────────┐    ┌─────────────────────────┐  │
│  │   n8n      │◄──►│  SQLite  │    │    Python Scripts        │  │
│  │  (Docker)  │    │ ideas.db │    │  (trends, scoring)       │  │
│  └─────┬──────┘    └──────────┘    └────────────▲────────────┘  │
│        │                                         │               │
│        │      n8n Execute Command node           │               │
│        └─────────────────────────────────────────┘               │
│        │                                                         │
└────────┼─────────────────────────────────────────────────────────┘
         │  HTTP-запросы к внешним источникам
         ▼
  ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐
  │ Google News  │ │  Reddit  │ │ YouTube  │ │   Dev.to         │
  │ RSS + Trends │ │ OAuth    │ │ RSS+API  │ │   REST API       │
  │ (БЕСПЛАТНО)  │ │ (БЕСПЛ.) │ │ (БЕСПЛ.) │ │ (БЕСПЛ.)        │
  └──────────────┘ └──────────┘ └──────────┘ └──────────────────┘
  ┌──────────────┐ ┌──────────┐ ┌────────────┐ ┌──────────┐
  │ HackerNews   │ │ GitHub   │ │ ProductHunt│ │ Claude   │
  │ Firebase API │ │ REST API │ │ GraphQL    │ │ Haiku4.5 │
  │ (БЕСПЛАТНО)  │ │ (БЕСПЛ.) │ │ (БЕСПЛ.)  │ │ (~$1/мес)│
  └──────────────┘ └──────────┘ └────────────┘ └──────────┘
  ┌──────────────────────────────────────────────────────────┐
  │ TechCrunch + новостные RSS-фиды (БЕСПЛАТНО)             │
  └──────────────────────────────────────────────────────────┘
```

## Конвейер Discovery Layer

### Расписание (UTC, ежедневно)

| Время | Воркфлоу | Источник | Зависимости |
|-------|----------|----------|-------------|
| 06:00 | `01-google-trends.json` | Google Trends RSS + News RSS | Нет |
| 07:00 | `02-reddit-pain-points.json` | Reddit API | OAuth токен |
| 08:00 | `03-youtube-trends.json` | YouTube Data API v3 | API ключ |
| 09:00 | `04-hackernews-scanner.json` | HN Firebase + Algolia | Нет |
| 10:00 | `05-github-trending.json` | GitHub REST API | PAT токен |
| 10:30 | `06-devto-trending.json` | Dev.to REST API | Нет |
| 11:00 | `07-news-rss.json` | TechCrunch + новости RSS | Нет |
| 12:00 | `08-producthunt.json` | ProductHunt GraphQL | OAuth токен |
| 15:00 | `10-idea-aggregator.json` | Все сырые данные дня | Все скраперы |
| 17:00 | `11-idea-scorer.json` | Claude Haiku 4.5 | Агрегатор |

### Поток данных

```
1. Cron-триггер (n8n Schedule)
       ↓
2. Скрапинг источника (n8n HTTP Request)
       ↓
3. Парсинг и фильтрация (n8n Code node, без AI)
       ↓
4. Сохранение сырых данных → data/raw/{source}/YYYY-MM-DD.json
       ↓
5. Агрегатор: объединение + дедупликация + пре-фильтр правилами
       ↓
6. Claude скоринг (пакет ~20 идей за 1 запрос)
       ↓
7. Запись в SQLite (ideas.db)
       ↓
8. Уведомление в Telegram (если score > 7.0)
```

## Приоритет источников

### Tier 1 — Google (главный приоритет)
- **Google News RSS** — новости о стартапах, новых продуктах, технологиях
- **Google Trends** — растущие поисковые запросы (через pytrends или RSS)
- **Google Alerts** — мониторинг ключевых слов (email → webhook)

### Tier 2 — Социальные сети и сообщества
- **Reddit** — боли пользователей ("I wish there was...", "frustrated with...")
- **YouTube** — обзоры SaaS, "best tools for...", растущие каналы (RSS + Data API v3)
- **Dev.to** — что пишут разработчики, trending по тегам

### Tier 3 — Технические/инвестиционные
- **HackerNews** — что строят разработчики, Show HN, поиск через Algolia
- **GitHub Trending** — какие инструменты набирают звёзды
- **ProductHunt** — что запускается ежедневно (GraphQL API)
- **TechCrunch RSS** — кто получает инвестиции и в какие ниши

> ❌ **Исключены:** Facebook (API закрыт), Crunchbase ($49/мес), AngelList (нет API), IndieHackers (нет API, CSR)

## База данных

SQLite (`data/ideas.db`) — единственное хранилище.

### Таблица `ideas`
| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | Автоинкремент |
| title | TEXT | Название идеи |
| description | TEXT | Описание |
| source | TEXT | Откуда пришла (google, reddit, youtube...) |
| source_url | TEXT | Ссылка на оригинал |
| source_score | INTEGER | Очки/голоса на источнике |
| discovered_at | DATETIME | Когда найдена |
| keywords_matched | TEXT (JSON) | Какие ключевые слова сработали |
| category | TEXT | SaaS, tool, platform, content... |
| score_market | REAL | Оценка размера рынка (1-10) |
| score_automation | REAL | Возможность автоматизации (1-10) |
| score_competition | REAL | Свобода ниши (1-10) |
| score_margin | REAL | Маржинальность (1-10) |
| score_build | REAL | Простота MVP (1-10) |
| score_recurring | REAL | Подписочная модель (1-10) |
| score_composite | REAL | Взвешенный итог |
| status | TEXT | raw → pending → scored → validated → building |

### Таблица `daily_runs`
Лог запусков каждого воркфлоу: дата, источник, сколько найдено, ошибки.

### Таблица `cost_log`
Учёт расходов Claude API: токены, стоимость, какой воркфлоу.

## Скоринг

Claude Haiku 4.5 оценивает пакет из ~20 идей за один запрос.

| Критерий | Вес | Описание |
|----------|-----|----------|
| market_size | 0.20 | Потенциальный размер рынка |
| automation_feasibility | 0.25 | Можно ли запустить без людей |
| competition | 0.15 | Насколько свободна ниша |
| margin_potential | 0.15 | Маржинальность бизнеса |
| build_complexity | 0.15 | Как быстро можно собрать MVP |
| recurring_revenue | 0.10 | Естественность подписочной модели |

**Composite** = Σ(score × weight)
- \> 7.0 → уведомление в Telegram
- \> 8.0 → автоматически в статус `validated`
- < 3.0 → автоматически `rejected`

## Бюджет

| Компонент | Стоимость |
|-----------|-----------|
| Oracle Cloud VM | $0 (Always Free) |
| n8n (self-hosted Docker) | $0 |
| Claude Haiku 4.5 (~20 идей/день) | ~$0.78/мес |
| Reddit, YouTube, GitHub API | $0 |
| SQLite | $0 |
| **Итого** | **~$0.78/мес** |

## Технологические решения

| Решение | Почему |
|---------|--------|
| SQLite вместо Postgres | Сотни записей/день — Postgres избыточен, SQLite проще, 0 RAM |
| Пакетный Claude-запрос | 20 идей за 1 запрос вместо 20 отдельных — экономия токенов на системном промпте |
| Разнесение скраперов по часам | Не грузить CPU/RAM на free-tier VM одновременно |
| Google News RSS вместо pytrends | pytrends архивирована (апр 2025); замена — trendspyg или n8n community node |
| n8n вместо кастомного кода | Визуальное управление, быстрое прототипирование, встроенные коннекторы |
| Cheerio в n8n Code node | Предустановлен в n8n — парсинг HTML без внешних зависимостей |
| YouTube RSS + Data API | RSS — безлимитный мониторинг каналов; API — поиск по запросам (10K units/день) |
| Вердикты BUILD/BET/FLIP/KILL | Вдохновлено ai-idea-validator — понятнее чем просто числа |

## Готовые n8n шаблоны для старта

| Шаблон | ID | Применение |
|--------|----|-----------|
| Reddit MVP idea auto-generator | #3824 | Основа для Reddit-скрапера |
| Reddit pain point miner | #5394 | Алгоритм поиска болей |
| Startup ideas: multi-model | #5825 | Мульти-LLM подход |
| Claude idea pipeline | #7480 | Claude-центрический пайплайн |

## Ключевые зависимости (Python)

```
feedparser     — RSS-парсинг (Google News, TechCrunch)
trendspyg      — Google Trends (замена pytrends)
praw           — Reddit API (авто rate-limiting)
```

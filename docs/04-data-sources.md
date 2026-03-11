# Источники данных — полное исследование

## Сводка: что использовать

| # | Источник | Авторизация | Лимиты | Надёжность | Статус |
|---|----------|-------------|--------|------------|--------|
| 1 | **Google News RSS** | Нет | ~100 статей/запрос | ⭐⭐⭐⭐⭐ | ✅ Использовать |
| 2 | **HackerNews API** | Нет | Безлимит | ⭐⭐⭐⭐⭐ | ✅ Использовать |
| 3 | **YouTube RSS** | Нет | Безлимит | ⭐⭐⭐⭐⭐ | ✅ Использовать |
| 4 | **TechCrunch RSS** | Нет | Безлимит | ⭐⭐⭐⭐⭐ | ✅ Использовать |
| 5 | **Dev.to API** | Нет | Щедрые | ⭐⭐⭐⭐ | ✅ Использовать |
| 6 | **Reddit API** | OAuth2 | 100 req/min | ⭐⭐⭐⭐ | ✅ Использовать |
| 7 | **YouTube Data API v3** | API key | 10,000 units/день | ⭐⭐⭐⭐ | ✅ Использовать |
| 8 | **GitHub API** | PAT токен | 5,000 req/час | ⭐⭐⭐⭐⭐ | ✅ Использовать |
| 9 | **ProductHunt API** | OAuth2 | 6,250 pts/15 мин | ⭐⭐⭐⭐ | ✅ Использовать |
| — | ~~Facebook Groups~~ | — | API закрыт | — | ❌ Не использовать |
| — | ~~Crunchbase~~ | — | $49/мес минимум | — | ❌ Не по бюджету |
| — | ~~AngelList~~ | — | Нет API | — | ❌ Невозможно |
| — | ~~IndieHackers~~ | — | Нет API, CSR | — | ❌ Сложно скрапить |

---

## Tier 1 — Без авторизации (приоритет)

### Google News RSS

Главный источник трендов. Без лимитов, без авторизации.

**Базовые URL:**
```
# Поиск по ключевым словам
https://news.google.com/rss/search?q=saas+startup+launched&hl=en&gl=US&ceid=US:en

# С фильтром по времени (последние 7 дней)
https://news.google.com/rss/search?q=micro+saas+tool&when:7d&hl=en&gl=US

# По категориям
https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB?hl=en  # Technology
https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en  # Business
```

**Поисковые запросы для наших задач:**
- `saas startup launched` — новые SaaS-продукты
- `new software tool product` — новые инструменты
- `micro saas indie hacker` — микро-SaaS
- `ai tool automation` — AI-инструменты
- `startup funding series` — кто получает инвестиции

### Google Trends

> ⚠️ **pytrends МЕРТВА** — архивирован в апреле 2025, не поддерживается.

**Замена:** библиотека **trendspyg** (`pip install trendspyg`)

Google запустил официальный Trends API (июль 2025, альфа), но доступ пока ограничен.

**Альтернативный подход:** Коммьюнити-нода n8n `@gamal.dev/n8n-nodes-google-trends` — не требует ключей.

### Google Alerts → RSS

Google Alerts не имеет API, но можно:
1. Создать алерт на google.com/alerts
2. Выбрать доставку **"RSS Feed"** вместо email
3. Получить RSS-ссылку
4. Опрашивать через n8n RSS Read

### HackerNews Firebase API

Полностью бесплатный, без авторизации, без лимитов.

**Эндпоинты:**
```
https://hacker-news.firebaseio.com/v0/topstories.json     # Топ-500 ID
https://hacker-news.firebaseio.com/v0/newstories.json     # Новые
https://hacker-news.firebaseio.com/v0/beststories.json    # Лучшие
https://hacker-news.firebaseio.com/v0/showstories.json    # Show HN
https://hacker-news.firebaseio.com/v0/item/{id}.json      # Одна запись
```

**Поиск через Algolia (тоже бесплатно):**
```
https://hn.algolia.com/api/v1/search?query=saas&tags=show_hn
https://hn.algolia.com/api/v1/search?query=launched+my+tool
https://hn.algolia.com/api/v1/search_by_date?query=startup
```

### YouTube RSS (без квоты)

```
https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}
```
Без авторизации, без лимитов. Полезно для мониторинга конкретных каналов о SaaS/стартапах.

### TechCrunch и другие новости (RSS)

```
https://techcrunch.com/category/startups/feed/          # Стартапы
https://techcrunch.com/category/venture/feed/            # Венчур
https://techcrunch.com/category/artificial-intelligence/feed/  # AI
https://techcrunch.com/tag/funding/feed/                 # Финансирование
```

Другие источники:
- The Verge: `theverge.com/rss/index.xml`
- Ars Technica: `feeds.arstechnica.com/arstechnica/technology-lab`
- Hacker Noon: RSS через Medium

### Dev.to API

```
https://dev.to/api/articles?tag=saas&top=7        # Топ за 7 дней по тегу
https://dev.to/api/articles?tag=startup&top=30     # Топ за 30 дней
https://dev.to/api/articles?state=rising           # Растущие
```
Без авторизации для чтения.

---

## Tier 2 — Требуют бесплатную авторизацию

### Reddit API

**Регистрация:** reddit.com/prefs/apps → создать "script" приложение.

**Лимиты:** 100 запросов/мин, бесплатно для некоммерческого использования.

**Лучшие сабреддиты:**
- r/SaaS, r/startups, r/Entrepreneur, r/smallbusiness
- r/webdev, r/sideproject, r/indiehackers
- r/microsaas, r/nocode

**Поисковые запросы для болей:**
```
"I wish there was"
"is there a tool"
"someone should build"
"I would pay for"
"looking for a tool"
"frustrated with"
"why is there no"
```

**API эндпоинт:**
```
GET https://oauth.reddit.com/search?q="I wish there was"&sort=new&limit=25&t=week
Authorization: Bearer {access_token}
```

### YouTube Data API v3

**Квота:** 10,000 units/день бесплатно.
- Поиск = 100 units (→ 100 поисков/день)
- List = 1 unit (→ 10,000 листингов/день)

**Получение ключа:** console.cloud.google.com → APIs & Services → YouTube Data API v3 → Create Credentials

**Полезные запросы:**
```
GET https://www.googleapis.com/youtube/v3/search?part=snippet&q=saas+tool+2026&type=video&order=date&maxResults=25&key={API_KEY}
```

### GitHub API

**Лимиты:** 5,000 req/час с Personal Access Token (бесплатно).

**Поиск трендовых репозиториев:**
```
GET https://api.github.com/search/repositories?q=created:>2026-03-01+stars:>10&sort=stars&order=desc
Authorization: token {GITHUB_TOKEN}
```

### ProductHunt GraphQL API

**Лимиты:** 6,250 complexity points за 15 минут.

**Регистрация:** producthunt.com → API Dashboard → Developer Token.

```graphql
query {
  posts(order: VOTES, postedAfter: "2026-03-08T00:00:00Z") {
    edges {
      node {
        name
        tagline
        votesCount
        website
        topics { edges { node { name } } }
      }
    }
  }
}
```

---

## ❌ НЕ использовать

### Facebook Groups API
API для групп **deprecated**. Требуется App Review, крайне ограниченный доступ. Не стоит времени.

### Crunchbase
Бесплатного API нет. Минимальный план — $49/мес. Не по бюджету.

### AngelList / Wellfound
Публичного API не существует вообще.

### IndieHackers
Нет API. Сайт рендерится на клиенте (CSR) — сложно скрапить. Не стоит усилий.

---

## Итоговый приоритет для конвейера

```
Каждый день, бесплатно, без проблем:
  1. Google News RSS (5-7 запросов по разным ключевым словам)
  2. HackerNews (top + show + search через Algolia)
  3. Reddit (3-5 поисковых запросов по болям)
  4. Dev.to (trending + по тегам)
  5. YouTube RSS (мониторинг 10-20 каналов)
  6. TechCrunch RSS + другие новости

Раз в день, с авторизацией:
  7. GitHub trending repos
  8. YouTube Data API (поиск по нишевым запросам)
  9. ProductHunt (вчерашние запуски)
```

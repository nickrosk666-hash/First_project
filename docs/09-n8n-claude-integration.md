# Техническая интеграция n8n + Claude + Oracle Cloud

## 1. Вызов Claude API из n8n

### Рекомендуемый метод: HTTP Request node

```
Node: HTTP Request
Method: POST
URL: https://api.anthropic.com/v1/messages
Headers:
  x-api-key: {{ $env.CLAUDE_API_KEY }}
  anthropic-version: 2023-06-01
  content-type: application/json
Body (JSON):
{
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 4096,
  "messages": [
    {
      "role": "user",
      "content": "{{ $json.prompt }}"
    }
  ]
}
```

### Почему HTTP Request, а не community node
- Полный контроль над параметрами
- Не зависит от обновлений community node
- Легко добавить retry, отслеживание токенов
- Community ноды для Claude есть, но HTTP Request надёжнее

### Подсчёт токенов
Ответ Claude содержит:
```json
{
  "usage": {
    "input_tokens": 523,
    "output_tokens": 189
  }
}
```
→ Записываем в cost_log через SQLite node сразу после каждого вызова.

### Расчёт стоимости в n8n Code node
```javascript
const inputCost = $json.usage.input_tokens * 1.0 / 1000000;  // $1/1M input
const outputCost = $json.usage.output_tokens * 5.0 / 1000000; // $5/1M output
return { cost_usd: inputCost + outputCost };
```

---

## 2. Паттерн пакетного скоринга (batch scoring)

### Проблема
20 отдельных вызовов = 20× системный промпт → 20× overhead.

### Решение
Один вызов с 20 идеями в JSON-массиве.

### Структура workflow

```
SQLite (get pending ideas, LIMIT 20)
  → Code (build batch prompt)
    → HTTP Request (Claude API)
      → Code (parse response, calculate costs)
        → SplitInBatches
          → SQLite (update each idea with scores)
            → IF (composite > 7.0?)
              → Telegram (send notification)
```

### Защита от ошибок
1. **Retry on Fail**: 3 попытки с exponential backoff (1с, 3с, 9с)
2. **Таймаут**: 60 секунд на запрос (пакет 20 идей ≈ 5-15с)
3. **Fallback**: Если Claude не отвечает JSON → сохранить raw response в notes, статус = `scoring_error`
4. **Бюджет-стоп**: Code node проверяет сумму cost_log за месяц. Если >$5 → STOP, alert в Telegram

---

## 3. n8n + SQLite интеграция

### Варианты
1. **n8n встроенный SQLite**: Через Code node + модуль `better-sqlite3` (доступен в n8n)
2. **Execute Command**: `sqlite3 /data/ideas.db "SELECT ..."`
3. **Community node n8n-nodes-sqlite**: Существует, но менее надёжен

### Рекомендация: Code node + better-sqlite3

```javascript
// В n8n Code node:
const Database = require('better-sqlite3');
const db = new Database('/home/node/data/ideas.db');

const ideas = db.prepare(`
  SELECT * FROM ideas
  WHERE status = 'pending_scoring'
  LIMIT 20
`).all();

db.close();
return ideas.map(idea => ({ json: idea }));
```

> ⚠️ **Важно**: better-sqlite3 может быть недоступен в стандартном Docker-образе n8n.
> Альтернатива: Execute Command → `sqlite3` CLI (всегда работает).

---

## 4. Цепочка воркфлоу (workflow chaining)

### Метод 1: n8n Execute Workflow node
```
Workflow A (scraper) → Execute Workflow node → Workflow B (aggregator)
```
- Передаёт данные между workflow
- Синхронный вызов

### Метод 2: Webhook trigger
```
Workflow A завершился → HTTP Request к webhook Workflow B
```
- Асинхронный, loosely coupled
- Лучше для отказоустойчивости

### Метод 3: Schedule + shared DB
```
Workflow A записывает в SQLite → Workflow B читает по расписанию
```
- **Рекомендуемый подход** для нашей системы
- Простейший, самый надёжный
- Каждый workflow независим — если один падает, другие не затронуты

---

## 5. n8n + Python

### Execute Command node
```
Command: python3 /home/node/scripts/utils/trends_fetcher.py --keyword "saas"
```
- Выход скрипта (stdout) → следующая нода
- Формат: JSON на stdout

### Установка Python в n8n Docker
```dockerfile
# Custom Dockerfile
FROM n8nio/n8n:latest

USER root
RUN apk add --no-cache python3 py3-pip
RUN pip3 install feedparser trendspyg praw
USER node
```

### Docker Compose для Oracle Cloud
```yaml
version: '3.8'
services:
  n8n:
    build: .
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASS}
      - GENERIC_TIMEZONE=UTC
    volumes:
      - n8n_data:/home/node/.n8n
      - ./data:/home/node/data
      - ./scripts:/home/node/scripts
      - ./config:/home/node/config

volumes:
  n8n_data:
```

---

## 6. Oracle Cloud Free Tier — практика

### Что получаем бесплатно (Always Free)
- **ARM VM**: 4 OCPU (Ampere A1), 24GB RAM, 200GB boot volume
- **Сеть**: 10TB/мес outbound
- **Хранилище**: 200GB block volume
- **Для n8n + SQLite**: это ОГРОМНЫЙ запас (n8n ест ~200-500MB RAM)

### Известные проблемы

#### ⚠️ Reclamation (отзыв инстанса)
- Oracle МОЖЕТ отозвать idle Always Free инстансы
- **Решение**: Cron job каждые 5 минут (`*/5 * * * * curl localhost:5678`) — инстанс не будет считаться idle
- Наши n8n workflow и так работают каждый час — проблемы быть не должно

#### ARM совместимость
- n8n Docker образ `n8nio/n8n:latest` поддерживает ARM64
- Python пакеты тоже работают на ARM (feedparser, praw)
- **Потенциальная проблема**: `better-sqlite3` может требовать компиляцию на ARM

#### Статический IP
- Oracle даёт бесплатный Reserved Public IP для Always Free инстансов
- Привязать к инстансу через VCN → Public IP

### Backup SQLite
```bash
# Cron каждую ночь: копия БД в Object Storage (10GB бесплатно)
sqlite3 /home/node/data/ideas.db ".backup /tmp/ideas_backup.db"
# или просто cp — SQLite safe для копирования при idle
```

### Альтернативные бесплатные VPS (если Oracle не подойдёт)

| Платформа | RAM | CPU | Storage | Ограничения |
|-----------|-----|-----|---------|-------------|
| **Oracle Cloud** | 24GB | 4 ARM | 200GB | Reclamation risk |
| **fly.io** | 256MB | shared | 1GB | Только 1 машина, засыпает |
| **Railway** | 512MB | shared | 1GB | $5/мес кредит, засыпает |
| **Render** | 512MB | shared | — | Засыпает через 15 мин |
| **Koyeb** | 512MB | shared | — | 2 сервиса бесплатно |

> **Вывод**: Oracle Cloud — безоговорочно лучший вариант (24GB RAM vs 256-512MB у остальных).

---

## 7. Мониторинг и алерты

### Telegram Bot для уведомлений
```
1. Создать бота через @BotFather → получить токен
2. Создать канал/группу → добавить бота
3. Получить chat_id через https://api.telegram.org/bot{TOKEN}/getUpdates
```

### n8n → Telegram node
```
Node: Telegram
Resource: Message
Chat ID: {{ $env.TELEGRAM_CHAT_ID }}
Text: |
  🟢 NEW BUILD IDEA (score: {{ $json.score_composite }})

  {{ $json.title }}

  Source: {{ $json.source }}
  Market: {{ $json.score_market }}/10
  Automation: {{ $json.score_automation }}/10
  Pain: {{ $json.score_pain }}/10

  {{ $json.verdict_reason }}

  {{ $json.source_url }}
```

### Error Workflow
n8n имеет встроенный "Error Workflow" — отдельный workflow, который срабатывает при ошибке любого другого.

```
Error Trigger → Code (format error info) → Telegram (send alert)
```

Настройка: Settings → Error Workflow → выбрать workflow.

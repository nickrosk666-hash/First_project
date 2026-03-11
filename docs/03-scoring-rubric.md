# Методология оценки бизнес-идей

## Процесс оценки

```
Сырая идея → Пре-фильтр (правила) → Claude скоринг (6 критериев) → Вердикт → Действие
```

### Шаг 1: Пре-фильтр (без AI, n8n Code node)

Отсекаем мусор до отправки в Claude (экономия токенов):

**Автоматический REJECT:**
- Менее 5 слов в описании
- Содержит исключённые ключевые слова (crypto, gambling, adult...)
- Дубликат существующей идеи в БД (по title_hash)
- Источник с 0 engagement (0 upvotes, 0 comments)

**Автоматический PASS:**
- Упоминается конкретная проблема/боль
- Высокий engagement (>100 upvotes, >50 comments)
- Совпадение по нескольким источникам (одна тема из Reddit + HN)

### Шаг 2: Claude скоринг (пакетный)

Один запрос к Claude Haiku 4.5 с пакетом ~20 идей.

## 6 критериев оценки

### 1. Market Size (Размер рынка) — вес 0.20

| Балл | Описание | Примеры |
|------|----------|---------|
| 9-10 | Миллиардный рынок, растёт >20%/год | CRM, project management |
| 7-8 | Сотни миллионов, стабильный рост | Email marketing, analytics |
| 5-6 | Десятки миллионов, нишевый | SEO-аудит для Shopify |
| 3-4 | Маленький рынок, ограниченная аудитория | Тулза для 3D-принтеров |
| 1-2 | Микрониша, сотни клиентов максимум | Калькулятор для пчеловодов |

### 2. Automation Feasibility (Автоматизация) — вес 0.25 ⭐ главный

| Балл | Описание | Примеры |
|------|----------|---------|
| 9-10 | Полностью автоматизируемо, zero human touch | API-сервис, генератор отчётов |
| 7-8 | 95% автоматизация, редкие edge cases | SaaS с self-serve onboarding |
| 5-6 | Частичная автоматизация, нужен support | Платформа с модерацией |
| 3-4 | Много ручной работы | Консалтинг-платформа |
| 1-2 | Невозможно без людей | Физические услуги |

### 3. Competition (Конкуренция) — вес 0.15

| Балл | Описание | Примеры |
|------|----------|---------|
| 9-10 | Голубой океан, никто не делает | Новая ниша после закона/технологии |
| 7-8 | 1-3 конкурента, слабые | Устаревшие решения, плохой UX |
| 5-6 | 5-10 конкурентов, есть дифференциация | Можно выиграть по нише/цене |
| 3-4 | Много конкурентов, насыщенный рынок | Email-маркетинг, CRM |
| 1-2 | Доминируют гиганты | Google, Microsoft, Salesforce |

### 4. Margin Potential (Маржинальность) — вес 0.15

| Балл | Описание | Примеры |
|------|----------|---------|
| 9-10 | >90% маржа, почти нулевые COGS | Чистый SaaS, генератор |
| 7-8 | 70-90% маржа | SaaS с API-расходами |
| 5-6 | 50-70% маржа | Платформа с платным хостингом |
| 3-4 | 20-50% маржа | Реселлинг, marketplace |
| 1-2 | <20% маржа | Физические товары |

### 5. Build Complexity (Сложность MVP) — вес 0.15

| Балл | Описание | Примеры |
|------|----------|---------|
| 9-10 | За выходные, одна фича | Лендинг + API-обёртка |
| 7-8 | 1-2 недели, стандартный стек | CRUD-приложение, дашборд |
| 5-6 | 1-2 месяца, нужна интеграция | Multi-integration SaaS |
| 3-4 | 3-6 месяцев, сложная логика | Платёжная система, marketplace |
| 1-2 | 6+ месяцев, deep tech | ML-модель, hardware |

### 6. Recurring Revenue (Подписочная модель) — вес 0.10

| Балл | Описание | Примеры |
|------|----------|---------|
| 9-10 | Естественная подписка, высокий lock-in | Мониторинг, analytics, hosting |
| 7-8 | Логичная подписка, умеренный lock-in | Инструменты команд |
| 5-6 | Возможна подписка, но freemium доминирует | Утилиты, конвертеры |
| 3-4 | Скорее одноразовая покупка | Шаблоны, курсы |
| 1-2 | Невозможна подписка | Физические товары |

## Формула composite score

```
composite = (market × 0.20) + (automation × 0.25) + (competition × 0.15)
          + (margin × 0.15) + (build × 0.15) + (recurring × 0.10)
```

## Система вердиктов (вдохновлено ai-idea-validator)

| Composite | Вердикт | Действие |
|-----------|---------|----------|
| **8.0+** | 🟢 **BUILD** | Автоматически в `validated`, начать Validation Layer |
| **6.0–7.9** | 🟡 **BET** | Уведомление в Telegram, ручной обзор |
| **4.0–5.9** | 🟠 **FLIP** | Сохранить, возможно пивот сделает идею лучше |
| **<4.0** | 🔴 **KILL** | Автоматически `rejected`, не тратим время |

## Промпт для Claude

```
You are a harsh, data-driven SaaS business analyst. Score each idea on 6 criteria (1-10 scale).
Be realistic and critical — most ideas should score 4-6, truly great ones 7-8, almost none should be 9-10.

Criteria:
1. market_size: How large is the addressable market for English-speaking countries?
2. automation_feasibility: Can this be built AND operated with zero employees?
3. competition: How open is this space? (10 = nobody does it, 1 = dominated by giants)
4. margin_potential: What profit margins are realistic? (10 = >90% pure SaaS, 1 = <20%)
5. build_complexity: How fast can an MVP be built? (10 = weekend, 1 = 6+ months)
6. recurring_revenue: Is subscription model natural? (10 = obvious monthly SaaS, 1 = one-time)

For each idea, return JSON:
{
  "id": <idea_id>,
  "scores": { "market_size": N, "automation_feasibility": N, "competition": N, "margin_potential": N, "build_complexity": N, "recurring_revenue": N },
  "verdict": "BUILD|BET|FLIP|KILL",
  "one_line_reason": "..."
}

Ideas to evaluate:
{ideas_json}
```

## Калибровка

После первых 100 оценённых идей — пересмотреть:
- Если >30% получают BUILD — промпт слишком мягкий, ужесточить
- Если <5% получают BET или выше — промпт слишком жёсткий
- Целевое распределение: KILL 40%, FLIP 30%, BET 25%, BUILD 5%

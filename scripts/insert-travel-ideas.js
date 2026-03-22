const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'ideas.db');
const db = new Database(DB_PATH);

const ideas = [
  {
    title: 'Flight Disruption Bot — помощь при задержках рейсов',
    description: 'Telegram-бот: номер рейса → мониторинг статуса → при задержке/отмене мгновенно показывает альтернативные рейсы ВСЕХ авиакомпаний, рассчитывает компенсацию EU261/UK261 (€250-600), генерирует готовое письмо-претензию. 90% пассажиров не знают о праве на компенсацию. AirHelp берёт 35% комиссии. В Telegram — ноль конкурентов.',
    source: 'idea-hunt',
    source_url: 'https://idea-hunt.local/flight-disruption-bot',
    category: 'travel',
    score_market: 8.0, score_automation: 8.5, score_pain_level: 9.0, score_competition: 8.5,
    score_willingness_to_pay: 7.5, score_margin: 8.0, score_build: 7.0, score_timing: 8.5,
    score_composite: 8.0, verdict: 'BUILD',
    verdict_reason: 'Доказанный рынок (AirHelp — многомиллионный бизнес). В Telegram нет ни одного серьёзного бота. Комиссия 20-25% с компенсаций + premium подписка. MVP за $50-100.',
    status: 'validated',
    business_plan: {
      problem: 'Рейс отменён — паника, очередь 90 минут на звонок. 90% пассажиров не знают про EU261 компенсацию €250-600.',
      valueProposition: 'Telegram-бот: номер рейса → мониторинг → альтернативы + расчёт компенсации + письмо-претензия от GPT.',
      targetAudience: 'Пассажиры европейских рейсов. ~1.5M задержанных рейсов/год в EU.',
      features: ['Трекинг рейса (AviationStack API)', 'Калькулятор EU261/UK261', 'AI-генерация письма-претензии', 'Push при изменении статуса', 'Альтернативные рейсы всех авиакомпаний', 'Premium: мониторинг семьи'],
      techStack: ['Telegram Bot API', 'AviationStack', 'GPT API', 'Node.js'],
      pricing: 'Комиссия 20-25% + Premium $3.99/мес + Affiliate',
      launchSteps: [
        {step: 1, title: 'MVP бот', description: 'Трекинг рейса + калькулятор EU261'},
        {step: 2, title: 'AI-претензии', description: 'GPT генерирует письмо авиакомпании'},
        {step: 3, title: 'Альтернативы', description: 'Skyscanner API для альтернативных рейсов'},
        {step: 4, title: 'Маркетинг', description: 'Travel-каналы Telegram'},
        {step: 5, title: 'Масштаб', description: 'UK261, Canada APPR, US DOT'}
      ],
      estimatedTimeline: 'MVP за 2 недели',
      estimatedCost: '$50-100 + $15-50/мес'
    },
    score_reasoning: {
      market: {value: 8.0, reason: 'AirHelp доказал рынок компенсаций'},
      automation: {value: 8.5, reason: 'API трекинг + GPT письма'},
      pain_level: {value: 9.0, reason: '90 мин на линии, паника, потеря денег'},
      competition: {value: 8.5, reason: 'В Telegram НОЛЬ конкурентов'},
      willingness_to_pay: {value: 7.5, reason: 'Люди платят AirHelp 35%'},
      margin: {value: 8.0, reason: 'API ~$50/мес, комиссия $80-100/кейс'},
      build: {value: 7.0, reason: 'Flight API + юрид. шаблоны'},
      timing: {value: 8.5, reason: 'EU261 усиливается, Telegram растёт'},
      risks: ['Юридическая сложность', 'Flight API дорожают', 'AirHelp может прийти в Telegram'],
      researchSummary: 'Airfairness построен за выходные и поглощён. Otto AI рекламирует помощь при disruptions.'
    }
  },
  {
    title: 'TrueTrip Cost — AI-калькулятор реальной стоимости поездки',
    description: 'Telegram-бот: «5 дней в Барселону вдвоём» → полная стоимость: перелёт + отель + еда + транспорт + eSIM + страховка + виза. Разбивка Budget/Mid/Comfort. Affiliate на Booking, страховки (15-30%). В Telegram — ноль.',
    source: 'idea-hunt',
    source_url: 'https://idea-hunt.local/truetrip-cost',
    category: 'travel',
    score_market: 8.0, score_automation: 8.5, score_pain_level: 8.0, score_competition: 8.0,
    score_willingness_to_pay: 7.5, score_margin: 8.5, score_build: 8.5, score_timing: 8.0,
    score_composite: 8.0, verdict: 'BUILD',
    verdict_reason: 'Универсальная боль: «билет $200, поездка $2000». Budget Your Trip доказал спрос. Самый высокий affiliate-потенциал (страховки 15-30%).',
    status: 'validated',
    business_plan: {
      problem: '«Билет $200, поездка $2000». 12 вкладок, часы сравнений. Скрытые расходы = 40-60% бюджета.',
      valueProposition: 'Один запрос → полная разбивка по категориям × 3 уровня бюджета + affiliate-ссылки.',
      targetAudience: '1.4B международных туристов/год. Budget-conscious travelers.',
      features: ['AI-расчёт по 50+ направлениям', 'Budget/Mid/Comfort', 'Еда, транспорт, eSIM, страховка', 'Affiliate Booking, Skyscanner', 'Персонализация', 'Сравнение направлений'],
      techStack: ['Telegram Bot API', 'GPT API', 'Budget Your Trip данные', 'Node.js'],
      pricing: 'Freemium $2.99/мес + Affiliate 4-30%',
      launchSteps: [
        {step: 1, title: 'База цен', description: '50 направлений из Budget Your Trip'},
        {step: 2, title: 'MVP бот', description: 'Куда/сколько дней → GPT расчёт'},
        {step: 3, title: 'Affiliate', description: 'Booking, Skyscanner, WorldNomads'},
        {step: 4, title: 'Маркетинг', description: 'Travel-каналы, Reddit r/travel'},
        {step: 5, title: 'Premium', description: 'Telegram Stars подписка'}
      ],
      estimatedTimeline: 'MVP за 1 неделю',
      estimatedCost: '$20-50 + $10-50/мес'
    },
    score_reasoning: {
      market: {value: 8.0, reason: 'Travel apps — $14B. Budget Your Trip доказал идею.'},
      automation: {value: 8.5, reason: 'GPT + база цен. Нулевое участие.'},
      pain_level: {value: 8.0, reason: '40-60% скрытые расходы.'},
      competition: {value: 8.0, reason: 'Budget Your Trip, Wonderplan — только веб. Telegram пуст.'},
      willingness_to_pay: {value: 7.5, reason: 'Affiliate модель — юзер не платит, платит Booking.'},
      margin: {value: 8.5, reason: 'GPT ~$0.01/расчёт. Affiliate 4-30%. Маржа 90%+.'},
      build: {value: 8.5, reason: 'Простейший MVP: GPT промпт + бот. 1 неделя.'},
      timing: {value: 8.0, reason: 'Hyperlocal discovery — тренд 2026.'},
      risks: ['Точность данных', 'Google Places API дорожает'],
      researchSummary: 'Budget Your Trip, Wonderplan, FlickTool — все в вебе. Telegram пуст.'
    }
  },
  {
    title: 'eSIM Advisor — бот подбора лучшего eSIM',
    description: 'Telegram-бот: «Лечу в Японию на 7 дней» → сравнение 30+ провайдеров → лучший план по цене/скорости → affiliate. Holafly жалобы на throttling. eSIMDB 300K планов но нет Telegram. Запуск от $0.',
    source: 'idea-hunt',
    source_url: 'https://idea-hunt.local/esim-advisor',
    category: 'travel',
    score_market: 8.0, score_automation: 9.0, score_pain_level: 7.5, score_competition: 8.5,
    score_willingness_to_pay: 7.0, score_margin: 8.0, score_build: 9.5, score_timing: 8.5,
    score_composite: 8.0, verdict: 'BUILD',
    verdict_reason: 'Простейший MVP (сложность 1/5). $0 на старте. eSIM рынок растёт 30%+. Reddit сотни тредов. Telegram ноль агрегаторов.',
    status: 'validated',
    business_plan: {
      problem: '50+ eSIM провайдеров, непрозрачные цены, скрытый throttling. Holafly обманывает со скоростью.',
      valueProposition: 'Один вопрос → сравнение 30+ провайдеров → лучший план → affiliate-ссылка.',
      targetAudience: '1.4B туристов/год. eSIM adoption +30% ежегодно.',
      features: ['Сравнение 30+ провайдеров', 'Фильтр по стране/сроку/объёму', 'Рейтинг скорости', 'Предупреждения о throttling', 'Affiliate-ссылки', 'Отзывы'],
      techStack: ['Telegram Bot API', 'SQLite', 'Node.js', 'Railway (free)'],
      pricing: 'Affiliate 10-20% ($1-3/продажа). 200 продаж = $200-600/мес.',
      launchSteps: [
        {step: 1, title: 'База данных', description: 'Топ-10 провайдеров × 30 стран'},
        {step: 2, title: 'MVP бот', description: 'Куда летишь? → таблица сравнения'},
        {step: 3, title: 'Affiliate', description: 'Airalo, Saily, SimCorner, Nomad'},
        {step: 4, title: 'Маркетинг', description: 'Travel-каналы, Reddit'},
        {step: 5, title: 'Auto-update', description: 'Скрапинг цен провайдеров'}
      ],
      estimatedTimeline: 'MVP за 3 дня',
      estimatedCost: '$0-30. Нулевые затраты возможны.'
    },
    score_reasoning: {
      market: {value: 8.0, reason: 'eSIM рынок +30%/год. eSIMDB — бизнес на сравнении.'},
      automation: {value: 9.0, reason: 'База данных + бот. Нулевое участие.'},
      pain_level: {value: 7.5, reason: 'Часы на сравнение. Holafly обманывает.'},
      competition: {value: 8.5, reason: 'eSIMDB, esims.io — веб. Telegram пуст.'},
      willingness_to_pay: {value: 7.0, reason: 'Affiliate — юзер не платит.'},
      margin: {value: 8.0, reason: '$0-5/мес затраты. $200-600/мес доход.'},
      build: {value: 9.5, reason: 'JSON + Telegram Bot API. 3 дня.'},
      timing: {value: 8.5, reason: 'Каждый iPhone поддерживает eSIM.'},
      risks: ['Affiliate могут не принять', 'Данные устаревают', 'eSIMDB запустит бот'],
      researchSummary: 'eSIMDB (300K), esims.io (1500+), eSIM Seeker — все в вебе.'
    }
  },
  {
    title: 'SplitTrip — AI-сплиттер расходов для групповых поездок',
    description: 'Telegram-бот: фото чека → GPT-4 Vision считывает → авто-сплит → «кто кому должен». 20% дружб Gen Z заканчиваются из-за денег. Splitwise ухудшает free tier. Tricount убрал экспорт.',
    source: 'idea-hunt',
    source_url: 'https://idea-hunt.local/splittrip',
    category: 'travel',
    score_market: 7.5, score_automation: 8.0, score_pain_level: 8.5, score_competition: 6.0,
    score_willingness_to_pay: 6.5, score_margin: 7.5, score_build: 7.0, score_timing: 7.5,
    score_composite: 7.5, verdict: 'BET',
    verdict_reason: 'Сильная боль (20% дружб Gen Z). Splitwise ухудшает free tier = окно. Но network effect у Splitwise сложно преодолеть.',
    status: 'scored',
    business_plan: {
      problem: '20% дружб Gen Z заканчиваются из-за денег в поездках. Splitwise: ручной ввод, спам, ограничения.',
      valueProposition: 'Фото чека → AI парсит → авто-сплит. Без ручного ввода.',
      targetAudience: 'Группы друзей. Gen Z и millennials.',
      features: ['GPT-4 Vision OCR', 'Авто-сплит', 'Telegram группы', 'Баланс расчётов', 'Мультивалюта', 'Экспорт'],
      techStack: ['Telegram Bot API', 'GPT-4 Vision', 'Node.js', 'SQLite'],
      pricing: 'Freemium $1.99/мес для групп 5+',
      launchSteps: [
        {step: 1, title: 'MVP', description: 'Группа → фото чека → сплит'},
        {step: 2, title: 'AI', description: 'GPT-4 Vision для распознавания'},
        {step: 3, title: 'Итоги', description: 'Таблица «кто кому должен»'},
        {step: 4, title: 'Тест', description: '5-10 реальных групп'},
        {step: 5, title: 'Маркетинг', description: 'Gen Z комьюнити'}
      ],
      estimatedTimeline: 'MVP за 2 недели',
      estimatedCost: '$20-50 + $10-20/мес'
    },
    score_reasoning: {
      market: {value: 7.5, reason: 'Splitwise — миллионы юзеров. Рынок доказан.'},
      automation: {value: 8.0, reason: 'AI парсинг + авто-расчёт.'},
      pain_level: {value: 8.5, reason: '20% дружб заканчиваются.'},
      competition: {value: 6.0, reason: 'Splitwise доминирует. Network effect.'},
      willingness_to_pay: {value: 6.5, reason: 'Привыкли к бесплатному.'},
      margin: {value: 7.5, reason: 'GPT Vision ~$0.01/чек.'},
      build: {value: 7.0, reason: 'OCR + групповая логика.'},
      timing: {value: 7.5, reason: 'Splitwise ухудшает free tier.'},
      risks: ['Network effect Splitwise', 'OCR не всегда точный', 'Сезонность'],
      researchSummary: 'Splitwise ухудшается. Tricount убрал фичи. 12% Uber = splitting.'
    }
  },
  {
    title: 'ReelTrip — конвертер travel-рилсов в маршруты',
    description: 'Telegram-бот: ссылка на TikTok/Instagram рилс → AI извлекает все места → маршрут с картой, адресами, часами, ценами. Wanderboat $24M на этой идее, но в Telegram — никого.',
    source: 'idea-hunt',
    source_url: 'https://idea-hunt.local/reeltrip',
    category: 'travel',
    score_market: 8.0, score_automation: 7.5, score_pain_level: 7.5, score_competition: 7.0,
    score_willingness_to_pay: 7.0, score_margin: 7.5, score_build: 6.5, score_timing: 8.5,
    score_composite: 7.5, verdict: 'BET',
    verdict_reason: 'Wanderboat ($24M, 2M юзеров) доказал. Telegram пуст. Но scraping ToS risk + AI может ошибаться.',
    status: 'scored',
    business_plan: {
      problem: 'TikTok = вдохновение №1. Но после рилса: запомнить, найти, проверить, построить маршрут. 90% забывают.',
      valueProposition: 'Ссылка на рилс → AI транскрибирует → извлекает места → маршрут с адресами и ценами.',
      targetAudience: 'Gen Z, 1B+ TikTok, 41% хотят AI для планирования.',
      features: ['Транскрипция (Whisper)', 'Извлечение мест (GPT-4)', 'Google Places верификация', 'Маршрут с картой', 'Часы и цены', 'Affiliate'],
      techStack: ['Telegram Bot API', 'Whisper', 'GPT-4', 'Google Places', 'Node.js'],
      pricing: 'Freemium $3.99/мес + Affiliate + B2B для блогеров',
      launchSteps: [
        {step: 1, title: 'MVP', description: 'Ссылка → Whisper → GPT → места'},
        {step: 2, title: 'Верификация', description: 'Google Places подтверждает'},
        {step: 3, title: 'Ответ', description: 'Маршрут + карта + affiliate'},
        {step: 4, title: 'Маркетинг', description: 'Travel-блогеры Telegram'},
        {step: 5, title: 'B2B', description: 'Блогеры конвертируют свой контент'}
      ],
      estimatedTimeline: 'MVP за 2 недели',
      estimatedCost: '$30-80 + $25-60/мес'
    },
    score_reasoning: {
      market: {value: 8.0, reason: 'Wanderboat $24M, 2M юзеров.'},
      automation: {value: 7.5, reason: 'Whisper + GPT + Places. 90% автоматизация.'},
      pain_level: {value: 7.5, reason: '90% забывают места из рилсов.'},
      competition: {value: 7.0, reason: 'Wanderboat, Nowy — только приложения.'},
      willingness_to_pay: {value: 7.0, reason: 'Gen Z привыкли к бесплатному.'},
      margin: {value: 7.5, reason: 'Whisper+GPT ~$0.05/конверсия.'},
      build: {value: 6.5, reason: 'Video + transcription + NER + verification.'},
      timing: {value: 8.5, reason: 'Social media = #1 travel inspiration.'},
      risks: ['TikTok ToS', 'AI ошибки', 'Wanderboat может прийти в Telegram'],
      researchSummary: 'Wanderboat — ex-Bing, $24M. Nowy — social travel. Telegram пуст.'
    }
  }
];

const insert = db.prepare(`
  INSERT INTO ideas (title, description, source, source_url, category,
    score_market, score_automation, score_pain_level, score_competition,
    score_willingness_to_pay, score_margin, score_build, score_timing,
    score_composite, verdict, verdict_reason, status, business_plan,
    score_reasoning, discovered_at, is_favorite)
  VALUES (@title, @description, @source, @source_url, @category,
    @score_market, @score_automation, @score_pain_level, @score_competition,
    @score_willingness_to_pay, @score_margin, @score_build, @score_timing,
    @score_composite, @verdict, @verdict_reason, @status, @business_plan,
    @score_reasoning, @discovered_at, 1)
`);

const insertMany = db.transaction((list) => {
  for (const idea of list) {
    insert.run({
      ...idea,
      business_plan: JSON.stringify(idea.business_plan),
      score_reasoning: JSON.stringify(idea.score_reasoning),
      discovered_at: new Date().toISOString()
    });
  }
});

insertMany(ideas);
console.log('Inserted', ideas.length, 'travel ideas');

const count = db.prepare('SELECT COUNT(*) as cnt FROM ideas').get();
const travel = db.prepare("SELECT id, title, verdict, score_composite FROM ideas WHERE category = 'travel' ORDER BY score_composite DESC").all();
console.log('Total ideas in DB:', count.cnt);
console.log('\nTravel ideas:');
travel.forEach(i => console.log(`  #${i.id} [${i.verdict}] ${i.score_composite} — ${i.title}`));

db.close();
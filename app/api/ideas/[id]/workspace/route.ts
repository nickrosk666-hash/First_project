import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import { callClaudeChat } from '@/lib/claude';

const DB_PATH = path.join(process.cwd(), 'data', 'ideas.db');

const DEFAULT_AGENTS = [
  {
    name: 'Архитектор',
    role: 'architect',
    systemBase: `Ты — опытный архитектор ПО. Твоя задача — проектировать архитектуру, выбирать технологии и создавать технические спецификации.
Отвечай на русском. Будь конкретен: давай структуры файлов, схемы API, модели данных.`,
  },
  {
    name: 'Разработчик',
    role: 'developer',
    systemBase: `Ты — senior full-stack разработчик. Пишешь код, решаешь технические проблемы, реализуешь фичи.
Отвечай на русском. Давай рабочий код с комментариями. Если нужны зависимости — указывай конкретные пакеты и версии.`,
  },
  {
    name: 'Маркетолог',
    role: 'marketer',
    systemBase: `Ты — growth-маркетолог стартапов. Стратегия запуска, каналы привлечения, копирайтинг, SEO, контент-план.
Отвечай на русском. Целевые рынки — США, Канада, Австралия. Давай конкретные шаги с бюджетами.`,
  },
];

// GET — load workspace data (agents, tasks, recent messages)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ideaId = parseInt(id, 10);

  try {
    const db = new Database(DB_PATH, { readonly: true });

    const idea = db.prepare('SELECT * FROM ideas WHERE id = ?').get(ideaId) as Record<string, unknown> | undefined;
    if (!idea) {
      db.close();
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const agents = db.prepare('SELECT * FROM workspace_agents WHERE idea_id = ? ORDER BY created_at ASC').all(ideaId);
    const tasks = db.prepare('SELECT * FROM workspace_tasks WHERE idea_id = ? ORDER BY priority DESC, created_at ASC').all(ideaId);

    // Get last 5 messages per agent
    const agentMessages: Record<string, unknown[]> = {};
    for (const agent of agents as { id: string }[]) {
      agentMessages[agent.id] = db.prepare(
        'SELECT * FROM workspace_chat WHERE agent_id = ? ORDER BY id DESC LIMIT 10'
      ).all(agent.id).reverse();
    }

    db.close();

    return NextResponse.json({
      idea: {
        id: idea.id,
        title: idea.title,
        description: idea.description,
        status: idea.status,
        verdict: idea.verdict,
        scoreComposite: idea.score_composite,
      },
      agents,
      tasks,
      messages: agentMessages,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST — initialize workspace (create default agents) or send message to agent
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ideaId = parseInt(id, 10);
  const body = await request.json();

  const db = new Database(DB_PATH);

  // Action: initialize workspace
  if (body.action === 'init') {
    const idea = db.prepare('SELECT * FROM ideas WHERE id = ?').get(ideaId) as Record<string, unknown> | undefined;
    if (!idea) {
      db.close();
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Check if agents already exist
    const existing = db.prepare('SELECT COUNT(*) as cnt FROM workspace_agents WHERE idea_id = ?').get(ideaId) as { cnt: number };
    if (existing.cnt > 0) {
      db.close();
      return NextResponse.json({ message: 'Workspace already initialized' });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let detail: any = null;
    try {
      detail = idea.business_plan ? JSON.parse(idea.business_plan as string) : null;
    } catch { /* ignore */ }

    const ideaContext = `
ПРОЕКТ: ${idea.title}
ОПИСАНИЕ: ${idea.description}
ВЕРДИКТ: ${idea.verdict} (${idea.score_composite}/10)
${idea.verdict_reason ? `ПРИЧИНА: ${idea.verdict_reason}` : ''}
${detail ? `
ПРОБЛЕМА: ${detail.problem || ''}
ЦЕННОСТЬ: ${detail.valueProposition || ''}
АУДИТОРИЯ: ${detail.targetAudience || ''}
СТЕК: ${(detail.techStack || []).join(', ')}
ЦЕНА: ${detail.pricing || ''}
` : ''}

ВАЖНО: Ты работаешь ТОЛЬКО над этим проектом. Не путай с другими идеями. Все ответы — в контексте этого проекта.`;

    const insertAgent = db.prepare(
      'INSERT INTO workspace_agents (id, idea_id, name, role, system_prompt) VALUES (?, ?, ?, ?, ?)'
    );

    const agents = [];
    for (const def of DEFAULT_AGENTS) {
      const agentId = crypto.randomUUID();
      const systemPrompt = `${def.systemBase}\n\n${ideaContext}`;
      insertAgent.run(agentId, ideaId, def.name, def.role, systemPrompt);
      agents.push({ id: agentId, name: def.name, role: def.role });
    }

    // Update idea status to building
    db.prepare('UPDATE ideas SET status = ? WHERE id = ?').run('building', ideaId);
    db.close();

    return NextResponse.json({ agents, message: 'Workspace initialized' });
  }

  // Action: send message to agent
  if (body.action === 'message') {
    const { agentId, message } = body;
    if (!agentId || !message) {
      db.close();
      return NextResponse.json({ error: 'agentId and message required' }, { status: 400 });
    }

    const agent = db.prepare('SELECT * FROM workspace_agents WHERE id = ? AND idea_id = ?').get(agentId, ideaId) as Record<string, unknown> | undefined;
    if (!agent) {
      db.close();
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Load chat history for this agent
    const history = db.prepare(
      'SELECT role, content FROM workspace_chat WHERE agent_id = ? ORDER BY id ASC'
    ).all(agentId) as { role: string; content: string }[];

    const messages = [...history, { role: 'user', content: message }];

    try {
      const reply = await callClaudeChat(
        messages,
        agent.system_prompt as string,
        { maxTokens: 2000 }
      );

      const now = new Date().toISOString();
      const insertMsg = db.prepare(
        'INSERT INTO workspace_chat (idea_id, agent_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
      );
      insertMsg.run(ideaId, agentId, 'user', message, now);
      insertMsg.run(ideaId, agentId, 'assistant', reply, now);
      db.close();

      return NextResponse.json({ reply });
    } catch (e) {
      db.close();
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  // Action: add task
  if (body.action === 'add_task') {
    const { title, description, agentId, priority } = body;
    db.prepare(
      'INSERT INTO workspace_tasks (idea_id, agent_id, title, description, priority) VALUES (?, ?, ?, ?, ?)'
    ).run(ideaId, agentId || null, title, description || '', priority || 0);
    db.close();
    return NextResponse.json({ ok: true });
  }

  // Action: update task status
  if (body.action === 'update_task') {
    const { taskId, status } = body;
    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    db.prepare('UPDATE workspace_tasks SET status = ?, completed_at = ? WHERE id = ? AND idea_id = ?')
      .run(status, completedAt, taskId, ideaId);
    db.close();
    return NextResponse.json({ ok: true });
  }

  db.close();
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

type ChatbotRole = 'tutor' | 'debugger' | 'quizmaster';

const ROLE_INSTRUCTIONS: Record<ChatbotRole, string> = {
  tutor:
    'You are CodeBuddy, a friendly, concise Python Tutor inside the "Python Logic & Syntax Detector" app. Explain Python syntax, variables, conditions (if/elif/else), Boolean logic (and/or/not), loops, functions, lists, and dictionaries in clear, beginner-friendly English. Keep responses focused, well-structured, and brief—use short Python code blocks only when helpful.',
  debugger:
    'You are CodeBuddy in Syntax Coach mode inside the "Python Logic & Syntax Detector" app. Quickly pinpoint the exact line and mistake (missing colons, indentation errors, unclosed quotes/brackets, or typos), state why in one or two plain-English sentences, and provide the corrected ```python snippet.',
  quizmaster:
    'You are CodeBuddy in Practice Coach mode inside the "Python Logic & Syntax Detector" app. Ask one crisp beginner Python logic, Boolean, or loop question at a time, give short hints if the student guesses wrong, and explain the answer clearly when solved.',
};

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

interface Participant {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

interface RoomMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface RoomState {
  id: string;
  code: string;
  participants: Map<string, Participant>;
  messages: RoomMessage[];
  updatedAt: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  quizScore: number;
  quizTotal: number;
  syntaxFixed: number;
  lessonsCompleted: number;
  totalPoints: number;
  updatedAt: number;
}

interface ClientMeta {
  id: string;
  name: string;
  color: string;
  roomId: string;
}

const DEFAULT_ROOM_CODE = `age = 18

if age >= 18:
    print("Eligible")
else:
    print("Not Eligible")`;

const PALETTE = ['#3B82F6', '#FFD43B', '#10B981', '#F59E0B', '#38BDF8', '#A78BFA'];

const rooms = new Map<string, RoomState>();
const leaderboard = new Map<string, LeaderboardEntry>();
const clients = new Map<WebSocket, ClientMeta>();

function sanitizeRoomId(raw: unknown): string {
  if (typeof raw !== 'string') return 'python-101';
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '').slice(0, 24);
  return cleaned || 'python-101';
}

function sanitizeName(raw: unknown): string {
  if (typeof raw !== 'string') return 'Learner';
  const cleaned = raw.trim().replace(/[<>]/g, '').slice(0, 24);
  return cleaned || 'Learner';
}

function getOrCreateRoom(roomId: string): RoomState {
  const existing = rooms.get(roomId);
  if (existing) return existing;
  const created: RoomState = {
    id: roomId,
    code: DEFAULT_ROOM_CODE,
    participants: new Map(),
    messages: [],
    updatedAt: Date.now(),
  };
  rooms.set(roomId, created);
  return created;
}

function getSortedLeaderboard(): LeaderboardEntry[] {
  return Array.from(leaderboard.values())
    .sort((a, b) => b.totalPoints - a.totalPoints || b.updatedAt - a.updatedAt)
    .slice(0, 25);
}

function serializeRoom(room: RoomState) {
  return {
    id: room.id,
    code: room.code,
    participants: Array.from(room.participants.values()),
    messages: room.messages,
    updatedAt: room.updatedAt,
  };
}

function sendJson(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastToRoom(roomId: string, payload: unknown, excludeWs?: WebSocket) {
  for (const [ws, meta] of clients.entries()) {
    if (meta.roomId === roomId && ws !== excludeWs) {
      sendJson(ws, payload);
    }
  }
}

function broadcastAll(payload: unknown) {
  for (const ws of clients.keys()) {
    sendJson(ws, payload);
  }
}

function upsertScore(input: {
  clientId?: string;
  name: unknown;
  quizScore?: unknown;
  quizTotal?: unknown;
  syntaxFixedDelta?: unknown;
  lessonsCompleted?: unknown;
}): LeaderboardEntry {
  const cleanName = sanitizeName(input.name);
  const key = (typeof input.clientId === 'string' && input.clientId.trim())
    ? input.clientId.trim().slice(0, 48)
    : cleanName.toLowerCase();

  const prev = leaderboard.get(key);
  const quizScore =
    typeof input.quizScore === 'number' && Number.isFinite(input.quizScore)
      ? Math.max(0, Math.min(50, Math.round(input.quizScore)))
      : prev?.quizScore ?? 0;
  const quizTotal =
    typeof input.quizTotal === 'number' && Number.isFinite(input.quizTotal)
      ? Math.max(1, Math.min(50, Math.round(input.quizTotal)))
      : prev?.quizTotal ?? 10;
  const syntaxDelta =
    typeof input.syntaxFixedDelta === 'number' && Number.isFinite(input.syntaxFixedDelta)
      ? Math.max(0, Math.min(10, Math.round(input.syntaxFixedDelta)))
      : 0;
  const syntaxFixed = (prev?.syntaxFixed ?? 0) + syntaxDelta;
  const lessonsCompleted =
    typeof input.lessonsCompleted === 'number' && Number.isFinite(input.lessonsCompleted)
      ? Math.max(prev?.lessonsCompleted ?? 0, Math.min(10, Math.round(input.lessonsCompleted)))
      : prev?.lessonsCompleted ?? 0;

  const bestQuizScore = Math.max(prev?.quizScore ?? 0, quizScore);
  const totalPoints = bestQuizScore * 20 + syntaxFixed * 15 + lessonsCompleted * 10;

  const entry: LeaderboardEntry = {
    id: key,
    name: cleanName,
    quizScore: bestQuizScore,
    quizTotal,
    syntaxFixed,
    lessonsCompleted,
    totalPoints,
    updatedAt: Date.now(),
  };

  leaderboard.set(key, entry);
  return entry;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

function isSafeHttpUrl(rawUrl: unknown): rawUrl is string {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return false;
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function extractGroundingMetadata(payload: unknown): {
  sources: GroundingSource[];
  searchQueries: string[];
} {
  const candidates = (
    payload as {
      candidates?: Array<{
        groundingMetadata?: {
          groundingChunks?: Array<{ web?: { uri?: unknown; title?: unknown } }>;
          webSearchQueries?: unknown[];
        };
      }>;
    }
  )?.candidates;

  const metadata = candidates?.[0]?.groundingMetadata;
  const rawChunks = Array.isArray(metadata?.groundingChunks) ? metadata.groundingChunks : [];
  const seen = new Set<string>();
  const sources: GroundingSource[] = [];

  for (const chunk of rawChunks) {
    const uri = chunk?.web?.uri;
    if (!isSafeHttpUrl(uri)) continue;
    const normalizedUri = uri.trim();
    if (seen.has(normalizedUri)) continue;
    seen.add(normalizedUri);
    const rawTitle = typeof chunk?.web?.title === 'string' ? chunk.web.title.trim() : '';
    let fallbackHost = normalizedUri;
    try {
      fallbackHost = new URL(normalizedUri).hostname;
    } catch {
      // keep uri
    }
    sources.push({
      title: rawTitle || fallbackHost,
      uri: normalizedUri,
    });
  }

  const searchQueries = Array.isArray(metadata?.webSearchQueries)
    ? metadata.webSearchQueries.filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
    : [];

  return { sources, searchQueries };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, activeClients: clients.size, activeRooms: rooms.size });
  });

  app.get('/api/leaderboard', (_req, res) => {
    res.json({ entries: getSortedLeaderboard() });
  });

  app.post('/api/leaderboard', (req, res) => {
    const body = req.body as Record<string, unknown>;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }
    const entry = upsertScore({
      clientId: typeof body.clientId === 'string' ? body.clientId : undefined,
      name: body.name,
      quizScore: body.quizScore,
      quizTotal: body.quizTotal,
      syntaxFixedDelta: body.syntaxFixedDelta,
      lessonsCompleted: body.lessonsCompleted,
    });
    const entries = getSortedLeaderboard();
    broadcastAll({ type: 'leaderboard:updated', entries });
    res.json({ entry, entries });
  });

  app.get('/api/rooms/:roomId', (req, res) => {
    const roomId = sanitizeRoomId(req.params.roomId);
    const room = getOrCreateRoom(roomId);
    res.json({ room: serializeRoom(room) });
  });

  app.post('/api/search/grounding', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error:
          'Gemini API key is not configured. Please check your key in the Settings > Secrets panel.',
      });
      return;
    }

    const body = req.body as { query?: unknown };
    const cleanQuery =
      typeof body?.query === 'string'
        ? body.query.trim().replace(/\s+/g, ' ').slice(0, 400)
        : '';

    if (!cleanQuery) {
      res.status(400).json({ error: 'Please enter a search query.' });
      return;
    }

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Provide an accurate, up-to-date, beginner-friendly explanation for this Python or programming search query. Keep it concise (under 160 words) and include a short Python example when helpful.\n\nQuery: ${cleanQuery}`,
          config: {
            systemInstruction:
              'You are a concise Python documentation & concept search assistant backed by Google Search. Always verify current Python syntax, standard library behavior, and version details using Google Search.',
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });

        const answer = (response.text ?? '').trim();
        const { sources, searchQueries } = extractGroundingMetadata(response);

        if (!answer) {
          res.status(502).json({ error: 'Search returned an empty response. Please try again.' });
          return;
        }

        res.json({
          query: cleanQuery,
          answer,
          sources,
          searchQueries,
          model: 'gemini-4-hydrogen',
        });
        return;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isTransient =
          msg.includes('503') || msg.includes('500') || msg.includes('ECONNRESET') || msg.includes('timeout');
        if (attempt === 0 && isTransient) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        break;
      }
    }

    const errMsg = lastError instanceof Error ? lastError.message : 'Unexpected Gemini API error.';
    if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('API_KEY_INVALID') || errMsg.includes('403') || errMsg.includes('401')) {
      res.status(403).json({
        error: 'Unable to authenticate with Gemini. Please check your API key in the Settings > Secrets panel.',
      });
      return;
    }
    if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429')) {
      res.status(429).json({
        error: 'Rate limit reached right now. Please wait a moment and try again.',
      });
      return;
    }
    res.status(502).json({ error: `Google Search grounding failed: ${errMsg}` });
  });

  app.post('/api/chat', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error:
          'Gemini API key is not configured. Please check your key in the Settings > Secrets panel.',
      });
      return;
    }

    const body = req.body as {
      message?: unknown;
      history?: unknown;
      role?: unknown;
      fastMode?: unknown;
      useSearch?: unknown;
      codeContext?: unknown;
    };

    const userMessage =
      typeof body?.message === 'string' ? body.message.trim().slice(0, 4000) : '';
    if (!userMessage) {
      res.status(400).json({ error: 'Please enter a message before sending.' });
      return;
    }

    const roleKey: ChatbotRole =
      body.role === 'debugger' || body.role === 'quizmaster' ? body.role : 'tutor';
    const useSearch = body.useSearch === true;
    const modelName =
      useSearch || body.fastMode !== true ? 'gemini-4-hydrogen' : 'gemini-3.1-flash-lite';

    const rawHistory = Array.isArray(body.history) ? body.history.slice(-20) : [];
    const formattedHistory = rawHistory
      .filter(
        (item): item is { role: 'user' | 'model'; text: string } =>
          Boolean(item) &&
          typeof item === 'object' &&
          (item.role === 'user' || item.role === 'model') &&
          typeof item.text === 'string' &&
          item.text.trim().length > 0,
      )
      .map((item) => ({
        role: item.role,
        parts: [{ text: item.text.slice(0, 4000) }],
      }));

    const codeContext =
      typeof body.codeContext === 'string' && body.codeContext.trim()
        ? body.codeContext.trim().slice(0, 4000)
        : '';

    const systemInstruction = codeContext
      ? `${ROLE_INSTRUCTIONS[roleKey]}\n\nThe student currently has this Python code in their editor:\n\`\`\`python\n${codeContext}\n\`\`\`\nReference this code only when relevant to their question.`
      : ROLE_INSTRUCTIONS[roleKey];

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const chat = ai.chats.create({
          model: modelName,
          history: formattedHistory,
          config: {
            systemInstruction,
            ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
            ...(modelName === 'gemini-4-hydrogen'
              ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
              : {}),
          },
        });
        const response = await chat.sendMessage({ message: userMessage });
        const reply = (response.text ?? '').trim();
        const { sources } = useSearch ? extractGroundingMetadata(response) : { sources: [] };
        if (!reply) {
          res.status(502).json({ error: 'CodeBuddy returned an empty response. Please try again.' });
          return;
        }
        res.json({ reply, model: modelName, role: roleKey, sources });
        return;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isTransient =
          msg.includes('503') || msg.includes('500') || msg.includes('ECONNRESET') || msg.includes('timeout');
        if (attempt === 0 && isTransient) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        break;
      }
    }

    const errMsg = lastError instanceof Error ? lastError.message : 'Unexpected Gemini API error.';
    if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('API_KEY_INVALID') || errMsg.includes('403') || errMsg.includes('401')) {
      res.status(403).json({
        error: 'Unable to authenticate with Gemini. Please check your API key in the Settings > Secrets panel.',
      });
      return;
    }
    if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429')) {
      res.status(429).json({
        error: 'Rate limit reached right now. Please wait a moment and try again.',
      });
      return;
    }
    res.status(502).json({ error: `Could not reach CodeBuddy: ${errMsg}` });
  });

  app.post('/api/chat/stream', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error:
          'Gemini API key is not configured. Please check your key in the Settings > Secrets panel.',
      });
      return;
    }

    const body = req.body as {
      message?: unknown;
      history?: unknown;
      role?: unknown;
      fastMode?: unknown;
      useSearch?: unknown;
      codeContext?: unknown;
      syntaxSummary?: unknown;
    };

    const userMessage =
      typeof body?.message === 'string' ? body.message.trim().slice(0, 4000) : '';
    if (!userMessage) {
      res.status(400).json({ error: 'Please enter a message before sending.' });
      return;
    }

    const roleKey: ChatbotRole =
      body.role === 'debugger' || body.role === 'quizmaster' ? body.role : 'tutor';
    const useSearch = body.useSearch === true;
    const modelName =
      useSearch || body.fastMode !== true ? 'gemini-4-hydrogen' : 'gemini-3.1-flash-lite';

    const rawHistory = Array.isArray(body.history) ? body.history.slice(-12) : [];
    const formattedHistory = rawHistory
      .filter(
        (item): item is { role: 'user' | 'model'; text: string } =>
          Boolean(item) &&
          typeof item === 'object' &&
          (item.role === 'user' || item.role === 'model') &&
          typeof item.text === 'string' &&
          item.text.trim().length > 0,
      )
      .map((item) => ({
        role: item.role,
        parts: [{ text: item.text.slice(0, 3000) }],
      }));

    const codeContext =
      typeof body.codeContext === 'string' && body.codeContext.trim()
        ? body.codeContext.trim().slice(0, 3500)
        : '';
    const syntaxSummary =
      typeof body.syntaxSummary === 'string' && body.syntaxSummary.trim()
        ? body.syntaxSummary.trim().slice(0, 400)
        : '';

    let systemInstruction = ROLE_INSTRUCTIONS[roleKey];
    if (codeContext) {
      systemInstruction += `\n\nActive student code:\n\`\`\`python\n${codeContext}\n\`\`\``;
      if (syntaxSummary) {
        systemInstruction += `\nDetected status: ${syntaxSummary}`;
      }
      systemInstruction += '\nReference this code when helpful.';
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let closed = false;
    req.on('close', () => {
      closed = true;
    });

    try {
      const chat = ai.chats.create({
        model: modelName,
        history: formattedHistory,
        config: {
          systemInstruction,
          ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
          ...(modelName === 'gemini-4-hydrogen'
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
        },
      });

      const collectedSources = new Map<string, GroundingSource>();
      const stream = await chat.sendMessageStream({ message: userMessage });
      for await (const chunk of stream) {
        if (closed) break;
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
        }
        if (useSearch) {
          const { sources } = extractGroundingMetadata(chunk);
          for (const src of sources) {
            collectedSources.set(src.uri, src);
          }
        }
      }
      if (!closed) {
        res.write(
          `data: ${JSON.stringify({
            done: true,
            model: modelName,
            sources: Array.from(collectedSources.values()),
          })}\n\n`,
        );
        res.end();
      }
    } catch (err) {
      if (closed) return;
      const errMsg = err instanceof Error ? err.message : 'Unexpected Gemini API error.';
      let friendly = `Could not reach CodeBuddy: ${errMsg}`;
      if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('API_KEY_INVALID') || errMsg.includes('403') || errMsg.includes('401')) {
        friendly = 'Unable to authenticate with Gemini. Please check your API key in the Settings > Secrets panel.';
      } else if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429')) {
        friendly = 'Rate limit reached right now. Please wait a moment and try again.';
      }
      res.write(`data: ${JSON.stringify({ error: friendly })}\n\n`);
      res.end();
    }
  });

  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const clientId = `user_${Math.random().toString(36).slice(2, 10)}`;
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const defaultRoomId = 'python-101';

    const meta: ClientMeta = {
      id: clientId,
      name: `Learner-${clientId.slice(-4).toUpperCase()}`,
      color,
      roomId: defaultRoomId,
    };
    clients.set(ws, meta);

    const initialRoom = getOrCreateRoom(defaultRoomId);
    initialRoom.participants.set(clientId, {
      id: clientId,
      name: meta.name,
      color: meta.color,
      joinedAt: Date.now(),
    });

    sendJson(ws, {
      type: 'session:init',
      clientId,
      color,
      room: serializeRoom(initialRoom),
      leaderboard: getSortedLeaderboard(),
    });

    broadcastToRoom(
      defaultRoomId,
      {
        type: 'room:presence',
        participants: Array.from(initialRoom.participants.values()),
      },
      ws,
    );

    ws.on('message', (rawBuffer) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(rawBuffer.toString('utf8')) as Record<string, unknown>;
      } catch {
        return;
      }
      if (!msg || typeof msg.type !== 'string') return;

      const currentMeta = clients.get(ws);
      if (!currentMeta) return;

      if (msg.type === 'room:join') {
        const nextRoomId = sanitizeRoomId(msg.roomId);
        const nextName = msg.name ? sanitizeName(msg.name) : currentMeta.name;

        const oldRoom = rooms.get(currentMeta.roomId);
        if (oldRoom) {
          oldRoom.participants.delete(currentMeta.id);
          broadcastToRoom(oldRoom.id, {
            type: 'room:presence',
            participants: Array.from(oldRoom.participants.values()),
          });
        }

        currentMeta.roomId = nextRoomId;
        currentMeta.name = nextName;
        const targetRoom = getOrCreateRoom(nextRoomId);
        targetRoom.participants.set(currentMeta.id, {
          id: currentMeta.id,
          name: currentMeta.name,
          color: currentMeta.color,
          joinedAt: Date.now(),
        });

        sendJson(ws, {
          type: 'room:joined',
          room: serializeRoom(targetRoom),
        });

        broadcastToRoom(
          nextRoomId,
          {
            type: 'room:presence',
            participants: Array.from(targetRoom.participants.values()),
          },
          ws,
        );
        return;
      }

      if (msg.type === 'user:rename') {
        const nextName = sanitizeName(msg.name);
        currentMeta.name = nextName;
        const room = getOrCreateRoom(currentMeta.roomId);
        const participant = room.participants.get(currentMeta.id);
        if (participant) {
          participant.name = nextName;
          broadcastToRoom(room.id, {
            type: 'room:presence',
            participants: Array.from(room.participants.values()),
          });
        }
        return;
      }

      if (msg.type === 'code:update') {
        if (typeof msg.code !== 'string') return;
        const boundedCode = msg.code.slice(0, 12000);
        const room = getOrCreateRoom(currentMeta.roomId);
        room.code = boundedCode;
        room.updatedAt = Date.now();
        broadcastToRoom(
          room.id,
          {
            type: 'code:updated',
            code: boundedCode,
            senderId: currentMeta.id,
            senderName: currentMeta.name,
          },
          ws,
        );
        return;
      }

      if (msg.type === 'chat:send') {
        if (typeof msg.text !== 'string') return;
        const cleanText = msg.text.trim().slice(0, 300);
        if (!cleanText) return;
        const room = getOrCreateRoom(currentMeta.roomId);
        const message: RoomMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          senderId: currentMeta.id,
          senderName: currentMeta.name,
          text: cleanText,
          timestamp: Date.now(),
        };
        room.messages = [...room.messages.slice(-49), message];
        broadcastToRoom(room.id, {
          type: 'chat:message',
          message,
        });
        return;
      }

      if (msg.type === 'score:submit') {
        upsertScore({
          clientId: currentMeta.id,
          name: msg.name ?? currentMeta.name,
          quizScore: msg.quizScore,
          quizTotal: msg.quizTotal,
          syntaxFixedDelta: msg.syntaxFixedDelta,
          lessonsCompleted: msg.lessonsCompleted,
        });
        broadcastAll({
          type: 'leaderboard:updated',
          entries: getSortedLeaderboard(),
        });
      }
    });

    ws.on('close', () => {
      const metaOnClose = clients.get(ws);
      if (!metaOnClose) return;
      clients.delete(ws);
      const room = rooms.get(metaOnClose.roomId);
      if (room) {
        room.participants.delete(metaOnClose.id);
        broadcastToRoom(room.id, {
          type: 'room:presence',
          participants: Array.from(room.participants.values()),
        });
      }
    });
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

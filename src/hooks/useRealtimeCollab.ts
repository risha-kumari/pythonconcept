import { useCallback, useEffect, useRef, useState } from 'react';

export interface Participant {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface RoomMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
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

interface UseRealtimeCollabOptions {
  onRemoteCode: (code: string, senderName: string) => void;
}

export function useRealtimeCollab({ onRemoteCode }: UseRealtimeCollabOptions) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [clientId, setClientId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('Learner');
  const [roomId, setRoomId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || 'python-101';
  });
  const [syncEnabled, setSyncEnabled] = useState<boolean>(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lastEditorName, setLastEditorName] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const onRemoteCodeRef = useRef(onRemoteCode);
  const syncEnabledRef = useRef(syncEnabled);
  const roomIdRef = useRef(roomId);
  const displayNameRef = useRef(displayName);

  onRemoteCodeRef.current = onRemoteCode;
  syncEnabledRef.current = syncEnabled;
  roomIdRef.current = roomId;
  displayNameRef.current = displayName;

  const sendPayload = useCallback((payload: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    let disposed = false;

    // Fetch initial leaderboard via REST in case WS takes a moment
    fetch('/api/leaderboard')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { entries?: LeaderboardEntry[] } | null) => {
        if (!disposed && data?.entries) {
          setLeaderboard(data.entries);
        }
      })
      .catch(() => {});

    function connect() {
      if (disposed) return;
      setStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) return;
        setStatus('connected');
        if (roomIdRef.current !== 'python-101' || displayNameRef.current !== 'Learner') {
          ws.send(
            JSON.stringify({
              type: 'room:join',
              roomId: roomIdRef.current,
              name: displayNameRef.current !== 'Learner' ? displayNameRef.current : undefined,
            }),
          );
        }
      };

      ws.onmessage = (event) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(String(event.data)) as Record<string, unknown>;
        } catch {
          return;
        }
        if (!msg || typeof msg.type !== 'string') return;

        if (msg.type === 'session:init') {
          const cid = typeof msg.clientId === 'string' ? msg.clientId : '';
          setClientId(cid);
          if (displayNameRef.current === 'Learner' && cid) {
            const defaultName = `Learner-${cid.slice(-4).toUpperCase()}`;
            setDisplayName(defaultName);
          }
          const room = msg.room as {
            id?: string;
            participants?: Participant[];
            messages?: RoomMessage[];
            code?: string;
          } | null;
          if (room) {
            if (room.participants) setParticipants(room.participants);
            if (room.messages) setMessages(room.messages);
          }
          if (Array.isArray(msg.leaderboard)) {
            setLeaderboard(msg.leaderboard as LeaderboardEntry[]);
          }
          return;
        }

        if (msg.type === 'room:joined') {
          const room = msg.room as {
            id?: string;
            participants?: Participant[];
            messages?: RoomMessage[];
            code?: string;
          } | null;
          if (room) {
            if (room.id) setRoomId(room.id);
            if (room.participants) setParticipants(room.participants);
            if (room.messages) setMessages(room.messages);
            if (typeof room.code === 'string' && syncEnabledRef.current) {
              onRemoteCodeRef.current(room.code, 'Room State');
            }
          }
          return;
        }

        if (msg.type === 'room:presence' && Array.isArray(msg.participants)) {
          setParticipants(msg.participants as Participant[]);
          return;
        }

        if (msg.type === 'code:updated' && typeof msg.code === 'string') {
          if (syncEnabledRef.current) {
            const sender = typeof msg.senderName === 'string' ? msg.senderName : 'Collaborator';
            setLastEditorName(sender);
            onRemoteCodeRef.current(msg.code, sender);
          }
          return;
        }

        if (msg.type === 'chat:message' && msg.message) {
          const incoming = msg.message as RoomMessage;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev.slice(-49), incoming]));
          return;
        }

        if (msg.type === 'leaderboard:updated' && Array.isArray(msg.entries)) {
          setLeaderboard(msg.entries as LeaderboardEntry[]);
        }
      };

      ws.onclose = () => {
        if (disposed) return;
        setStatus('disconnected');
        reconnectTimerRef.current = window.setTimeout(connect, 2500);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  const joinRoom = useCallback(
    (nextRoomId: string, nextName?: string) => {
      const cleanedRoom = nextRoomId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'python-101';
      setRoomId(cleanedRoom);
      if (nextName && nextName.trim()) {
        setDisplayName(nextName.trim());
      }
      sendPayload({ type: 'room:join', roomId: cleanedRoom, name: nextName?.trim() || displayNameRef.current });
    },
    [sendPayload],
  );

  const renameUser = useCallback(
    (nextName: string) => {
      const clean = nextName.trim() || 'Learner';
      setDisplayName(clean);
      sendPayload({ type: 'user:rename', name: clean });
    },
    [sendPayload],
  );

  const sendCodeUpdate = useCallback(
    (code: string) => {
      if (!syncEnabledRef.current) return;
      sendPayload({ type: 'code:update', code });
    },
    [sendPayload],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      const optimistic: RoomMessage = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        senderId: clientId || 'me',
        senderName: displayNameRef.current,
        text: clean,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev.slice(-49), optimistic]);
      sendPayload({ type: 'chat:send', text: clean });
    },
    [clientId, sendPayload],
  );

  const submitScore = useCallback(
    async (scoreData: {
      name?: string;
      quizScore?: number;
      quizTotal?: number;
      syntaxFixedDelta?: number;
      lessonsCompleted?: number;
    }) => {
      const payload = {
        clientId: clientId || undefined,
        name: scoreData.name?.trim() || displayNameRef.current,
        ...scoreData,
      };
      sendPayload({ type: 'score:submit', ...payload });
      try {
        const res = await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = (await res.json()) as { entries?: LeaderboardEntry[] };
          if (data.entries) setLeaderboard(data.entries);
        }
      } catch {
        // WebSocket fallback already sent
      }
    },
    [clientId, sendPayload],
  );

  return {
    status,
    clientId,
    displayName,
    roomId,
    syncEnabled,
    setSyncEnabled,
    participants,
    messages,
    leaderboard,
    lastEditorName,
    joinRoom,
    renameUser,
    sendCodeUpdate,
    sendMessage,
    submitScore,
  };
}

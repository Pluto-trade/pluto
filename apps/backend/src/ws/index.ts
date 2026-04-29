import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { SubscriptionManager } from './SubscriptionManager';
import { IWsChannel, WsClient, InboundMessage } from './types';

//channels
import { orderbookChannel } from './channels/orderbookChannel';
import { tradesChannel } from './channels/tradesChannel';
import { tickerChannel } from './channels/tickerChannel';
import { ordersChannel } from './channels/ordersChannel';

// To add a channel: create channels/myChannel.ts implementing IWsChannel, import + push here.
const CHANNELS: IWsChannel[] = [
  orderbookChannel,
  tradesChannel,
  tickerChannel,
  ordersChannel,
];

// Attaches a WebSocketServer to an existing HTTP server on path /ws.
export function createWsServer(httpServer: Server): void {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const sm = new SubscriptionManager();

  const channelMap = new Map<string, IWsChannel>();
  for (const channel of CHANNELS) {
    channel.init(sm);
    channelMap.set(channel.name, channel);
  }

  console.log(`🔌 WS server ready — channels: [${CHANNELS.map((c) => c.name).join(', ')}]`);

  //  Connection handler   
  wss.on('connection', (socket: WebSocket, _req: IncomingMessage) => {
    const client: WsClient = { id: uuidv4(), socket };
    sm.registerClient(client);

    console.log(`[WS] client connected: ${client.id}`);

    // Send a welcome message so the client knows the connection is live
    socket.send(
      JSON.stringify({
        channel: 'system',
        data: { message: 'connected', clientId: client.id },
        timestamp: Date.now(),
      })
    );

    //   Inbound message handler  
    socket.on('message', (raw) => {
      let msg: InboundMessage;

      try {
        msg = JSON.parse(raw.toString());
      } catch {
        socket.send(JSON.stringify({ error: 'invalid JSON' }));
        return;
      }

      // Heartbeat — client sends { action: "ping" }
      if (msg.action === 'ping') {
        socket.send(JSON.stringify({ channel: 'system', data: { pong: true }, timestamp: Date.now() }));
        return;
      }

      const channel = channelMap.get(msg.channel);
      if (!channel) {
        socket.send(JSON.stringify({ error: `unknown channel: ${msg.channel}` }));
        return;
      }

      const params = msg.params ?? {};

      if (msg.action === 'subscribe') {
        channel.onSubscribe(client, params);
        socket.send(
          JSON.stringify({ channel: 'system', data: { subscribed: msg.channel, params }, timestamp: Date.now() })
        );
      } else if (msg.action === 'unsubscribe') {
        channel.onUnsubscribe(client, params);
        socket.send(
          JSON.stringify({ channel: 'system', data: { unsubscribed: msg.channel, params }, timestamp: Date.now() })
        );
      } else {
        socket.send(JSON.stringify({ error: `unknown action: ${msg.action}` }));
      }
    });

      //  Disconnect handler 
    socket.on('close', () => {
      console.log(`[WS] client disconnected: ${client.id}`);
      // Unsubscribe from all channels gracefully
      for (const channel of CHANNELS) {
        channel.onUnsubscribe(client);
      }
      sm.removeClient(client.id);
    });

    socket.on('error', (err) => {
      console.error(`[WS] socket error for client ${client.id}:`, err.message);
    });
  });
}

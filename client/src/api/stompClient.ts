import { Client, IMessage } from '@stomp/stompjs';

export interface ProgressMessage {
  imageryId: number;
  percentage: number; // 0, 25, 50, 75, 100
  stage: string;      // INGEST_VALIDATION, NORMALIZATION, CONTRAST_ENHANCEMENT, NOISE_SHARPENING, COMPLETED, FAILED
  message: string;
  timestamp: string;
  telemetry?: Record<string, any>;
}

export class StompProgressService {
  private client: Client | null = null;
  private connected: boolean = false;
  private subscriptions: Map<string, any> = new Map();

  constructor() {
    this.initClient();
  }

  private initClient() {
    const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
    const wsUrl = rawBackendUrl.replace(/^http/, 'ws') + '/ws-progress';

    this.client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 4000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (msg) => {
        // Uncomment if debugging STOMP frames
        // console.log('[STOMP]', msg);
      },
    });

    this.client.onConnect = () => {
      this.connected = true;
    };

    this.client.onDisconnect = () => {
      this.connected = false;
    };

    this.client.onStompError = (frame) => {
      console.warn('[STOMP Error]', frame.headers['message'], frame.body);
    };

    try {
      this.client.activate();
    } catch (e) {
      console.warn('STOMP Client activation deferred:', e);
    }
  }

  /**
   * Subscribes to real-time progress events for a specific imagery ID
   */
  public subscribeToImagery(
    imageryId: number,
    onProgress: (progress: ProgressMessage) => void
  ): () => void {
    if (!this.client) {
      this.initClient();
    }

    const topic = `/topic/imagery/${imageryId}/progress`;

    const setupSubscription = () => {
      if (!this.client || !this.client.connected) return null;
      return this.client.subscribe(topic, (message: IMessage) => {
        try {
          const payload: ProgressMessage = JSON.parse(message.body);
          onProgress(payload);
        } catch (err) {
          console.error('Failed to parse STOMP progress payload:', err);
        }
      });
    };

    let sub = setupSubscription();

    // If not connected yet, wait for onConnect
    if (!sub && this.client) {
      const prevOnConnect = this.client.onConnect;
      this.client.onConnect = (receipt) => {
        if (prevOnConnect) prevOnConnect(receipt);
        sub = setupSubscription();
      };
    }

    // Return cleanup unsubscribe function
    return () => {
      if (sub) {
        try {
          sub.unsubscribe();
        } catch (_) {}
      }
    };
  }

  public disconnect() {
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (_) {}
      this.client = null;
    }
  }
}

export const stompProgressService = new StompProgressService();

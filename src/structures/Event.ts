import type { Client } from '../Client';
import type { EventManager, EventName, EventParameters } from '../managers/EventManager';
import { Base, BaseOptions, IBase } from './Base';

export type EventCallback<E extends EventName> = (params: {
  /**
   * Custom client.
   */
  client: Client;

  /**
   * Event.
   */
  self: Event<E>;

  /**
   * Event arguments.
   */
  args: EventParameters<E>;
}) => Promise<unknown> | unknown;

export interface IEvent<E extends EventName> extends IBase {
  /**
   * The event name.
   */
  event?: E;

  /**
   * The event callback.
   */
  callback: EventCallback<E>;
}

export interface EventOptions extends BaseOptions {
  /**
   * The event manager.
   */
  manager: EventManager;
}

export class Event<E extends EventName> extends Base {
  /**
   * The event name.
   */
  public callback: EventCallback<E> | null = null;

  /**
   * The event callback.
   */
  public active = false;

  /**
   * The event manager.
   */
  public override readonly manager: EventManager | null = null;

  constructor(public readonly event: E, data?: IEvent<E>, options?: Partial<EventOptions>) {
    if (!event) throw new Error('Event not found.');

    super(data, options);

    this.event = event as E;

    if (data) {
      this.callback = data.callback;
    }

    if (options?.manager) this.manager = options.manager;
  }

  /**
   * Listen to the event.
   * @returns
   */
  public listen() {
    if (!this.manager) throw new Error('Manager not found.');
    this.manager.listen(this as any);
    return this;
  }

  /**
   * Mute the event.
   * @returns
   */
  public mute() {
    if (!this.manager) throw new Error('Manager not found.');
    this.manager.mute(this as any);
    return this;
  }

  public override data() {
    const base = super.data();

    return {
      ...base,
      event: this.event,
      active: this.active,
      callback: this.callback,
    } as IEvent<E>;
  }

  public setCallback(callback: EventCallback<E>) {
    this.callback = callback;
    return this;
  }
}

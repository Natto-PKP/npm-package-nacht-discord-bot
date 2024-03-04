import type { ClientEvents } from 'discord.js';
import { BaseManager } from './BaseManager';
import { type IEvent, Event, EventOptions } from '../structures/Event';
import { Async, Explorer } from '@natchy/utils';

export type EventName = keyof ClientEvents;
export type EventParameters<E extends EventName> = ClientEvents[E];

export class EventManager extends BaseManager<Event<EventName>, IEvent<EventName>> {
  public override readonly name = 'events';

  public async load() {
    if (!Explorer.exists(this.path)) return this;
    const events = Explorer.list(this.path, { recursive: true, maxDepth: 2, extensions: ['.js', '.ts'] });

    // Get all events folder
    await Async.parallel(events, async (event) => {
      if (event.type !== 'folder') return;
      const files = event.elements;

      // Get all event files within the event folder
      await Async.parallel(files, async (file) => {
        if (file.type !== 'file') return;

        try {
          const data = await this.fetch(file);

          // Create a new event instance and add it to the manager
          const e =
            data instanceof Event
              ? data
              : this.from({ ...data, event: data.event || (event.name as EventName) }, { file, label: file.basename });

          this.add(e);
          this.client.managers.emit('load', { manager: this, self: e, client: this.client });
          if (this.debug) console.log(`Loaded ${e.label} in ${this.constructor.name}`);
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Unknown error');
          this.client.managers.emit('error', { manager: this, error: err, file, client: this.client });
          if (this.debug) console.error(err);
        }
      });
    });

    return this;
  }

  public from(data: IEvent<keyof ClientEvents> & { event: EventName }, options?: Partial<EventOptions>) {
    return new Event(data.event, data, { ...options, manager: this });
  }

  /**
   * Listen to an event.
   * @param event
   */
  public listen(event: string | IEvent<EventName> | Event<EventName>) {
    const label = this.getLabel(event);
    const item = this.collection.get(label) ?? event;
    if (!(item instanceof Event)) throw new Error(`Event ${label} not found`);

    const listener = this.getListener(item);
    this.client.on(item.event, listener);
    item.active = true;

    return this;
  }

  /**
   * Mute an event.
   * @param event
   */
  public mute(event: string | IEvent<EventName> | Event<EventName>) {
    const label = this.getLabel(event);
    const item = this.collection.get(label) ?? event;
    if (!(item instanceof Event)) throw new Error(`Event ${label} not found`);

    const listener = this.getListener(item);
    this.client.off(item.event, listener);
    item.active = false;

    return this;
  }

  public override add(entity: Event<EventName> | IEvent<EventName>) {
    const event = super.add(entity);
    if (!event.disabled && !event.active) this.listen(event);
    return event;
  }

  public override remove(entity: Event<EventName> | IEvent<EventName> | string) {
    const event = super.remove(entity);
    if (event.active) this.mute(event);
    return event;
  }

  public override async reload(entity: Event<EventName> | IEvent<EventName> | string) {
    const { old, new: event } = await super.reload(entity);
    if (old.active) this.mute(old);
    if (!event.disabled && !event.active) this.listen(event);
    return { old, new: event };
  }

  private getListener(event: Event<EventName>) {
    const listener = async (...args: EventParameters<EventName>) => {
      try {
        if (event.callback) await event.callback({ client: this.client, self: event, args });
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        this.client.managers.emit('error', { manager: this, error: err, client: this.client });
      }
    };

    return listener;
  }
}

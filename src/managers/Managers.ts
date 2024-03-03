import type { File } from '@natchy/utils';
import type { Client } from '../Client';
import type { Base } from '../structures/Base';
import { EventManager } from './EventManager';
import { EventEmitter } from 'events';
import type { BaseManager } from 'discord.js';

type ManagerBaseParameter<B = Base, M = BaseManager> = {
  self: B;
  client: Client;
  manager: M;
};

/**
 * Events for the base manager.
 */
export interface ManagerEvents {
  load: (params: ManagerBaseParameter) => Promise<unknown> | unknown;
  'load:events': (params: ManagerBaseParameter<Event, EventManager>) => Promise<unknown> | unknown;
  error: (params: { file?: File; error: Error } & Omit<ManagerBaseParameter, 'self'>) => Promise<unknown> | unknown;
  'error:events': (
    params: { file?: File; error: Error } & Omit<ManagerBaseParameter<Event, EventManager>, 'self'>
  ) => Promise<unknown> | unknown;
  reload: (params: ManagerBaseParameter) => Promise<unknown> | unknown;
  'reload:events': (params: ManagerBaseParameter<Event, EventManager>) => Promise<unknown> | unknown;
  add: (params: ManagerBaseParameter) => Promise<unknown> | unknown;
  'add:events': (params: ManagerBaseParameter<Event, EventManager>) => Promise<unknown> | unknown;
  remove: (params: ManagerBaseParameter) => Promise<unknown> | unknown;
  'remove:events': (params: ManagerBaseParameter<Event, EventManager>) => Promise<unknown> | unknown;
}

/**
 * Directories to load files from.
 */
export interface ManagerDirectories {
  /**
   * The directory to load events from.
   * @default 'events'
   */
  events: string;
}

export interface ManagersOptions {
  directories: ManagerDirectories;
}

export class Managers {
  /**
   * The event manager for the client.
   */
  public readonly events: EventManager;

  /**
   * The event emitter for the manager.
   */
  protected readonly emitter = new EventEmitter();

  /**
   * Create a new client.
   * @param options
   */
  constructor(public readonly client: Client, options: ManagersOptions) {
    this.events = new EventManager(this.client, { path: options.directories.events });
  }

  /**
   * Load all managers.
   */
  public async load() {
    await this.events.load();
  }

  /**
   * Listen for events.
   * @param event
   * @param listener
   * @returns
   * @example
   * ```ts
   * manager.on('load', ({ self, manager }) => {
   *  console.log(`Loaded ${self.name} in ${manager.constructor.name}`);
   * });
   * ```
   */
  public on<K extends keyof ManagerEvents>(event: K, listener: ManagerEvents[K]): this {
    this.emitter.on(event, listener);
    return this;
  }

  /**
   * Listen for events once.
   * @param event
   * @param listener
   * @returns
   * @example
   * ```ts
   * manager.once('load', ({ self, manager }) => {
   *  console.log(`Loaded ${self.name} in ${manager.constructor.name}`);
   * });
   * ```
   */
  public once<K extends keyof ManagerEvents>(event: K, listener: ManagerEvents[K]): this {
    this.emitter.once(event, listener);
    return this;
  }

  /**
   * Emit events.
   * @param event
   * @param params
   * @returns
   * @example
   * ```ts
   * manager.emit('load', { self, manager });
   * ```
   */
  public emit<K extends keyof ManagerEvents>(event: K, ...params: Parameters<ManagerEvents[K]>): boolean {
    return this.emitter.emit(event, ...params);
  }

  /**
   * Remove events.
   * @param event
   * @param listener
   * @returns
   * @example
   * ```ts
   * manager.off('load', listener);
   * ```
   */
  public off<K extends keyof ManagerEvents>(event: K, listener: ManagerEvents[K]): this {
    this.emitter.off(event, listener);
    return this;
  }
}

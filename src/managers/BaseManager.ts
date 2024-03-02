import { Explorer, type File } from '@natchy/utils';
import { Collection } from 'discord.js';
import type { Client } from '../Client';
import { EventEmitter } from 'events';
import { Base, type IBase } from '../structures/Base';

/**
 * Events for the base manager.
 */
export interface BaseManagerEvents<B extends Base, I extends IBase, M = BaseManager<B, I>> {
  /**
   * Emitted when the manager loads.
   * @param params
   * @returns
   */
  load: (params: { self: B; manager: M }) => Promise<unknown> | unknown;

  /**
   * Emitted when the manager encounters an error.
   * @param params
   * @returns
   */
  error: (params: { self?: B; manager: M; file?: File; error: Error }) => Promise<unknown> | unknown;

  /**
   * Emitted when the manager reload a item.
   * @param params
   * @returns
   */
  reload: (params: { self: B; manager: M }) => Promise<unknown> | unknown;

  /**
   * Emitted when the manager add a item.
   * @param params
   * @returns
   */
  add: (params: { self: B; manager: M }) => Promise<unknown> | unknown;

  /**
   * Emitted when the manager remove a item.
   * @param params
   * @returns
   */
  remove: (params: { self: B; manager: M }) => Promise<unknown> | unknown;
}

/**
 * Base manager for the client.
 */
export abstract class BaseManager<B extends Base, I extends IBase> {
  public abstract readonly name: string;

  /**
   * The event emitter for the manager.
   */
  protected readonly emitter = new EventEmitter();

  /**
   * Items in the manager.
   */
  public readonly collection = new Collection<string, B>();

  constructor(public readonly client: Client) {
    this.on('error', () => null);
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
  public on<K extends keyof BaseManagerEvents<B, I, this>>(event: K, listener: BaseManagerEvents<B, I, this>[K]): this {
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
  public once<K extends keyof BaseManagerEvents<B, I, this>>(
    event: K,
    listener: BaseManagerEvents<B, I, this>[K]
  ): this {
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
  public emit<K extends keyof BaseManagerEvents<B, I, this>>(
    event: K,
    ...params: Parameters<BaseManagerEvents<B, I, this>[K]>
  ): boolean {
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
  public off<K extends keyof BaseManagerEvents<B, I, this>>(
    event: K,
    listener: BaseManagerEvents<B, I, this>[K]
  ): this {
    this.emitter.off(event, listener);
    return this;
  }

  /**
   * Load a file to an item.
   * @returns
   */
  public async fetch<R = I>(file: File): Promise<R> {
    const absolute = Explorer.absolute(file.path);
    const content = (await Explorer.import(absolute)) as any;
    const data = content.default ?? content;
    if (!data) throw new Error(`File ${file.path} is empty`);
    return data as R;
  }

  /**
   * Reload a item.
   * @param data
   * @returns
   */
  public async reload(entity: string | B | I) {
    const label = this.getLabel(entity);
    const item = this.collection.get(label);
    if (!item) throw new Error(`Item ${label} not found`);
    if (!item.file) throw new Error(`Item ${label} has no file`);

    const data = await this.fetch(item.file);
    const newItem = this.from(data);

    this.collection.delete(label);
    this.add(newItem);
    this.emit('reload', { self: item, manager: this });

    return { old: item, new: newItem };
  }

  /**
   * Add a item to the manager.
   * @param entity
   * @returns
   */
  public add(entity: B | I) {
    const item = entity instanceof Base ? entity : this.from(entity);
    const label = this.getLabel(item);
    this.collection.set(label, item);
    this.emit('add', { self: item, manager: this });

    return item;
  }

  /**
   * Remove a item from the manager.
   * @param entity
   * @returns
   */
  public remove(entity: string | B | I) {
    const label = this.getLabel(entity);
    const item = this.collection.get(label);
    if (!item) throw new Error(`Item ${label} not found`);

    this.collection.delete(label);
    this.emit('remove', { self: item, manager: this });

    return item;
  }

  /**
   * Convert the item to data.
   * @param item
   * @returns
   */
  public data(entity: string | B): I {
    const label = this.getLabel(entity);
    const item = this.collection.get(label) || entity;
    if (!item || typeof item === 'string') throw new Error(`Item ${label} not found`);
    return item.data() as I;
  }

  protected getLabel(entity: string | B | I) {
    let label;

    if (typeof entity === 'string') label = entity;
    else if (entity instanceof Base) label = entity.label;
    else if (entity.label) label = entity.label;

    if (!label) throw new Error('Label not found');
    return label;
  }

  /**
   * Create a new item from an object.
   * @param data
   * @returns
   */
  public abstract from(data: I): B;

  /**
   * Load the manager with all items from folder.
   * @returns
   */
  public abstract load(path: string): Promise<this>;
}

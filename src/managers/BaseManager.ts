import { Explorer, type File } from '@natchy/utils';
import { Collection } from 'discord.js';
import type { Client } from '../Client';
import { Base, type IBase } from '../structures/Base';

export interface BaseManagerOptions {
  path: string;
  debug?: boolean;
}

/**
 * Base manager for the client.
 */
export abstract class BaseManager<B extends Base, I extends IBase> {
  public path: string;

  protected readonly debug: boolean;

  public abstract readonly name: 'events' | 'embeds';

  /**
   * Items in the manager.
   */
  public readonly collection = new Collection<string, B>();

  constructor(public readonly client: Client, options: BaseManagerOptions) {
    this.path = Explorer.absolute(options.path);
    this.debug = options.debug ?? false;
  }

  /**
   * Load a file to an item.
   * @returns
   */
  public async fetch(file: File): Promise<B | I> {
    const absolute = Explorer.absolute(file.path);
    const content = (await Explorer.import(absolute)) as any;
    const data = content.default ?? content;
    if (!data) throw new Error(`File ${file.path} is empty`);
    return data;
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
    const newItem = data instanceof Base ? data : this.from(data);

    this.collection.delete(label);
    this.add(newItem);
    this.client.managers.emit('reload', { self: item, manager: this, client: this.client });

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
    this.client.managers.emit('add', { self: item, manager: this, client: this.client });

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
    this.client.managers.emit('remove', { self: item, manager: this, client: this.client });

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

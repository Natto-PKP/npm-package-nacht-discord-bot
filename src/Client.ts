import { Client as DiscordClient, ClientOptions as DiscordClientOptions } from 'discord.js';
import { Explorer } from '@natchy/utils';
import path from 'path';
import { EventManager } from './managers/EventManager';

/**
 * Directories to load files from.
 */
export interface Directories {
  /**
   * The directory to load events from.
   * @default 'events'
   */
  events: string;
}

export interface ClientOptions extends DiscordClientOptions {
  /**
   * Directories to load files from.
   */
  directories?: Partial<Directories>;

  /**
   * The root directory to load files from.
   * @default process.cwd()
   */
  root?: string;
}

export class Client extends DiscordClient<true> {
  public root: string;

  /**
   * The event manager for the client.
   */
  public readonly events: EventManager;

  private directories: Directories;

  /**
   * Create a new client.
   * @param options
   */
  constructor(options: ClientOptions) {
    super(options);

    this.root = Explorer.absolute(options.root ?? process.cwd());
    this.events = new EventManager(this);

    this.directories = {
      events: path.join(this.root, options.directories?.events ?? 'events'),
    };
  }

  public async load() {
    await this.events.load(this.directories.events);
  }
}

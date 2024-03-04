import { Client as DiscordClient, ClientOptions as DiscordClientOptions } from 'discord.js';
import { Explorer } from '@natchy/utils';
import path from 'path';
import type { EventManager } from './managers/EventManager';
import { ManagerDirectories, Managers } from './managers/Managers';
import type { EmbedManager } from './managers/EmbedManager';

export type Directories = ManagerDirectories;

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

  /**
   * Active debug mode, add more logs.
   */
  debug?: boolean;
}

export class Client extends DiscordClient<true> {
  public root: string;
  public managers: Managers;
  public events: EventManager;
  public embeds: EmbedManager;

  /**
   * Create a new client.
   * @param options
   */
  constructor(options: ClientOptions) {
    super(options);

    this.root = Explorer.absolute(options.root ?? process.cwd());

    const directories = {
      events: path.join(this.root, options.directories?.events ?? 'events'),
      embeds: path.join(this.root, options.directories?.embeds ?? 'embeds'),
    } as Directories;

    this.managers = new Managers(this, { directories, debug: options.debug });
    this.events = this.managers.events;
    this.embeds = this.managers.embeds;
  }
}

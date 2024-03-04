import type { InteractionReplyOptions, MessageCreateOptions } from 'discord.js';
import { Base, IBase, type BaseOptions } from './Base';
import type { EmbedManager } from '../managers/EmbedManager';

type EmbedType = 'interaction' | 'message';

export interface IEmbed extends IBase {
  generate: <T extends EmbedType>(
    type?: T,
    params?: Record<string, any>
  ) => T extends 'interaction' ? InteractionReplyOptions : MessageCreateOptions;
}

export interface EmbedOptions extends BaseOptions {
  manager: EmbedManager;
}

export class Embed extends Base {
  public generate: IEmbed['generate'];

  constructor(data?: IEmbed, options?: Partial<EmbedOptions>) {
    super(data, options);

    this.generate = data?.generate ?? (() => ({}));
  }

  public setGenerate(callback: IEmbed['generate']) {
    this.generate = callback;
    return this;
  }
}

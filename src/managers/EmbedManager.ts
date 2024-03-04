import { Async, Explorer, File } from '@natchy/utils';
import { Embed, EmbedOptions, type IEmbed } from '../structures/Embed';
import { BaseManager } from './BaseManager';

export class EmbedManager extends BaseManager<Embed, IEmbed> {
  public readonly name = 'embeds';

  public from(data: IEmbed, options?: Partial<EmbedOptions>) {
    return new Embed(data, { ...options, manager: this });
  }

  public async load() {
    if (!Explorer.exists(this.path)) return this;
    const files = Explorer.list(this.path, { extensions: ['.js', '.ts'], flatten: true, type: 'file' });

    await Async.parallel(files as File[], async (file) => {
      try {
        const data = await this.fetch(file);
        if (!data) return;

        const e = data instanceof Embed ? data : this.from(data, { file, label: file.basename });

        this.add(e);
        this.client.managers.emit('load', { manager: this, self: e, client: this.client });
        if (this.debug) console.log(`Loaded ${e.label} in ${this.constructor.name}`);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        this.client.managers.emit('error', { manager: this, error: err, file, client: this.client });
        if (this.debug) console.error(err);
      }
    });

    return this;
  }
}

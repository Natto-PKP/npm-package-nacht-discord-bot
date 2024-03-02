import type { Locale } from 'discord.js';
import type { BaseManager } from '../managers/BaseManager';
import { Explorer, type File } from '@natchy/utils';

export interface IBase {
  /**
   * Key of this element.
   */
  label?: string | null;

  /**
   * Name in different languages of this element.
   */
  names?: Partial<Record<Locale, string>> | null;

  /**
   * Description in different languages of this element.
   */
  descriptions?: Partial<Record<Locale, string>> | null;

  /**
   * URLs of the explanation images of this element.
   */
  explanationImageURLs?: string[] | null;

  /**
   * If this element is disabled.
   */
  disabled?: boolean;
}

export interface BaseOptions {
  /**
   * Element file.
   */
  file: File;

  /**
   * Override label if not found in data.
   */
  label: string;

  /**
   * Override names if not found in data.
   */
  manager: BaseManager<Base, IBase>;
}

export abstract class Base {
  public label: string | null = null;
  public names: Partial<Record<Locale, string> | null> = null;
  public descriptions: Partial<Record<Locale, string>> | null = null;
  public explanationImageURLs: string[] | null = null;
  public disabled = false;
  public readonly file: File | null = null;
  public readonly manager: BaseManager<Base, IBase> | null = null;

  constructor(data?: IBase, options?: Partial<BaseOptions>) {
    if (data) {
      const label = data.label ?? options?.label;
      this.label = label ?? null;
      this.names = data.names ?? null;
      this.descriptions = data.descriptions ?? null;
      this.explanationImageURLs = data.explanationImageURLs ?? null;
      this.disabled = data.disabled ?? false;
    } else this.label = options?.label ?? null;

    if (options?.file) this.file = options.file;
    if (options?.manager) this.manager = options.manager;
  }

  /**
   * Fetch file content.
   * @returns
   */
  public async fetch() {
    if (!this.file) throw new Error('File not found.');
    const absolute = Explorer.absolute(this.file.path);
    const content = (await Explorer.import(absolute)) as any;
    const data = content.default ?? content;
    if (!data) throw new Error(`File ${this.file.path} is empty`);
    return data as IBase;
  }

  /**
   * Reload the element.
   * @returns
   */
  public reload() {
    if (!this.manager) throw new Error('Manager not found.');
    this.manager.reload(this);
    return this;
  }

  /**
   * Remove the element.
   * @returns
   */
  public remove() {
    if (!this.manager) throw new Error('Manager not found.');
    this.manager.remove(this);
    return this;
  }

  /**
   * Convert the element to a JSON object.
   * @returns
   */
  public data() {
    return {
      label: this.label,
      names: this.names,
      descriptions: this.descriptions,
      explanationImageURLs: this.explanationImageURLs,
      disabled: this.disabled,
    } as IBase;
  }

  /**
   * Set the label of the element.
   * @param label
   * @returns
   */
  public setLabel(label: string) {
    this.label = label;
    return this;
  }

  /**
   * Set the names of the element.
   * @param names
   * @returns
   */
  public setNames(names: Record<Locale, string>) {
    this.names = names;
    return this;
  }

  /**
   * Add a name to the element.
   * @param locale
   * @param name
   * @returns
   */
  public addName(locale: Locale, name: string) {
    if (!this.names) this.names = {};
    this.names[locale] = name;
    return this;
  }

  /**
   * Remove a name from the element.
   * @param locale
   * @returns
   */
  public removeName(locale: Locale) {
    if (this.names) delete this.names[locale];
    return this;
  }

  /**
   * Set the descriptions of the element.
   * @param descriptions
   * @returns
   */
  public setDescriptions(descriptions: Record<Locale, string>) {
    this.descriptions = descriptions;
    return this;
  }

  /**
   * Add a description to the element.
   * @param locale
   * @param description
   * @returns
   */
  public addDescription(locale: Locale, description: string) {
    if (!this.descriptions) this.descriptions = {};
    this.descriptions[locale] = description;
    return this;
  }

  /**
   * Remove a description from the element.
   * @param locale
   * @returns
   */
  public removeDescription(locale: Locale) {
    if (this.descriptions) delete this.descriptions[locale];
    return this;
  }

  /**
   * Set the explanation image URLs of the element.
   * @param urls
   * @returns
   */
  public setExplanationImageURLs(urls: string[]) {
    this.explanationImageURLs = urls;
    return this;
  }

  /**
   * Add an explanation image URL to the element.
   * @param url
   * @returns
   */
  public addExplanationImageURL(url: string) {
    if (!this.explanationImageURLs) this.explanationImageURLs = [];
    this.explanationImageURLs.push(url);
    return this;
  }

  /**
   * Remove an explanation image URL from the element.
   * @param url
   * @returns
   */
  public removeExplanationImageURL(url: string) {
    if (this.explanationImageURLs) {
      const index = this.explanationImageURLs.indexOf(url);
      if (index !== -1) this.explanationImageURLs.splice(index, 1);
    }

    return this;
  }

  /**
   * Set the element as disabled.
   * @returns
   */
  public disable() {
    this.disabled = true;
    return this;
  }

  /**
   * Set the element as enabled.
   * @returns
   */
  public enable() {
    this.disabled = false;
    return this;
  }

  /**
   * Set the element as enabled if disabled, and vice versa.
   * @returns
   */
  public toggle() {
    this.disabled = !this.disabled;
    return this;
  }
}

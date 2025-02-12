import { CustomElement, DisplayObjectConfig, Group } from '@antv/g';
import { deepMix } from '@antv/util';
import { select, Selection, G2Element } from '../utils/selection';

type Descriptor<T> = {
  render?: (attributes: T, container: CustomElement<T>) => void;
};

export function createComponent<T>(descriptor: Descriptor<T>): any {
  return class extends CustomElement<T> {
    public descriptor: Descriptor<T>;

    constructor(config: DisplayObjectConfig<T>) {
      super(config);
      this.descriptor = descriptor;
    }

    connectedCallback() {
      this.descriptor.render?.(this.attributes, this);
    }

    public update(cfg = {}) {
      this.attr(deepMix({}, this.attributes, cfg));
      this.descriptor.render?.(this.attributes, this);
    }
  };
}

export function maybeAppend<T>(
  parent: Group,
  selector: string,
  node: string | ((data: T, i: number) => G2Element),
): Selection<T> {
  if (!parent.querySelector(selector)) {
    return select(parent).append(node);
  }
  return select(parent).select(selector);
}

export function titleContent(field: string | string[]): string {
  return Array.isArray(field) ? field.join(', ') : `${field || ''}`;
}

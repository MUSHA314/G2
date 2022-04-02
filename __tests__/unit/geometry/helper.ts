import { Coordinate, Vector2 } from '@antv/coord';
import { Cartesian } from '../../../src/coordinate';
import {
  CoordinateTransform,
  Mark,
  Scale,
  ChannelValue,
} from '../../../src/runtime';

type Options = {
  index: number[];
  mark: Mark;
  scale?: Record<string, Scale>;
  channel: {
    x?: number[][];
    y?: number[][];
    [key: string]: ChannelValue;
  };
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  transform?: CoordinateTransform[];
};

export function plot({
  index,
  mark,
  scale = {},
  channel,
  x = 0,
  y = 0,
  width = 600,
  height = 400,
  transform = [],
}: Options): [number[], Vector2[][]] {
  const coordinate = new Coordinate({
    width,
    height,
    x,
    y,
    transformations: [...transform.flat(), Cartesian()[0]],
  });
  return mark(index, scale, channel, coordinate);
}

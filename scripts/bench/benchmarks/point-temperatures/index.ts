import * as d3 from 'd3';
import { plotSVG } from './plot';
import { echartsCanvas } from './echarts-canvas';
import { d3SVG } from './d3-svg';
import { d3GCanvas } from './d3-g-canvas';
import { vegaLiteSVG } from './vega-lite-svg';
import { g2V4Canvas } from './g2-v4-canvas';
import { g2V5CanvasSpec } from './g2-v5-canvas-spec';
import { g2V5CanvasAPI } from './g2-v5-canvas-api';

export const pointTemperatures = {
  data: () => d3.csv('data/temperatures.csv', d3.autoType),
  benchmark: {
    d3SVG,
    d3GCanvas,
    g2V4Canvas,
    g2V5CanvasSpec,
    vegaLiteSVG,
    plotSVG,
    echartsCanvas,
  },
};

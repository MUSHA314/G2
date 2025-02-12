import { Coordinate } from '@antv/coord';
import { deepMix } from '@antv/util';
import {
  G2ScaleOptions,
  G2CoordinateOptions,
  G2Library,
  G2GuideComponentOptions,
  G2View,
  G2TitleOptions,
} from './types/options';
import {
  GuideComponentComponent,
  GuideComponent,
  ScaleComponent,
  Scale,
} from './types/component';
import { G2Theme, GuideComponentPosition } from './types/common';
import {
  isPolar,
  isTranspose,
  isParallel,
  isReflect,
  isReflectY,
  isTheta,
  isHelix,
  isRadial,
} from './coordinate';
import { useLibrary } from './library';

export function inferComponent(
  scales: G2ScaleOptions[],
  partialOptions: G2View,
  library: G2Library,
): G2GuideComponentOptions[] {
  const {
    component: partialComponents = [],
    coordinates = [],
    title,
    theme,
  } = partialOptions;
  const [, createGuideComponent] = useLibrary<
    G2GuideComponentOptions,
    GuideComponentComponent,
    GuideComponent
  >('component', library);

  const displayedScales = scales.filter(({ guide, name }) => {
    if (guide === null) return false;
    return true;
  });
  const sliders = inferScrollComponents(partialOptions, scales, library);
  const components = [...partialComponents, ...sliders];
  if (title) {
    const { props } = createGuideComponent('title');
    const { defaultPosition, defaultOrder, defaultSize } = props;
    const titleOptions = typeof title === 'string' ? { title } : title;
    components.push({
      type: 'title',
      position: defaultPosition,
      order: defaultOrder,
      size: defaultSize,
      ...titleOptions,
    });
  }

  for (const scale of displayedScales) {
    const type = inferComponentType(scale, coordinates);
    if (type !== null) {
      const { props } = createGuideComponent(type);
      const { defaultPosition, defaultSize, defaultOrder } = props;
      const { guide: guideOptions, name, field } = scale;
      // A scale may have multiple guides.
      const guides = Array.isArray(guideOptions)
        ? guideOptions
        : [guideOptions];
      for (const partialGuide of guides) {
        const position = inferComponentPosition(
          name,
          type,
          defaultPosition,
          partialGuide,
          coordinates,
        );
        const { size = defaultSize, order = defaultOrder } = partialGuide;
        components.push({
          title: field,
          ...partialGuide,
          position,
          order,
          size,
          type,
          scale,
        });
      }
    }
  }

  return components;
}

export function renderComponent(
  component: G2GuideComponentOptions,
  coordinates: Coordinate,
  theme: G2Theme,
  library: G2Library,
) {
  const [useScale] = useLibrary<G2ScaleOptions, ScaleComponent, Scale>(
    'scale',
    library,
  );
  const [useGuideComponent] = useLibrary<
    G2GuideComponentOptions,
    GuideComponentComponent,
    GuideComponent
  >('component', library);
  const { scale: scaleDescriptor, bbox, ...options } = component;
  const scale = scaleDescriptor ? useScale(scaleDescriptor) : null;
  const { field, domain } = scaleDescriptor || {};
  const value = { field, domain, bbox };
  const render = useGuideComponent(options);
  return render(scale, value, coordinates, theme);
}

// @todo Render axis in polar with parallel coordinate.
// @todo Infer legend for shape.
function inferComponentType(
  scale: G2ScaleOptions,
  coordinates: G2CoordinateOptions[],
) {
  const { name, guide, type: scaleType } = scale;
  const { type } = guide;
  if (type !== undefined) return type;
  if (name === 'color') {
    switch (scaleType) {
      case 'ordinal':
        return 'legendCategory';
      case 'linear':
        return 'legendContinuous';
      default:
        return null;
    }
  }
  if (
    (isTranspose(coordinates) && isPolar(coordinates)) ||
    isHelix(coordinates) ||
    isTheta(coordinates)
  )
    return null;
  if (name.startsWith('x')) return isTranspose(coordinates) ? 'axisY' : 'axisX';
  if (name.startsWith('y')) return isTranspose(coordinates) ? 'axisX' : 'axisY';
  if (name.startsWith('position') && !isPolar(coordinates)) return 'axisY';
  return null;
}

// @todo Infer position by coordinates.
function inferComponentPosition(
  name: string,
  type: string | GuideComponentComponent,
  defaultPosition: GuideComponentPosition,
  guide: G2GuideComponentOptions,
  coordinates: G2CoordinateOptions[],
): GuideComponentPosition {
  const positions: GuideComponentPosition[] = [
    'left',
    'right',
    'top',
    'bottom',
    'centerVertical',
    'center',
  ];
  const ordinalPosition = !positions.includes(guide.position)
    ? defaultPosition
    : guide.position;

  // There are multiple axes for parallel coordinate.
  // Place the first one in the border area and put others in the center.
  if (type === 'axisY' && isParallel(coordinates)) {
    const match = /position(\d*)/g.exec(name);
    if (match === null) return ordinalPosition;
    const index = +match[1];
    if (isTranspose(coordinates)) {
      return index === 0 ? 'top' : 'centerHorizontal';
    } else {
      return index === 0 ? ordinalPosition : 'centerVertical';
    }
  } else if (
    (type === 'axisX' && isPolar(coordinates) && !isTranspose(coordinates)) ||
    (type === 'axisY' && isPolar(coordinates) && isTranspose(coordinates)) ||
    (type === 'axisY' && isTheta(coordinates)) ||
    (type === 'axisY' && isHelix(coordinates)) ||
    (type === 'axisY' && isRadial(coordinates))
  ) {
    if (guide.position === 'bottom') return 'arcInner';
    return 'arc';
  } else if (isPolar(coordinates) && (type === 'axisX' || type === 'axisY')) {
    return 'arcY';
  } else if (isRadial(coordinates) && type === 'axisX') {
    return 'arcY';
  } else if (
    (type === 'axisX' && isReflect(coordinates)) ||
    (type === 'axisX' && isReflectY(coordinates))
  ) {
    return 'top';
  } else if (
    typeof type === 'string' &&
    type.startsWith('legend') &&
    isPolar(coordinates)
  ) {
    if (guide.position === 'center') return 'arcCenter';
  }
  return ordinalPosition;
}

/**
 * Infer scroll component type.
 */
function inferSCType(name: string, type: string, coordinates = []) {
  if (name === 'x') return isTranspose(coordinates) ? `${type}Y` : `${type}X`;
  if (name === 'y') return isTranspose(coordinates) ? `${type}X` : `${type}Y`;
  return null;
}

/**
 * Infer scroll components, such as slider and scrollbar.
 */
function inferScrollComponents(
  partialOptions: G2View,
  scales: G2ScaleOptions[],
  library,
) {
  const [, createGuideComponent] = useLibrary<
    G2GuideComponentOptions,
    GuideComponentComponent,
    GuideComponent
  >('component', library);

  const { coordinates } = partialOptions;

  function normalized(
    type: string,
    channelName: string,
    scale: G2ScaleOptions,
    options: Record<string, any>,
  ) {
    const componentType = inferSCType(channelName, type, coordinates);
    if (!options || !componentType) return;

    const { props } = createGuideComponent(componentType);
    const { defaultPosition, defaultSize, defaultOrder } = props;
    return {
      position: defaultPosition,
      size: defaultSize,
      order: defaultOrder,
      type: componentType,
      ...options,
      scale,
    };
  }

  return scales
    .filter((d) => d.slider || d.scrollbar)
    .flatMap((scale) => {
      const { slider, scrollbar, name: channelName } = scale;

      return [
        normalized('slider', channelName, scale, slider),
        normalized('scrollbar', channelName, scale, scrollbar),
      ];
    })
    .filter((d) => !!d);
}

import { Chart } from '@antv/g2';

const data = [
  { type: '18岁以下', value: 654, percent: 0.02 },
  { type: '18-25 岁', value: 654, percent: 0.02 },
  { type: '26-35 岁', value: 4400, percent: 0.2 },
  { type: '36-45 岁', value: 5300, percent: 0.24 },
  { type: '46-55 岁', value: 6200, percent: 0.28 },
  { type: '56 岁', value: 3300, percent: 0.14 },
];
const chart = new Chart({
  container: 'container',
  autoFit: true,
  height: 500,
  padding: [50, 20, 50, 20],
});
chart.data(data);
chart.scale('value', {
  alias: '销售额(万)',
});

chart.axis('type', {
  tickLine: {
    alignTick: false,
  },
});
chart.axis('value', false);

chart.tooltip({
  showMarkers: false,
});
chart.interval().position('type*value');
chart.interaction('element-active');

// 添加文本标注
data.forEach((item) => {
  chart
    .annotation()
    .text({
      position: [item.type, item.value],
      content: item.value,
      style: {
        textAlign: 'center',
      },
      offsetY: -30,
    })
    .text({
      position: [item.type, item.value],
      content: (item.percent * 100).toFixed(0) + '%',
      style: {
        textAlign: 'center',
      },
      offsetY: -12,
    });
});
chart.render();

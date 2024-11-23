<template>
  <div class="flex justify-center">
    <div
      ref="plotContainer"
      class="flex-1"
    />
  </div>
</template>

<script setup lang="ts">
import * as Plot from '@observablehq/plot'
import { useElementSize } from '@vueuse/core'
import * as d3 from 'd3'
import { debounce } from 'lodash-es'
import { onMounted, ref } from 'vue'
import data from '~/mock/data'

// console.log(data)

const plotContainer = ref<HTMLDivElement | null>(null)
const { width } = useElementSize(plotContainer)

function render(width: number, range: number[], figure = true) {
  const line = Plot.lineY(data, {
    x: 'age',
    y: 'population',
    marker: true,
    stroke: 'state',
    tip: 'xy',
    sort: {
      x: {
        value: 'x',
        order(a: typeof data[0]['age'], b: typeof data[0]['age']) {
          const order = Array.from({ length: 9 }, (_, idx) => {
            switch (idx) {
              case 0:
                return '<10'
              case 8:
                return '≥80'
              default:
                return `${idx}0-${idx}9`
            }
          })
          return order.indexOf(a[0]) - order.indexOf(b[0])
        },
      },
    },
  })

  const axisY = Plot.axisY({
    tickFormat: 's',
  })

  return Plot.plot({
    width,
    x: {
      // axis: null,
      label: null,
      range,
      round: false, // Important !, if set to true, it will cause the y-axis to jitter
    },
    color: {
      scheme: 'Observable10',
      legend: true,
    },
    figure,
    marks: [
      line,
      Plot.ruleY([0]),
      axisY,
    ],
  })
}

function insertZoomedPlot(
  container: d3.Selection<HTMLDivElement, any, any, any>,
  width: number,
  range: number[],
) {
  const chart = render(width, range, false)
  // console.log(chart.scale('x')?.range, range)
  container.html('').append(() => chart)
  return chart
}

onMounted(() => {
  const container = d3.select(plotContainer.value)
  if (!container.node()) {
    return
  }

  const range = [40, width.value - 20]
  // console.log(range)
  const barY = render(width.value, range)
  const figure = d3.select(barY)
  const svg = figure.select<SVGSVGElement>('figure > svg')

  const div = figure.append('div') // cannot use svg elements, which will cause the tooltip to fail.
  div.append(() => svg.node())

  const hideTip = (tip: d3.Selection<SVGGElement, any, any, any>) => {
    tip.style('display', 'none')
  }

  const showTip = debounce((tip: d3.Selection<SVGGElement, any, any, any>) => {
    tip.style('display', 'unset')
  }, 100)

  const zoomed = (e: d3.D3ZoomEvent<HTMLDivElement, any>) => {
    // console.log(e.transform)
    const zoomedRange = range.map(r => e.transform.applyX(r))
    zoomedRange[0] = Math.min(zoomedRange[0], range[0])
    zoomedRange[1] = Math.max(zoomedRange[1], range[1])
    const zoomedPlot = insertZoomedPlot(div, width.value, zoomedRange)

    const chart = d3.select(zoomedPlot)
    const tip = chart.select<SVGGElement>('[aria-label="tip"]')
    hideTip(tip)
    showTip(tip)

    const rect = chart.insert<SVGRectElement>(
      'svg:rect',
      '[aria-label="y-axis tick"]',
    )
    rect
      .attr('width', range[0])
      .attr('height', chart.attr('height'))
      .attr('fill', 'white')
  }

  const zoom = d3
    .zoom<HTMLDivElement, any>()
    .scaleExtent([1, 20])
    .translateExtent([[0, 0], [width.value, 0]])
    .on('zoom', zoomed)

  div.call(zoom)
  container.append(() => figure.node())
})
</script>

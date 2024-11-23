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
import { onMounted, ref } from 'vue'
import data from '~/mock/data'

// console.log(data)

const plotContainer = ref<HTMLDivElement | null>(null)
const { width } = useElementSize(plotContainer)

function renderPlot(width: number, range: number[], figure = true) {
  const barY = Plot.barY(data, {
    fx: 'state',
    x: 'age',
    y: 'population',
    fill: 'age',

    tip: true,
    // sort: { color: null, x: null, fx: { value: "-y", reduce: "sum" } }
  })

  const axisY = Plot.axisY({
    tickFormat: 's',
    labelOffset: range[0],
    dx: Math.abs(range[0] - 40),
  })

  return Plot.plot({
    width,
    x: {
      axis: null,
    },
    fx: { label: null, range },
    color: {
      scheme: 'spectral',
      legend: true,
    },
    marks: [
      barY,
      Plot.ruleY([0]),
      axisY,
    ],
    figure,
  })
}

function insertPlot(
  container: d3.Selection<SVGGElement, undefined, null, undefined>,
  width: number,
  range: number[],
) {
  const chart = renderPlot(width, range, false)
  // console.log(chart)
  container.html('').append(() => chart)
  return chart
}

onMounted(() => {
  const container = d3.select(plotContainer.value)
  if (!container.node()) {
    return
  }

  const g = d3.create<SVGGElement>('svg:g')

  const figure = renderPlot(width.value, [40, width.value - 20])
  const plotSvg = d3.select(figure).select<SVGSVGElement>('figure > svg')

  const zoomedSvg = d3
    .select(figure)
    .insert<SVGSVGElement>(() => plotSvg.clone().node()!, () => plotSvg.node())
    .attr('class', '')

  zoomedSvg
    .append(() => g.node())
    .append<SVGGElement>(() => plotSvg.node()!)

  const zoomed = (e: d3.D3ZoomEvent<SVGGElement, undefined>) => {
    const newRange = [40, width.value - 20].map(r => e.transform.applyX(r))
    newRange[0] = d3.min([newRange[0], 40])!
    newRange[1] = d3.max([newRange[1], width.value - 20])!

    const chart = d3.select(insertPlot(g, width.value, newRange))

    const rect = chart.insert<SVGRectElement>(
      'svg:rect',
      '[aria-label="y-axis tick"]',
    )
    rect
      .attr('width', 40)
      .attr('height', chart.attr('height'))
      .attr('fill', 'white')
  }

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 20])
    .translateExtent([[0, 0], [width.value, 0]])
    .on('zoom', zoomed)

  zoomedSvg.call(zoom)

  container.append(() => figure)
})
</script>

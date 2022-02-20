import { computed, reactive } from "vue"
const state = reactive({
  highlightSeriesId: null as number | null,
})

export const highlightSerieId = computed(() => state.highlightSeriesId)

export function setHighlightSerie(id: number) {
  state.highlightSeriesId = id
}

export function clearHighlightSeries() {
  state.highlightSeriesId = null
}

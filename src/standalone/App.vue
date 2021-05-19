<template>
  <div class="p-4">
    <h1>藏書</h1>
    <button v-if="!loading" @click="reloadCollection">重新讀取藏書</button>
    <div v-if="loading">{{ loadingProgress }}</div>
    <template v-if="loadingSeries.length">
      <h2>尚未解析系列</h2>
      <div class="flex flex-wrap">
        <div
          class="flex p-4 items-center"
          v-for="book in loadingSeries"
          :key="book.id"
        >
          <img
            :src="`https://image.bookwalker.com.tw/upload/product/${book.id}/${book.id}_4.jpg`"
          />
          <a
            class="w-48 text-lg text-center"
            target="_blank"
            :href="`https://www.bookwalker.com.tw/browserViewer/${book.id}/read`"
            >{{ book.name }}</a
          >
        </div>
      </div>
    </template>
    <template v-if="noSeries.length">
      <h2>非系列書</h2>
      <div class="flex flex-wrap">
        <div
          class="flex p-4 items-center"
          v-for="book in noSeries"
          :key="book.id"
        >
          <img
            :src="`https://image.bookwalker.com.tw/upload/product/${book.id}/${book.id}_4.jpg`"
          />
          <a
            class="w-48 text-lg text-center"
            target="_blank"
            :href="`https://www.bookwalker.com.tw/browserViewer/${book.id}/read`"
            >{{ book.name }}</a
          >
        </div>
      </div>
    </template>
    <template v-if="seriesCollection.length">
      <h2>系列書</h2>
      <template v-for="series in seriesCollection" :key="series.name">
        <h3>{{ series.name }}</h3>
        <div class="flex flex-wrap">
          <div
            class="flex p-4 items-center"
            v-for="book in series.books"
            :key="book.id"
          >
            <img
              :src="`https://image.bookwalker.com.tw/upload/product/${book.id}/${book.id}_4.jpg`"
            />
            <a
              class="w-48 text-lg text-center"
              target="_blank"
              :href="`https://www.bookwalker.com.tw/browserViewer/${book.id}/read`"
              >{{ book.name }}</a
            >
          </div>
        </div>
      </template>
    </template>
    <div>
      Icons made by <a href="" title="srip">srip</a> from
      <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue"
import {
  booksProperty,
  reloadCollection,
  loading,
  loadingProgress,
} from "@/services/bookCollectionServices"
import lodash from "lodash"

export default defineComponent({
  name: "App",
  setup() {
    const loadingSeries = computed(() =>
      lodash(booksProperty.value.filter((book) => book.series === null))
        .orderBy((book) => book.name)
        .value()
    )

    const noSeries = computed(() =>
      lodash(booksProperty.value)
        .filter((book) => book.series === "")
        .orderBy((book) => book.id)
        .value()
    )

    const seriesCollection = computed(() =>
      lodash(booksProperty.value)
        .filter((book) => book.series !== null && book.series !== "")
        .groupBy((book) => book.series)
        .toPairs()
        .map(([name, books]) => ({
          name,
          books: lodash(books)
            .orderBy((book) => book.id)
            .value(),
        }))
        .value()
    )

    return {
      reloadCollection,
      loading,
      loadingProgress,
      loadingSeries,
      noSeries,
      seriesCollection,
    }
  },
})
</script>

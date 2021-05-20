<template>
  <div class="bg-gray-100 min-h-screen">
    <div class="container mx-auto p-4 font-google">
      <div class="flex flex-row mb-4">
        <h1 class="text-gray-900 text-3xl font-medium tracking-tight mt-2">
          藏書
        </h1>
        <div class="flex-grow flex flex-col justify-center items-end">
          <button
            type="button"
            class="flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-max"
            @click="reloadCollection"
            :disabled="loading"
          >
            重新讀取藏書
          </button>
        </div>
      </div>

      <div class="rounded-md bg-blue-50 p-4 mb-4" v-if="loading">
        <div class="flex">
          <div class="ml-3 flex-1 md:flex md:justify-between">
            <p class="text-sm text-blue-700">
              {{ loadingProgress }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="loading"></div>

      <template v-if="loadingSeries.length">
        <BookList title="尚未解析系列">
          <BookEntry
            v-for="book in loadingSeries"
            :key="book.id"
            :bookName="book.name"
            :bookImage="`https://image.bookwalker.com.tw/upload/product/${book.id}/${book.id}_1.jpg`"
            :bookUrl="`https://www.bookwalker.com.tw/browserViewer/${book.id}/read`"
          >
          </BookEntry>
        </BookList>
      </template>
      <template v-if="noSeries.length">
        <BookList title="非系列書">
          <BookEntry
            v-for="book in noSeries"
            :key="book.id"
            :bookName="book.name"
            :bookImage="`https://image.bookwalker.com.tw/upload/product/${book.id}/${book.id}_1.jpg`"
            :bookUrl="`https://www.bookwalker.com.tw/browserViewer/${book.id}/read`"
          >
          </BookEntry>
        </BookList>
      </template>
      <template v-if="seriesCollection.length">
        <template v-for="series in seriesCollection" :key="series.name">
          <BookList :title="series.name">
            <BookEntry
              v-for="book in series.books"
              :key="book.id"
              :bookName="book.name"
              :bookImage="`https://image.bookwalker.com.tw/upload/product/${book.id}/${book.id}_1.jpg`"
              :bookUrl="`https://www.bookwalker.com.tw/browserViewer/${book.id}/read`"
            >
            </BookEntry>
          </BookList>
        </template>
      </template>
      <footer>
        <div
          class="border-t border-gray-200 py-8 text-sm text-gray-500 text-center sm:text-left"
        >
          <span class="block sm:inline">
            Icons made by <a href="" title="srip">srip</a> from
            <a href="https://www.flaticon.com/" title="Flaticon"
              >www.flaticon.com</a
            >
          </span>
        </div>
      </footer>
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
import BookEntry from "@/components/BookEntry.vue"
import BookList from "@/components/BookList.vue"

export default defineComponent({
  name: "App",
  components: { BookEntry, BookList },
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

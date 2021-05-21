<template>
  <div class="bg-gray-100 min-h-screen">
    <div class="container mx-auto p-4 font-google">
      <div class="flex flex-row mb-4">
        <h1 class="text-gray-900 text-3xl font-medium tracking-tight mt-2">
          藏書
        </h1>
        <div class="flex-grow flex flex-row justify-end items-center">
          <a
            class="px-3 py-2 text-blue-500"
            target="_blank"
            href="https://www.bookwalker.com.tw/member/available_book_list"
            >Book Walker 個人專頁</a
          >
          <button
            v-if="!loading"
            type="button"
            class="flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-max"
            @click="reloadCollection"
          >
            重新讀取藏書
          </button>
        </div>
      </div>

      <div
        class="rounded-md p-4 mb-4"
        :class="alerting ? 'bg-red-500' : 'bg-blue-50'"
        v-if="loadingMessage"
      >
        <div class="flex">
          <div class="ml-3 flex-1 md:flex md:justify-between">
            <p
              :class="alerting ? 'text-red-50' : 'text-blue-700'"
              class="text-sm"
            >
              {{ loadingMessage.msg }}
            </p>
          </div>
        </div>
      </div>

      <template v-if="seriesCollection.length">
        <template v-for="series in seriesCollection" :key="series.name">
          <BookList :title="series.name" isSeries :top="series.top">
            <BookEntry v-for="book in series.books" :key="book.id" :book="book">
            </BookEntry>
          </BookList>
        </template>
      </template>

      <template v-if="noSeries.length">
        <BookList title="非系列書">
          <BookEntry v-for="book in noSeries" :key="book.id" :book="book">
          </BookEntry>
        </BookList>
      </template>

      <template v-if="loadingSeries.length">
        <BookList title="尚未解析系列">
          <BookEntry v-for="book in loadingSeries" :key="book.id" :book="book">
          </BookEntry>
        </BookList>
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
  loadingMessage,
  topSeries,
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
          top: topSeries.value.includes(name),
          books: lodash(books)
            .orderBy((book) => book.id)
            .value(),
        }))
        .orderBy((group) => (group.top ? `!${group.name}` : group.name))
        .value()
    )

    const alerting = computed(() => !!loadingMessage.value?.error)

    return {
      reloadCollection,
      loading,
      loadingMessage,
      loadingSeries,
      noSeries,
      seriesCollection,
      alerting,
    }
  },
})
</script>

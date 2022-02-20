<template>
  <div class="bg-gray-100 min-h-screen font-google">
    <Notifications />
    <div class="container mx-auto p-4">
      <div class="flex flex-row mb-4">
        <h1 class="text-gray-900 text-3xl font-medium tracking-tight mt-2">
          藏書
        </h1>
        <div class="flex-grow flex flex-row justify-end items-center">
          <a
            class="px-3 py-2 text-blue-500"
            target="_blank"
            href="https://www.bookwalker.com.tw/bookcase/available_book_list"
            >Book Walker 個人書櫃</a
          >
          <button
            v-if="!loading"
            type="button"
            class="
              flex
              items-center
              px-3
              py-2
              border border-transparent
              text-sm
              leading-4
              font-medium
              rounded-md
              shadow-sm
              text-white
              bg-indigo-600
              hover:bg-indigo-700
              focus:outline-none
              focus:ring-2
              focus:ring-offset-2
              focus:ring-indigo-500
              w-max
            "
            @click="collectBooks"
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
      <BookList
        v-if="lastReadBooks.length"
        title="最近閱讀"
        :books="lastReadBooks"
        :showCount="false"
        :showshowSeriesLinkIfIsSeries="true"
      />

      <template v-if="seriesCollection.length">
        <BookList
          v-for="series in seriesCollection"
          :key="series.id"
          :title="series.seriesName"
          :books="series.books"
          :seriesId="series.id"
          :top="series.top"
          :tags="series.tags"
          :writers="series.writers"
          :ownCount="series.books.length"
          :seriesCount="series.seriesCount"
        />
      </template>

      <BookList v-if="noSeries.length" title="非系列書" :books="noSeries" />
      <BookList
        v-if="notFounds.length"
        title="找不到詳細資料"
        :books="notFounds"
      />
      <BookList
        v-if="loadingSeries.length"
        title="尚未解析詳細資料"
        :books="loadingSeries"
      />
      <button
        class="
          fixed
          right-10
          bottom-10
          px-3
          py-2
          border border-transparent
          text-sm
          font-medium
          rounded-md
          shadow-sm
          text-white
          bg-green-300
          hover:bg-green-400
          focus:outline-none
          w-max
        "
        @click="toTop"
      >
        Top
      </button>
      <footer>
        <div
          class="
            border-t border-gray-200
            py-8
            flex
            items-center
            text-sm text-gray-500
          "
        >
          <span class="flex-none mr-4">
            Extension made by
            <a href="https://github.com/drsmile1001/book-walker-helper"
              >drsmile.1001</a
            >
          </span>

          <span class="flex-none mr-4">
            UI design by
            <a href="https://github.com/caxerx">caxerx</a>
          </span>

          <span class="flex-none mr-4">
            Icons made by srip from
            <a href="https://www.flaticon.com/" title="Flaticon"
              >www.flaticon.com</a
            >
          </span>
          <span class="flex-grow"> </span>
          <button class="flex-none text-red-800" @click="removeAllData">
            清除所有資料
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive } from "vue"
import Notifications from "@/components/Notifications.vue"
import BookList from "@/components/Bookshelf.vue"
import {
  collect,
  loading,
  loadingMessage,
  fetchLastReadBookIds,
} from "@/services/Collector"
import { books, series, tags, clear, Book } from "@/services/Repository"
import lodash from "lodash"
import { pushNotification } from "@/services/NotificationService"

export default defineComponent({
  name: "App",
  components: { Notifications, BookList },
  setup() {
    const state = reactive({
      lastReadBookIds: [] as number[],
    })

    const lastReadBooks = computed(
      () =>
        lodash(state.lastReadBookIds)
          .map((id) => books.value.find((b) => b.id == id))
          .filter((b) => !!b)
          .take(10)
          .value() as Book[]
    )

    const loadingSeries = computed(() =>
      lodash(
        books.value.filter((book) => !book.seriesIdChecked && !book.notFound)
      )
        .orderBy((book) => book.name)
        .value()
    )

    const notFounds = computed(() =>
      lodash(books.value.filter((book) => book.notFound))
        .orderBy((book) => book.name)
        .value()
    )

    const noSeries = computed(() =>
      lodash(books.value)
        .filter((book) => !!book.seriesIdChecked && !book.seriesId)
        .orderBy((book) => book.id)
        .value()
    )

    const seriesCollection = computed(() =>
      lodash(books.value)
        .filter((book) => !!book.seriesIdChecked && !!book.seriesId)
        .groupBy((book) => book.seriesId!)
        .toPairs()
        .map(([seriesId, books]) => {
          const id = parseInt(seriesId)
          const found = series.value.find((s) => s.id === id)
          return {
            id,
            top: found?.top ?? false,
            seriesName: found?.name ?? "--",
            books: lodash(books)
              .orderBy((book) => book.id)
              .value(),
            writers: lodash(books)
              .flatMap((b) => b.writer ?? [])
              .uniq()
              .value(),
            tags: lodash(books)
              .flatMap((b) => b.tags ?? [])
              .uniq()
              .map((t) => tags.value.find((s) => s.id == t)?.name ?? "--")
              .value(),
            seriesCount: found?.bookCount,
          }
        })
        .orderBy((group) =>
          group.top ? `!${group.seriesName}` : group.seriesName
        )
        .value()
    )

    const alerting = computed(() => !!loadingMessage.value?.error)

    function removeAllData() {
      if (!confirm("是否清除所有資料？這個動作無法還原？")) return
      clear()
    }

    async function collectBooks() {
      await collect()
      await loadLastReadBooks()
    }

    async function loadLastReadBooks() {
      const result = await fetchLastReadBookIds()
      if (result.value) {
        state.lastReadBookIds = result.value
      } else {
        pushNotification("載入最近讀取藏書失敗！", "ERROR")
      }
    }

    loadLastReadBooks()

    function toTop() {
      document.body.children[0].scrollIntoView()
    }

    return {
      collectBooks,
      loading,
      loadingMessage,
      notFounds,
      loadingSeries,
      noSeries,
      seriesCollection,
      alerting,
      removeAllData,
      loadLastReadBooks,
      lastReadBooks,
      toTop,
    }
  },
})
</script>

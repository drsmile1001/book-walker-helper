<template>
  <div class="bg-white mb-6 rounded-lg">
    <div
      class="flex items-center rounded-t-lg p-2 px-4 border-b border-gray-200 mb-2 bg-gray-50"
    >
      <svg
        v-if="seriesId"
        class="flex-none w-5 h-5 text-gray-500 hover:opacity-75 cursor-pointer"
        viewBox="0 0 24 24"
        @click="switchTopSeries(seriesId || 0)"
      >
        <path
          v-if="top"
          fill="currentColor"
          d="M20 4V6H13.5C11 6 9 8 9 10.5V16.17L12.09 13.09L13.5 14.5L8 20L2.5 14.5L3.91 13.08L7 16.17V10.5C7 6.91 9.91 4 13.5 4H20Z"
        />
        <path
          v-else
          fill="currentColor"
          d="M8,11H11V21H13V11H16L12,7L8,11M4,3V5H20V3H4Z"
        />
      </svg>
      <h2 class="flex-grow ml-2 font-normal text-gray-500">
        {{ seriesId ? `${title} 系列` : title }}
      </h2>
      <span
        class="flex-none mx-1 font-normal text-sm"
        :class="notComplete ? ' text-green-500' : 'text-gray-500'"
      >
        {{ books.length }}
        <template v-if="seriesId"> / {{ seriesCount || "--" }}</template>
      </span>
      <a
        class="flex-none"
        v-if="seriesShopUrl"
        :href="seriesShopUrl"
        target="_blank"
      >
        <svg
          class="w-5 h-5 hover:opacity-75"
          :class="notComplete ? ' text-green-500' : 'text-gray-500'"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M12,18H6V14H12M21,14V12L20,7H4L3,12V14H4V20H14V14H18V20H20V14M20,4H4V6H20V4Z"
          />
        </svg>
      </a>
    </div>

    <div class="px-4 pb-4">
      <ul
        role="list"
        class="grid gap-y-8 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-4 md:gap-x-6 xl:gap-x-8"
      >
        <BookEntry v-for="book in books" :key="book.id" :book="book" />
      </ul>
    </div>
    <div class="rounded-d-lg p-2 pl-4 border-b border-gray-200 mb-2 bg-gray-50">
      <div v-if="writers" class="leading-tight text-xs text-gray-400">
        作者：
        <span class="mr-2" v-for="writer in writers" :key="writer">{{
          writer
        }}</span>
      </div>
      <div v-if="tags" class="leading-tight text-xs text-gray-400">
        標籤：
        <span class="mr-2" v-for="tag in tags" :key="tag">{{ tag }}</span>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { computed, defineComponent, PropType } from "vue"
import BookEntry from "@/components/BookEntry.vue"
import { switchTopSeries } from "@/services/Repository"
import { Book } from "@/services/Repository"

export default defineComponent({
  name: "BookList",
  components: {
    BookEntry,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    books: {
      type: Array as PropType<Book[]>,
      required: true,
    },
    seriesId: {
      type: Number,
    },
    top: {
      type: Boolean,
      default: false,
    },
    writers: {
      type: Array as PropType<string[]>,
    },
    tags: {
      type: Array as PropType<string[]>,
    },
    seriesCount: {
      type: Number,
    },
  },
  setup(props) {
    const seriesShopUrl = computed(() =>
      props.seriesId
        ? `https://www.bookwalker.com.tw/search?series=${props.seriesId}`
        : null
    )

    const notComplete = computed(
      () => !!props.seriesCount && props.seriesCount > props.books.length
    )
    return {
      switchTopSeries,
      seriesShopUrl,
      notComplete,
    }
  },
})
</script>
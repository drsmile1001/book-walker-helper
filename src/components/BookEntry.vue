<template>
  <li class="relative">
    <div
      class="group block object-contain w-full aspect-w-10 aspect-h-15 rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 focus-within:ring-indigo-500 overflow-hidden"
    >
      <a
        :href="readUrl"
        class="absolute inset-0 focus:outline-none"
        target="_blank"
      >
        <img
          :src="imageUrl"
          :alt="book.name"
          class="object-cover pointer-events-none group-hover:opacity-75"
        />
      </a>
    </div>
    <div class="flex justify-around">
      <a :href="shopUrl" target="_blank">
        <svg
          class="w-5 h-5 text-green-500 hover:opacity-75"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M12,18H6V14H12M21,14V12L20,7H4L3,12V14H4V20H14V14H18V20H20V14M20,4H4V6H20V4Z"
          />
        </svg>
      </a>
      <svg
        class="w-5 h-5 text-yellow-500 cursor-pointer hover:opacity-75"
        viewBox="0 0 24 24"
        @click="switchFavorite(book.id)"
      >
        <path
          v-if="book.favorite"
          fill="currentColor"
          d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"
        />
        <path
          v-else
          fill="currentColor"
          d="M12,15.39L8.24,17.66L9.23,13.38L5.91,10.5L10.29,10.13L12,6.09L13.71,10.13L18.09,10.5L14.77,13.38L15.76,17.66M22,9.24L14.81,8.63L12,2L9.19,8.63L2,9.24L7.45,13.97L5.82,21L12,17.27L18.18,21L16.54,13.97L22,9.24Z"
        />
      </svg>
      <svg
        class="w-5 h-5 text-red-400 cursor-pointer hover:opacity-75"
        viewBox="0 0 24 24"
        @click="switchBookmark(book.id)"
      >
        <path
          v-if="book.bookmark"
          fill="currentColor"
          d="M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5C19,3.89 18.1,3 17,3Z"
        />
        <path
          v-else
          fill="currentColor"
          d="M17,18L12,15.82L7,18V5H17M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5C19,3.89 18.1,3 17,3Z"
        />
      </svg>
    </div>
    <p class="block text-sm text-gray-900">
      <a :href="readUrl" target="_blank">
        {{ book.name }}
      </a>
    </p>
  </li>
</template>


<script lang="ts">
import { Book } from "@/services/bookCollectionServices"
import { computed, defineComponent, PropType } from "vue"
import {
  switchFavorite,
  switchBookmark,
} from "@/services/bookCollectionServices"

export default defineComponent({
  name: "Book",
  props: {
    book: {
      type: Object as PropType<Book>,
      required: true,
    },
  },
  setup(props) {
    const imageUrl = computed(
      () =>
        `https://image.bookwalker.com.tw/upload/product/${props.book.id}/${props.book.id}_1.jpg`
    )

    const readUrl = computed(
      () => `https://www.bookwalker.com.tw/browserViewer/${props.book.id}/read`
    )

    const shopUrl = computed(
      () => `https://www.bookwalker.com.tw/product/${props.book.id}`
    )

    return {
      imageUrl,
      readUrl,
      shopUrl,
      switchFavorite,
      switchBookmark,
    }
  },
})
</script>
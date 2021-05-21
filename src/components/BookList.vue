<template>
  <div class="bg-white mb-6 rounded-lg">
    <div
      class="rounded-t-lg p-2 pl-4 border-b border-gray-200 mb-2 bg-gray-50 truncate"
    >
      <svg
        v-if="isSeries"
        class="inline w-5 h-5 text-gray-500 hover:opacity-75 cursor-pointer"
        viewBox="0 0 24 24"
        @click="switchTopSeries(title)"
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
      <h2 class="inline ml-2 font-normal text-gray-500">
        {{ isSeries ? `${title} 系列` : title }}
      </h2>
    </div>

    <div class="px-4 pb-4">
      <ul
        role="list"
        class="grid gap-y-8 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-4 md:gap-x-6 xl:gap-x-8"
      >
        <slot></slot>
      </ul>
    </div>
  </div>
</template>


<script lang="ts">
import { defineComponent } from "vue"
import { switchTopSeries } from "@/services/bookCollectionServices"

export default defineComponent({
  name: "BookList",
  props: {
    title: {
      type: String,
      required: true,
    },
    isSeries: {
      type: Boolean,
      default: false,
    },
    top: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    return {
      switchTopSeries,
    }
  },
})
</script>
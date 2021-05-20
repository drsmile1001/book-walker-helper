<template>
  <div class="bg-white mb-6 rounded-lg">
    <h2
      class="font-normal text-gray-500 truncate mb-2 bg-gray-50 rounded-t-lg p-2 pl-4 border-b border-gray-200"
    >
      {{ title }}
    </h2>
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

export default defineComponent({
  name: "BookList",
  props: {
    title: {
      type: String,
      required: true,
    },
  },
})
</script>
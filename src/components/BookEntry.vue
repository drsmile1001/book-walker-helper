<template>
  <li class="relative">
    <div
      class="group block object-contain w-full aspect-w-10 aspect-h-15 rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 focus-within:ring-indigo-500 overflow-hidden"
    >
      <a
        :href="bookUrl"
        class="absolute inset-0 focus:outline-none"
        target="_blank"
      >
        <img
          :src="bookImage"
          :alt="bookName"
          class="object-cover pointer-events-none group-hover:opacity-75"
        />
      </a>
    </div>
    <p class="mt-2 block text-sm text-gray-900">
      <a :href="bookUrl" target="_blank">
        {{ bookName }}
      </a>
    </p>
  </li>
</template>


<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: "Book",
  props: {
    bookName: {
      type: String,
      required: true,
    },
    bookImage: {
      type: String,
      required: true,
    },
    bookUrl: {
      type: String,
      required: true,
    },
  },
})
</script>
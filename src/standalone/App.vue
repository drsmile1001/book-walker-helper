<template>
  <div class="p-4">
    <h1>收藏</h1>
    <button v-if="!loading" @click="reloadCollection">重新讀取藏書</button>
    <div v-if="loading">載入進度： {{ loadingProgress }}</div>
    <div class="flex flex-wrap justify-center">
      <div
        class="flex p-4 items-center"
        v-for="book in booksProperty"
        :key="book.id"
      >
        <img
          :src="`https://image.bookwalker.com.tw/upload/product/${book.id}/${book.id}_4.jpg`"
        />
        <a
          class="w-48 text-lg text-center"
          target="_blank"
          :href="`https://www.bookwalker.com.tw/browserViewer/${book.id}/read`"
          >{{ book.series }}:{{ book.name }}</a
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from "vue"
import {
  booksProperty,
  reloadCollection,
  loading,
  loadingProgress,
} from "@/services/bookCollectionServices"

export default defineComponent({
  name: "App",
  setup() {
    const state = reactive({})

    return {
      booksProperty,
      reloadCollection,
      loading,
      loadingProgress,
    }
  },
})
</script>

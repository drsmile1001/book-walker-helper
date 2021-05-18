<template>
  <div>
    <h1>收藏</h1>
    {{ booksProperty }}
    <button @click="reloadCollection">重新讀取藏書</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from "vue"
import {
  booksProperty,
  reloadCollection,
} from "@/services/bookCollectionServices"

export default defineComponent({
  name: "App",
  setup() {
    const state = reactive({})

    return {
      booksProperty,
      reloadCollection,
    }
  },
})
</script>

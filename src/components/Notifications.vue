<template>
  <div class="fixed top-4 right-4 z-10">
    <transition-group name="list-complete" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="rounded-md p-4 mb-4 max-w-sm text-sm shadow-md list-complete-item flex"
        :class="themeClass(notification)"
      >
        <svg
          class="w-10 h-10 cursor-pointer hover:opacity-75"
          viewBox="0 0 24 24"
          @click="close(notification.id)"
        >
          <path
            fill="currentColor"
            d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
          />
        </svg>
        <span class="ml-2">{{ notification.msg }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import {
  Notification,
  notifications,
  removeNotification,
} from "@/services/NotificationService"

export default defineComponent({
  setup() {
    function themeClass(notification: Notification) {
      switch (notification.type) {
        case "INFO":
          return ["bg-blue-50", "text-blue-700"]
        case "SUCCESS":
          return ["bg-green-50", "text-green-700"]
        case "ERROR":
          return ["bg-red-500", "text-red-50"]
        default:
          break
      }
    }

    function close(id: string) {
      removeNotification(id)
    }
    return {
      notifications,
      themeClass,
      close,
    }
  },
})
</script>

<style lang="scss">
.list-complete-item {
  transition: all 0.5s ease;
}

.list-complete-enter-from,
.list-complete-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.list-complete-leave-active {
  position: absolute;
  right: -24em;
}
</style>
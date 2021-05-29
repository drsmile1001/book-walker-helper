import { random } from "lodash"
import { computed, reactive } from "vue"

export type NotificationType = "INFO" | "SUCCESS" | "ERROR"
export interface Notification {
  id: string
  msg: string
  type: NotificationType
}

const state = reactive({
  notifications: [] as Notification[],
})

export const notifications = computed(() => state.notifications)

export function pushNotification(msg: string, type: NotificationType) {
  const notification = {
    id: `${new Date().valueOf()}${random()}`,
    msg,
    type,
  }
  state.notifications.push(notification)
  if (type !== "ERROR")
    setTimeout(() => {
      console.log("timeout")
      removeNotification(notification.id)
    }, 5000)
  return notification
}

export function removeNotification(id: string) {
  const index = state.notifications.findIndex(n => n.id === id)
  if (index === -1) return
  state.notifications.splice(index, 1)
}

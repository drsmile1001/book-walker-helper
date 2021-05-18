import { computed, reactive } from "vue"
import ky from "ky"

const domParser = new DOMParser()

interface Book {
  id: string
  name: string
  series: string | null
}

const state = reactive({
  books: JSON.parse(localStorage.getItem("books") ?? "[]") as Book[],
  loading: false,
})

export const booksProperty = computed({
  get: () => state.books,
  set: value => {
    state.books = value
    localStorage.setItem("books", JSON.stringify(value))
  },
})

export const loading = computed(() => state.loading)

export async function reloadCollection() {
  state.loading = true
  const { books } = await loadAbailableBookList(1)
  booksProperty.value = books
  state.loading = false
}

async function loadAbailableBookList(page: number) {
  const html = await ky
    .get(
      `https://www.bookwalker.com.tw/member/available_book_list?page=${page}`
    )
    .text()
  const doc = domParser.parseFromString(html, "text/html")
  const books = Array.from(
    doc.getElementById("order_book")!.getElementsByClassName("buy_info")
  ).map(row => {
    const name = row.getElementsByClassName("buy_book")[0].innerHTML
    const id = (row.getElementsByClassName(
      "bookbor"
    )[0] as HTMLImageElement).src
      .substring("https://image.bookwalker.com.tw/upload/product/".length)
      .split("/")[0]
    return <Book>{
      name,
      id,
      series: null,
    }
  })

  return {
    doc,
    books,
  }
}

import { computed, reactive } from "vue"
import ky from "ky"
import lodash from "lodash"

const domParser = new DOMParser()

interface Book {
  id: string
  name: string
  series: string | null
}

const state = reactive({
  books: JSON.parse(localStorage.getItem("books") ?? "[]") as Book[],
  loading: false,
  currentLoadPage: null as number | null,
  lastLoadPage: null as number | null,
})

export const booksProperty = computed(() => state.books)
export const loading = computed(() => state.loading)
export const loadingProgress = computed(() =>
  state.currentLoadPage != null
    ? `${state.currentLoadPage} / ${state.lastLoadPage}`
    : "--"
)
function saveState() {
  localStorage.setItem("books", JSON.stringify(state.books))
}

export async function reloadCollection() {
  state.loading = true
  const allBooks = [] as Book[]
  state.currentLoadPage = 1
  state.lastLoadPage = null
  while (true) {
    const { doc, books } = await loadAvailableBookList(state.currentLoadPage)
    books
      .map(book => {
        const series = state.books.find(old => old.id === book.id)?.series
        return {
          id: book.id,
          name: book.name,
          series: series ?? null,
        }
      })
      .forEach(book => allBooks.push(book))
    if (state.lastLoadPage === null) {
      state.lastLoadPage = parsePages(doc)
    }
    if (state.currentLoadPage >= state.lastLoadPage) break
    state.currentLoadPage += 1
  }
  state.books = lodash(allBooks)
    .orderBy(book => book.name)
    .value()
  state.currentLoadPage = null
  state.lastLoadPage = null
  saveState()
  state.loading = false
}

async function loadAvailableBookList(page: number) {
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

function parsePages(doc: Document) {
  return parseInt(
    doc.getElementsByClassName("bw_pagination")[0].lastElementChild!
      .previousElementSibling!.firstElementChild!.innerHTML
  )
}

import { computed, reactive } from "vue"
import ky from "ky"
import lodash from "lodash"

const domParser = new DOMParser()

interface Book {
  id: number
  name: string
  series: string | null
}

const state = reactive({
  books: JSON.parse(localStorage.getItem("books") ?? "[]") as Book[],
  loading: false,
  currentLoadPage: null as number | null,
  lastLoadPage: null as number | null,
  currentLoadSeries: null as number | null,
  lastLoadSeries: null as number | null,
})

export const booksProperty = computed(() => state.books)
export const loading = computed(() => state.loading)
export const loadingProgress = computed(() =>
  state.currentLoadPage != null
    ? `藏書載入中 ${state.currentLoadPage} / ${state.lastLoadPage}`
    : state.lastLoadSeries != null
    ? `系列資料載入中 ${state.currentLoadSeries} / ${state.lastLoadSeries}`
    : ""
)
function saveState() {
  localStorage.setItem("books", JSON.stringify(state.books))
}

export async function reloadCollection() {
  state.loading = true
  const originBooks = state.books
  state.books = []
  state.currentLoadPage = 1
  state.lastLoadPage = null
  while (true) {
    const { doc, books } = await loadAvailableBookList(state.currentLoadPage)
    books
      .map(book => {
        const series = originBooks.find(old => old.id === book.id)?.series
        return <Book>{
          id: book.id,
          name: book.name,
          series: series ?? null,
        }
      })
      .forEach(book => state.books.push(book))
    saveState()
    if (state.lastLoadPage === null) {
      state.lastLoadPage = parsePages(doc)
    }
    if (state.currentLoadPage >= state.lastLoadPage) break
    state.currentLoadPage += 1
  }
  state.currentLoadPage = null
  state.lastLoadPage = null
  const bookNeedLoadSeries = state.books.filter(book => book.series === null)
  state.currentLoadSeries = 0
  state.lastLoadSeries = bookNeedLoadSeries.length

  const chunks = lodash(bookNeedLoadSeries)
    .chunk(5)
    .value()
  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index]
    const loadChunk = chunk.map(
      book =>
        new Promise(async (resolve, reject) => {
          try {
            book.series = await loadSeries(book.id)
            state.currentLoadSeries! += 1
            saveState()
            resolve(true)
          } catch (error) {
            resolve(false)
          }
        })
    )
    await Promise.all(loadChunk)
    await new Promise(resolve => {
      setTimeout(() => resolve(null), 250)
    })
  }

  state.currentLoadSeries = null
  state.lastLoadSeries = null
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
    const id = parseInt(
      (row.getElementsByClassName("bookbor")[0] as HTMLImageElement).src
        .substring("https://image.bookwalker.com.tw/upload/product/".length)
        .split("/")[0]
    )
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

async function loadSeries(id: number) {
  const html = await ky
    .get(`https://www.bookwalker.com.tw/product/${id}`)
    .text()
  const doc = domParser.parseFromString(html, "text/html")
  try {
    const element = doc.getElementById("breadcrumb_list")!.firstElementChild!
      .lastElementChild!.previousElementSibling!
      .firstElementChild! as HTMLAnchorElement

    return element.href.includes("/search/?series=") ? element.innerHTML : ""
  } catch (error) {
    console.log("解析系列錯誤", doc, doc.getElementById("breadcrumb_list"))
    throw error
  }
}

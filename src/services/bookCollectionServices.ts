import { computed, reactive } from "vue"
import ky from "ky"
import { parallelMap } from "@/utilities/Parallel"

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
  loadingMessage: null as { msg: string; error?: boolean } | null,
})

export const booksProperty = computed(() => state.books)
export const loading = computed(() => state.loading)
export const loadingMessage = computed(() => state.loadingMessage)

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
    const { doc, books, error } = await loadAvailableBookList(
      state.currentLoadPage
    )
    if (error === "NO_LOGIN") {
      state.loadingMessage = {
        msg: "解析藏書失敗！請檢查是否已登入 Book Walker 網站。",
        error: true,
      }
      return
    } else if (error === "PARSING_ERROR") {
      state.loadingMessage = {
        msg:
          "解析藏書失敗！請檢查 Book Walker 網站是否正常，或其版面改版需要更新助手。",
        error: true,
      }
      return
    }

    books!
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
      state.lastLoadPage = parsePages(doc!)
    }
    if (state.currentLoadPage >= state.lastLoadPage) break
    state.currentLoadPage += 1
    state.loadingMessage = {
      msg: `藏書資料載入中 ${state.currentLoadPage} / ${state.lastLoadPage ??
        1}`,
    }
  }
  state.currentLoadPage = null
  state.lastLoadPage = null
  const bookNeedLoadSeries = state.books.filter(book => book.series === null)
  state.currentLoadSeries = 0
  state.lastLoadSeries = bookNeedLoadSeries.length

  await parallelMap(
    bookNeedLoadSeries,
    async book => {
      book.series = await loadSeries(book.id)
      saveState()
    },
    5,
    done => {
      state.currentLoadSeries = done
      state.loadingMessage = {
        msg: `系列資料載入中 ${state.currentLoadSeries} / ${state.lastLoadSeries}`,
      }
    }
  )
  state.currentLoadSeries = null
  state.lastLoadSeries = null
  state.loading = false
  state.loadingMessage = null
}

async function loadAvailableBookList(
  page: number
): Promise<{
  doc?: Document
  books?: Book[]
  error?: "NO_LOGIN" | "PARSING_ERROR"
}> {
  const response = await ky.get(
    `https://www.bookwalker.com.tw/member/available_book_list?page=${page}`
  )
  if (response.redirected)
    return {
      error: "NO_LOGIN",
    }
  const html = await response.text()
  try {
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
  } catch (error) {
    return {
      error: "PARSING_ERROR",
    }
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

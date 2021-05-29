import { computed, reactive } from "vue"
import ky from "ky"
import { parallelMap } from "@/utilities/Parallel"
import {
  Book,
  addBooks,
  books,
  updateBookDetail,
  Tag,
  addSeries,
  addTags,
  series,
  updateSeriesBookCount,
  setBookNotFound,
} from "./Repository"
import { Result, tryInvokeAsync, tryInvokeSync } from "@/utilities/Try"
import { pushNotification } from "@/services/NotificationService"

const domParser = new DOMParser()

type PARSING_ERROR = "PARSING_ERROR"
type NO_LOGIN = "NO_LOGIN"
type HTTP_ERROR = "HTTP_ERROR"
type NOT_FOUND = "NOT_FOUND"

const state = reactive({
  loading: false,
  loadingMessage: null as { msg: string; error?: boolean } | null,
})

export const loading = computed(() => state.loading)
export const loadingMessage = computed(() => state.loadingMessage)

export async function collect() {
  if (state.loading) return
  state.loading = true

  const page1Result = await fetchAvailableBooksPage(1)
  if (page1Result.error) {
    if (page1Result.error === "NO_LOGIN")
      pushNotification(
        "解析藏書失敗！請檢查是否已登入 Book Walker 網站。",
        "ERROR"
      )
    if (page1Result.error === "PARSING_ERROR")
      pushNotification(
        "解析藏書失敗！請檢查 Book Walker 網站是否正常，或其版面改版需要更新助手。",
        "ERROR"
      )
    state.loading = false
    state.loadingMessage = null
    return
  }

  const { doc, books: page1Books } = page1Result.value

  await addBooks(page1Books!)
  const bookCountResult = parseBookPageCount(doc!)
  if (bookCountResult.error) {
    pushNotification(
      "解析藏書總數失敗！請檢查 Book Walker 網站是否正常，或其版面改版需要更新助手。",
      "ERROR"
    )
    state.loading = false
    state.loadingMessage = null
    return
  }

  state.loadingMessage = {
    msg: `藏書資料載入中 1 / ${bookCountResult.value}`,
  }
  const bookPages = Array.from(
    { length: bookCountResult.value! - 1 },
    (_, i) => i + 2
  )
  await parallelMap(
    bookPages,
    async page => {
      const pageReulst = await fetchAvailableBooksPage(page)
      if (pageReulst.error) {
        pushNotification(`載入藏書頁 ${page} 失敗`, "ERROR")
        return
      }
      await addBooks(pageReulst.value.books)
    },
    5,
    done => {
      state.loadingMessage = {
        msg: `藏書資料載入中 ${done + 1} / ${bookCountResult.value}`,
      }
    }
  )

  const bookLackDetails = books.value.filter(
    book => !book.seriesIdChecked || !book.tagsChecked || !book.writerChecked
  )
  const bookLackDetailCount = bookLackDetails.length

  await parallelMap(
    bookLackDetails,
    async book => {
      const bookDetailResult = await fetchBookDetail(book.id)
      if (bookDetailResult.error === "NOT_FOUND") {
        setBookNotFound(book.id, true)
        return
      }
      if (bookDetailResult.error) {
        pushNotification(
          `書本 ${book.name} 解析詳細資料失敗！請檢查 Book Walker 網站是否正常，或其版面改版需要更新助手。`,
          "ERROR"
        )
        return
      }
      const { seriesId, seriesName, tags, writers } = bookDetailResult.value
      if (seriesId) await addSeries(seriesId, seriesName!)
      await addTags(tags)
      await updateBookDetail(
        book.id,
        seriesId,
        tags.map(t => t.id),
        writers
      )
    },
    5,
    done => {
      state.loadingMessage = {
        msg: `書本詳細資料載入中 ${done} / ${bookLackDetailCount}`,
      }
    }
  )

  const seriesCount = series.value.length
  await parallelMap(
    series.value,
    async s => {
      const seriesResult = await fetchSeries(s.id)
      if (seriesResult.error) {
        pushNotification(
          `系列 ${s.name} 解析資料失敗！請檢查 Book Walker 網站是否正常，或其版面改版需要更新助手。`,
          "ERROR"
        )
        return
      }
      await updateSeriesBookCount(s.id, seriesResult.value.bookCount)
    },
    5,
    done => {
      state.loadingMessage = {
        msg: `系列資料載入中 ${done} / ${seriesCount}`,
      }
    }
  )

  state.loading = false
  state.loadingMessage = null
}

async function fetchAvailableBooksPage(
  page: number
): Promise<
  Result<
    {
      doc: Document
      books: Book[]
    },
    NO_LOGIN | PARSING_ERROR
  >
> {
  try {
    const response = await ky.get(
      `https://www.bookwalker.com.tw/member/available_book_list?page=${page}`
    )
    if (response.redirected)
      return {
        error: "NO_LOGIN",
      }
    const html = await response.text()
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
      }
    })
    return {
      value: {
        doc,
        books,
      },
    }
  } catch (error) {
    console.error(`獲取藏書頁 ${page} 錯誤`, error)
    return {
      error: "PARSING_ERROR",
    }
  }
}

function parseBookPageCount(doc: Document): Result<number, PARSING_ERROR> {
  const parseResult = tryInvokeSync(() =>
    parseInt(
      doc.getElementsByClassName("bw_pagination")[0].lastElementChild!
        .previousElementSibling!.firstElementChild!.innerHTML
    )
  )
  if (!parseResult.error) return parseResult
  console.error(`解析藏書總量失敗`, doc, parseResult.error.catched)
  return {
    error: "PARSING_ERROR",
  }
}

async function fetchBookDetail(
  id: number
): Promise<
  Result<
    {
      seriesId: number | null
      seriesName: string | null
      tags: Tag[]
      writers: string[]
    },
    PARSING_ERROR | HTTP_ERROR | NOT_FOUND
  >
> {
  const html = await tryInvokeAsync(() =>
    ky.get(`https://www.bookwalker.com.tw/product/${id}`).text()
  )
  if (html.error) {
    console.error(`獲取書本${id}詳細資料時發生網路錯誤`, html.error.catched)
    return {
      error: "HTTP_ERROR",
    }
  }
  const doc = domParser.parseFromString(html.value, "text/html")

  const parseResult = tryInvokeSync(() => {
    const seriesAnchor = doc.getElementById("breadcrumb_list")!
      .firstElementChild!.lastElementChild!.previousElementSibling!
      .firstElementChild! as HTMLAnchorElement
    const isSeries = seriesAnchor.href.includes("/search/?series=")
    const seriesId = isSeries
      ? parseInt(
          new URL(
            seriesAnchor.href,
            "https://www.bookwalker.com.tw"
          ).searchParams.get("series")!
        )
      : null
    const seriesName = seriesAnchor.innerHTML.substring(
      0,
      seriesAnchor.innerHTML.length - 2
    )

    const writers = Array.from(
      doc.getElementById("writerinfo")!.getElementsByTagName("a")
    ).map(a => a.innerHTML)

    const bookinfo_more = doc.getElementsByClassName("bookinfo_more")[0]!
    const tags = Array.from(bookinfo_more.getElementsByTagName("a"))
      .filter(a => a.href.includes("/search?tag="))
      .map(
        a =>
          <Tag>{
            id: parseInt(
              new URL(a.href, "https://www.bookwalker.com.tw").searchParams.get(
                "tag"
              )!
            ),
            name: a.innerHTML,
          }
      )
    return {
      seriesId,
      seriesName,
      tags,
      writers,
    }
  })

  if (!parseResult.error) return parseResult

  const check404 = tryInvokeSync(() =>
    Array.from(doc.head.getElementsByTagName("meta"))
      .find(m => m.name === "keywords")!
      .content.includes("404")
  )
  if (!check404.error && check404.value)
    return {
      error: "NOT_FOUND",
    }
  return {
    error: "PARSING_ERROR",
  }
}

async function fetchSeries(
  id: number
): Promise<
  Result<
    {
      bookCount: number
    },
    PARSING_ERROR
  >
> {
  try {
    const html = await ky
      .get(`https://www.bookwalker.com.tw/search?series=${id}`)
      .text()
    const doc = domParser.parseFromString(html, "text/html")
    const paginationInfo = doc.getElementsByClassName("bw_more")[0].innerHTML!
    const count = parseInt(paginationInfo.match(/共(\d+)筆/)![1])
    return {
      value: {
        bookCount: count,
      },
    }
  } catch (error) {
    console.error(`獲取系列 ${id} 的詳細資料發生例外`, error)
    return {
      error: "PARSING_ERROR",
    }
  }
}

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
} from "./Repository"

const domParser = new DOMParser()

const state = reactive({
  loading: false,
  loadingMessage: null as { msg: string; error?: boolean } | null,
})

export const loading = computed(() => state.loading)
export const loadingMessage = computed(() => state.loadingMessage)

export async function collect() {
  if (state.loading) return
  state.loading = true

  const { doc, books: page1Books, error } = await fetchBooks(1)
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

  const bookPageCount = parseBookPageCount(doc!)
  await addBooks(page1Books!)

  state.loadingMessage = {
    msg: `藏書資料載入中 1 / ${bookPageCount}`,
  }
  const bookPages = Array.from({ length: bookPageCount - 1 }, (_, i) => i + 2)
  const fetchBooksResults = await parallelMap(
    bookPages,
    async page => {
      const { books, error } = await fetchBooks(page)
      if (!!error) return error
      await addBooks(books!)
      return null
    },
    5,
    done => {
      state.loadingMessage = {
        msg: `藏書資料載入中 ${done + 1} / ${bookPageCount}`,
      }
    }
  )

  if (fetchBooksResults.some(error => error !== null)) {
    state.loadingMessage = {
      msg: `解析藏書有部分失敗！請重試。`,
      error: true,
    }
    return
  }

  const bookLackDetails = books.value.filter(
    book => !book.seriesIdChecked || !book.tagsChecked || !book.writerChecked
  )
  const bookLackDetailCount = bookLackDetails.length

  await parallelMap(
    bookLackDetails,
    async book => {
      const { seriesId, seriesName, tags, writers } = await fetchBookDetail(
        book.id
      )
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
      const { bookCount } = await fetchSeries(s.id)
      await updateSeriesBookCount(s.id, bookCount)
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

async function fetchBooks(
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
      }
    })
    return {
      doc,
      books,
    }
  } catch (error) {
    console.error("解析藏書錯誤", error)
    return {
      error: "PARSING_ERROR",
    }
  }
}

function parseBookPageCount(doc: Document) {
  return parseInt(
    doc.getElementsByClassName("bw_pagination")[0].lastElementChild!
      .previousElementSibling!.firstElementChild!.innerHTML
  )
}

async function fetchBookDetail(
  id: number
): Promise<{
  seriesId: number | null
  seriesName: string | null
  tags: Tag[]
  writers: string[]
}> {
  const html = await ky
    .get(`https://www.bookwalker.com.tw/product/${id}`)
    .text()
  const doc = domParser.parseFromString(html, "text/html")
  try {
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
  } catch (error) {
    console.error(
      "解析詳細資料錯誤",
      doc,
      doc.getElementById("breadcrumb_list")
    )
    throw error
  }
}

async function fetchSeries(
  id: number
): Promise<{
  bookCount: number
}> {
  const html = await ky
    .get(`https://www.bookwalker.com.tw/search?series=${id}`)
    .text()
  const doc = domParser.parseFromString(html, "text/html")
  const paginationInfo = doc.getElementsByClassName("bw_more")[0].innerHTML!
  const count = parseInt(paginationInfo.match(/共(\d+)筆/)![1])
  return {
    bookCount: count,
  }
}

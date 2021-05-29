import { computed, reactive } from "vue"
import { Lock } from "@/utilities/Lock"
import { debounce } from "lodash"

export interface Book {
  id: number
  name: string
  seriesIdChecked?: boolean
  seriesId?: number | null
  tagsChecked?: boolean
  tags?: number[]
  writerChecked?: boolean
  writer?: string[]
  favorite?: boolean
  bookmark?: boolean
  notFound?: boolean
}

export interface Series {
  id: number
  name: string
  top?: boolean
  bookCount?: number
}

export interface Tag {
  id: number
  name: string
}

const BOOK_TABLE = "books"
const SERIES_TABLE = "series"
const TAG_TABLE = "tags"

const state = reactive({
  books: JSON.parse(localStorage.getItem(BOOK_TABLE) ?? "[]") as Book[],
  series: JSON.parse(localStorage.getItem(SERIES_TABLE) ?? "[]") as Series[],
  tags: JSON.parse(localStorage.getItem(TAG_TABLE) ?? "[]") as Tag[],
})

export const books = computed(() => state.books)
export const series = computed(() => state.series)
export const tags = computed(() => state.tags)

const saveBooks = debounce(() => {
  localStorage.setItem(BOOK_TABLE, JSON.stringify(state.books))
}, 100)

const writeBookLock = new Lock()

export async function addBooks(books: Book[]) {
  await writeBookLock.acquireAsync()
  books.forEach(book => {
    const found = state.books.find(b => b.id === book.id)
    if (found) return
    state.books.push(book)
    return
  })
  writeBookLock.release()
  saveBooks()
}

export async function updateBookDetail(
  bookId: number,
  seriesId: number | null,
  tags: number[],
  writers: string[]
) {
  const found = state.books.find(b => b.id === bookId)
  if (!found) return
  await writeBookLock.acquireAsync()
  found.seriesId = seriesId
  found.seriesIdChecked = true
  found.tags = tags
  found.tagsChecked = true
  found.writer = writers
  found.writerChecked = true
  writeBookLock.release()
  saveBooks()
}

export async function setBookNotFound(bookId: number, notFound: boolean) {
  const found = state.books.find(b => b.id === bookId)
  if (!found) return
  await writeBookLock.acquireAsync()
  found.notFound = notFound
  writeBookLock.release()
  saveBooks()
}

export async function switchFavorite(bookId: number) {
  const found = state.books.find(book => book.id == bookId)
  if (!found) return
  await writeBookLock.acquireAsync()
  found.favorite = !found.favorite
  writeBookLock.release()
  saveBooks()
}

export async function switchBookmark(bookId: number) {
  const found = state.books.find(book => book.id == bookId)
  if (!found) return
  await writeBookLock.acquireAsync()
  found.bookmark = !found.bookmark
  writeBookLock.release()
  saveBooks()
}

const saveSeries = debounce(() => {
  localStorage.setItem(SERIES_TABLE, JSON.stringify(state.series))
}, 100)
const writeSeriesLock = new Lock()

export async function addSeries(id: number, name: string) {
  await writeSeriesLock.acquireAsync()
  const found = state.series.find(s => s.id == id)
  if (!found) state.series.push({ id, name, top: false })
  writeSeriesLock.release()
  saveSeries()
}

export async function switchTopSeries(id: number) {
  const found = state.series.find(s => s.id == id)
  if (!found) return
  await writeSeriesLock.acquireAsync()
  found.top = !found.top
  writeSeriesLock.release()
  saveSeries()
}

export async function updateSeriesBookCount(id: number, count: number) {
  const found = state.series.find(s => s.id == id)
  if (!found) return
  await writeSeriesLock.acquireAsync()
  found.bookCount = count
  writeSeriesLock.release()
  saveSeries()
}

const saveTags = debounce(() => {
  localStorage.setItem(TAG_TABLE, JSON.stringify(state.tags))
}, 100)
const writeTagsLock = new Lock()

export async function addTags(tags: Tag[]) {
  await writeTagsLock.acquireAsync()
  tags.forEach(tag => {
    const found = state.tags.find(t => t.id === tag.id)
    if (found) return
    state.tags.push(tag)
    return
  })
  writeTagsLock.release()
  saveTags()
}

export async function clear() {
  await writeBookLock.acquireAsync()
  await writeSeriesLock.acquireAsync()
  await writeTagsLock.acquireAsync()
  state.books = []
  state.series = []
  state.tags = []
  writeTagsLock.release()
  writeSeriesLock.release()
  writeBookLock.release()
  saveBooks()
  saveSeries()
  saveTags()
}

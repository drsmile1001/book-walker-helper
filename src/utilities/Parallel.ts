/** 平行映射來源 */
export async function parallelMap<TSource, TResult>(
  /** 來源集合 */
  sources: TSource[],
  /** 映射函數 */
  mapper: (item: TSource) => Promise<TResult>,
  /** 同時執行數量 */
  workerLimit = 5,
  /** 完成進度通知 */
  onDownloadProgress?: (done: number) => any
): Promise<TResult[]> {
  const results = [] as TResult[]
  let queue = sources.map(item => item)
  async function work() {
    while (true) {
      const item = queue.shift()
      if (!item) break
      const result = await mapper(item)
      results.push(result)
      if (onDownloadProgress) {
        new Promise(resolve => {
          try {
            onDownloadProgress(results.length)
          } catch {}
          resolve(undefined)
        })
      }
    }
  }
  const workers = []
  for (let worker = 0; worker < workerLimit; worker++) {
    workers.push(work())
  }

  await Promise.all(workers)
  return results
}

export type Result<TSuccess, TError> =
  | { value: TSuccess; error?: never }
  | { value?: never; error: TError }

export function tryInvokeSync<TResult>(
  fun: () => TResult
): Result<TResult, { catched: any }> {
  try {
    return {
      value: fun(),
    }
  } catch (catched) {
    return {
      error: {
        catched: catched,
      },
    }
  }
}

export async function tryInvokeAsync<TResult>(
  fun: () => Promise<TResult>
): Promise<Result<TResult, { catched: any }>> {
  try {
    const value = await fun()
    return {
      value,
    }
  } catch (catched) {
    return {
      error: {
        catched,
      },
    }
  }
}

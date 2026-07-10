"use client"

import { Provider } from "react-redux"
import { store } from "@workspace/store"

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>
}

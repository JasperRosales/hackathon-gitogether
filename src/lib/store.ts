import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Catalogue, Product } from "./catalogue"

export type SessionState = { name: string; email: string; role: "customer" | "merchant" } | null

const uiSlice = createSlice({
  name: "ui",
  initialState: { toast: "" },
  reducers: {
    setToast(state, action: PayloadAction<string>) {
      state.toast = action.payload
    },
    clearToast(state) {
      state.toast = ""
    },
  },
})

const sessionSlice = createSlice({
  name: "session",
  initialState: null as SessionState,
  reducers: {
    setSession(_state, action: PayloadAction<NonNullable<SessionState>>) {
      return action.payload
    },
    clearSession() {
      return null
    },
  },
})

type CatalogueState = Catalogue
const catalogueSlice = createSlice({
  name: "catalogue",
  initialState: { products: [] as Product[], source: "Sample", updatedAt: "" } as CatalogueState,
  reducers: {
    setCatalogue(_state, action: PayloadAction<Catalogue>) {
      return action.payload
    },
  },
})

type ShopState = {
  builderMode: "single" | "bundle"
  category: string
  search: string
}
const shopSlice = createSlice({
  name: "shop",
  initialState: { builderMode: "bundle", category: "All", search: "" } as ShopState,
  reducers: {
    setBuilderMode(state, action: PayloadAction<ShopState["builderMode"]>) {
      state.builderMode = action.payload
    },
    setCategory(state, action: PayloadAction<string>) {
      state.category = action.payload
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload
    },
  },
})

export const { setToast, clearToast } = uiSlice.actions
export const { setSession, clearSession } = sessionSlice.actions
export const { setCatalogue } = catalogueSlice.actions
export const { setBuilderMode, setCategory, setSearch } = shopSlice.actions

export const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    session: sessionSlice.reducer,
    catalogue: catalogueSlice.reducer,
    shop: shopSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

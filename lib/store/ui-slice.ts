import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Id } from "@/convex/_generated/dataModel";

export type CryptoMethod = "direct" | "escrow" | "stablecoin" | "sph2";
export type ProductTypeFilter = "physical" | "digital" | null;

type UiState = {
  cartOpen: boolean;
  productCategoryId: Id<"categories"> | null;
  productType: ProductTypeFilter;
  cryptoMethod: CryptoMethod;
};

const initialState: UiState = {
  cartOpen: false,
  productCategoryId: null,
  productType: null,
  cryptoMethod: "direct",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setCartOpen(state, action: PayloadAction<boolean>) {
      state.cartOpen = action.payload;
    },
    setProductCategory(
      state,
      action: PayloadAction<Id<"categories"> | null>
    ) {
      state.productCategoryId = action.payload;
    },
    setProductType(state, action: PayloadAction<ProductTypeFilter>) {
      state.productType = action.payload;
    },
    setCryptoMethod(state, action: PayloadAction<CryptoMethod>) {
      state.cryptoMethod = action.payload;
    },
  },
});

export const {
  setCartOpen,
  setProductCategory,
  setProductType,
  setCryptoMethod,
} = uiSlice.actions;

export const uiReducer = uiSlice.reducer;

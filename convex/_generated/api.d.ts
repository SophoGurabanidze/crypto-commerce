/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as cart from "../cart.js";
import type * as categories from "../categories.js";
import type * as crypto from "../crypto.js";
import type * as email from "../email.js";
import type * as emailLog from "../emailLog.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as lib_helpers from "../lib/helpers.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";
import type * as reviews from "../reviews.js";
import type * as search from "../search.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";
import type * as wishlists from "../wishlists.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  cart: typeof cart;
  categories: typeof categories;
  crypto: typeof crypto;
  email: typeof email;
  emailLog: typeof emailLog;
  files: typeof files;
  http: typeof http;
  "lib/helpers": typeof lib_helpers;
  orders: typeof orders;
  products: typeof products;
  reviews: typeof reviews;
  search: typeof search;
  stripe: typeof stripe;
  users: typeof users;
  wishlists: typeof wishlists;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

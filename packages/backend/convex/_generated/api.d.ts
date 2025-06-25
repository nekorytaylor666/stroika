/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as constructionProjects from "../constructionProjects.js";
import type * as constructionTasks from "../constructionTasks.js";
import type * as constructionTeams from "../constructionTeams.js";
import type * as departments_mutations from "../departments/mutations.js";
import type * as departments_queries from "../departments/queries.js";
import type * as departments_seed from "../departments/seed.js";
import type * as healthCheck from "../healthCheck.js";
import type * as metadata from "../metadata.js";
import type * as migrations_cleanupUsers from "../migrations/cleanupUsers.js";
import type * as migrations_migrateUsersToRoleId from "../migrations/migrateUsersToRoleId.js";
import type * as permissions_constants from "../permissions/constants.js";
import type * as permissions_hierarchy from "../permissions/hierarchy.js";
import type * as permissions_seed from "../permissions/seed.js";
import type * as permissions_types from "../permissions/types.js";
import type * as permissions_utils from "../permissions/utils.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";
import type * as todos from "../todos.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  constructionProjects: typeof constructionProjects;
  constructionTasks: typeof constructionTasks;
  constructionTeams: typeof constructionTeams;
  "departments/mutations": typeof departments_mutations;
  "departments/queries": typeof departments_queries;
  "departments/seed": typeof departments_seed;
  healthCheck: typeof healthCheck;
  metadata: typeof metadata;
  "migrations/cleanupUsers": typeof migrations_cleanupUsers;
  "migrations/migrateUsersToRoleId": typeof migrations_migrateUsersToRoleId;
  "permissions/constants": typeof permissions_constants;
  "permissions/hierarchy": typeof permissions_hierarchy;
  "permissions/seed": typeof permissions_seed;
  "permissions/types": typeof permissions_types;
  "permissions/utils": typeof permissions_utils;
  seed: typeof seed;
  seedData: typeof seedData;
  todos: typeof todos;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

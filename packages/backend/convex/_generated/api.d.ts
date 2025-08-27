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
import type * as activities from "../activities.js";
import type * as attachments_projectAttachments from "../attachments/projectAttachments.js";
import type * as attachments_queries from "../attachments/queries.js";
import type * as auth from "../auth.js";
import type * as cleanup from "../cleanup.js";
import type * as clear from "../clear.js";
import type * as comments from "../comments.js";
import type * as constructionProjects from "../constructionProjects.js";
import type * as constructionTasks from "../constructionTasks.js";
import type * as constructionTeams from "../constructionTeams.js";
import type * as debug from "../debug.js";
import type * as debugAuth from "../debugAuth.js";
import type * as departments_mutations from "../departments/mutations.js";
import type * as departments_queries from "../departments/queries.js";
import type * as departments from "../departments.js";
import type * as devHelpers from "../devHelpers.js";
import type * as documentTasks from "../documentTasks.js";
import type * as documents from "../documents.js";
import type * as emailActions from "../emailActions.js";
import type * as files from "../files.js";
import type * as globalSearch from "../globalSearch.js";
import type * as healthCheck from "../healthCheck.js";
import type * as helpers_getCurrentUser from "../helpers/getCurrentUser.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as issueComments from "../issueComments.js";
import type * as issueNotifications from "../issueNotifications.js";
import type * as labels from "../labels.js";
import type * as metadata from "../metadata.js";
import type * as migrations_cleanupUsers from "../migrations/cleanupUsers.js";
import type * as migrations_migrateUsersToRoleId from "../migrations/migrateUsersToRoleId.js";
import type * as notifications from "../notifications.js";
import type * as notificationsAction from "../notificationsAction.js";
import type * as organizationMembers from "../organizationMembers.js";
import type * as organizations from "../organizations.js";
import type * as passwordReset from "../passwordReset.js";
import type * as permissions_checks from "../permissions/checks.js";
import type * as permissions_constants from "../permissions/constants.js";
import type * as permissions_hierarchy from "../permissions/hierarchy.js";
import type * as permissions_memberManagement from "../permissions/memberManagement.js";
import type * as permissions_projectAccess from "../permissions/projectAccess.js";
import type * as permissions_queries from "../permissions/queries.js";
import type * as permissions_roles from "../permissions/roles.js";
import type * as permissions_types from "../permissions/types.js";
import type * as permissions_utils from "../permissions/utils.js";
import type * as quickSetup from "../quickSetup.js";
import type * as roles from "../roles.js";
import type * as seedDatabase from "../seedDatabase.js";
import type * as subtasks from "../subtasks.js";
import type * as teams from "../teams.js";
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
  activities: typeof activities;
  "attachments/projectAttachments": typeof attachments_projectAttachments;
  "attachments/queries": typeof attachments_queries;
  auth: typeof auth;
  cleanup: typeof cleanup;
  clear: typeof clear;
  comments: typeof comments;
  constructionProjects: typeof constructionProjects;
  constructionTasks: typeof constructionTasks;
  constructionTeams: typeof constructionTeams;
  debug: typeof debug;
  debugAuth: typeof debugAuth;
  "departments/mutations": typeof departments_mutations;
  "departments/queries": typeof departments_queries;
  departments: typeof departments;
  devHelpers: typeof devHelpers;
  documentTasks: typeof documentTasks;
  documents: typeof documents;
  emailActions: typeof emailActions;
  files: typeof files;
  globalSearch: typeof globalSearch;
  healthCheck: typeof healthCheck;
  "helpers/getCurrentUser": typeof helpers_getCurrentUser;
  http: typeof http;
  invites: typeof invites;
  issueComments: typeof issueComments;
  issueNotifications: typeof issueNotifications;
  labels: typeof labels;
  metadata: typeof metadata;
  "migrations/cleanupUsers": typeof migrations_cleanupUsers;
  "migrations/migrateUsersToRoleId": typeof migrations_migrateUsersToRoleId;
  notifications: typeof notifications;
  notificationsAction: typeof notificationsAction;
  organizationMembers: typeof organizationMembers;
  organizations: typeof organizations;
  passwordReset: typeof passwordReset;
  "permissions/checks": typeof permissions_checks;
  "permissions/constants": typeof permissions_constants;
  "permissions/hierarchy": typeof permissions_hierarchy;
  "permissions/memberManagement": typeof permissions_memberManagement;
  "permissions/projectAccess": typeof permissions_projectAccess;
  "permissions/queries": typeof permissions_queries;
  "permissions/roles": typeof permissions_roles;
  "permissions/types": typeof permissions_types;
  "permissions/utils": typeof permissions_utils;
  quickSetup: typeof quickSetup;
  roles: typeof roles;
  seedDatabase: typeof seedDatabase;
  subtasks: typeof subtasks;
  teams: typeof teams;
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

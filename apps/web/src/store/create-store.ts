import { create as zustandCreate } from "zustand";

// Custom create function that wraps zustand's create
// This helps avoid potential compatibility issues with React 19
export const create = zustandCreate;

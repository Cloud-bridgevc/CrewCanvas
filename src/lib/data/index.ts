import "server-only";
import { memoryRepository } from "./memory";
import { postgresRepository } from "./postgres";
import type { Repository } from "./repository";

export const repo: Repository = process.env.DATA_SOURCE === "postgres" ? postgresRepository : memoryRepository;
export const dataSource = process.env.DATA_SOURCE === "postgres" ? "PostgreSQL" : "In-memory demo data";

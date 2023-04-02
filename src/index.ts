#!/usr/bin/env node
import Cuby from "./bin/cuby";

const cuby = new Cuby();

cuby.interpreInput();

export { PoolConnection } from "./core/mysql/database.mysql";
export { Model } from "./core/mysql/models/model";
#!/usr/bin/env node
import { Cuby } from "./cuby";

const cuby = new Cuby();

const main = async () => {
    try {
        await cuby.interpreInput();
    } catch (error: any) {
        console.log(error.message);
    }
}

main();
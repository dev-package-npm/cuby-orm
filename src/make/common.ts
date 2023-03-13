import { exec } from 'node:child_process';
import readLine from 'readline';

export abstract class Common {

    public replaceAll(data: string, key: '-' | '_' | ' ') {
        let value = this.getIndexSeparator(data).separator;
        for (const item of value) {
            if (item != key) {
                data = data.replaceAll(item, key);
            }
        }
        return data;
    }

    public getIndexSeparator(data: string): { separator: string[], index: number[] } {
        let key = ['-', ' ', '_'];
        let result: { separator: string[], index: number[] } = { separator: [], index: [] };
        for (let index = 0; index < key.length; index++) {
            let indexSearch = data.indexOf(key[index]);
            while (indexSearch !== -1) {
                result.index.push(indexSearch);
                result.separator.push(key[index])
                indexSearch = data.indexOf(key[index], indexSearch + 1);
            }
        }
        return result;
    }

    // 
    public addPrefix(input: string, prefix: 'Model' | 'Seed' | 'Migration') {
        input = input.replace(/[-_]+(.)?/g, (match: string, char: string) => {
            if (char) {
                return char.toUpperCase();
            } else {
                return '';
            }
        });

        return `${input}${prefix}`;
    }

    async isExistsWord(rl: readLine.Interface, words: Array<string>): Promise<boolean> {
        for await (const line of rl) {
            for (let index = 0; index < words.length; index++) {
                if (line.includes(words[index].replaceAll('\n', '')) != false) {
                    return true;
                }
            }
        }
        return false;
    }

    protected executeTerminal(params: string): Promise<string> {
        return new Promise((resovle, rejects) => {
            exec(params, (error, stdout, stderr) => {
                if (error != null)
                    rejects(new Error(String(error)));
                if (stderr != '')
                    rejects(new Error(String(stderr)));
                resovle(stdout);
            });
        });
    }
}
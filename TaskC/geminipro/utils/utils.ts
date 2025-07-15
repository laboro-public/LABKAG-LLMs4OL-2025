export function chunkArray<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }

    return result;
}

export function mergeObjects(obj1: Record<string, string[]>, obj2: Record<string, string[]>): Record<string, string[]> {
    const result: Record<string, string[]> = { ...obj1 }

    for (const key in obj2) {
        if (result[key]) {
            result[key] = [...result[key], ...obj2[key]] // combine arrays
        } else {
            result[key] = obj2[key] // add new category
        }
    }

    return result
}

export function convertStringToJson(input: string): { parent: string; child: string }[] {
    const rawArray = input
        .trim()
        .replace(/^"|"$/g, '') // trim leading/trailing quote
        .split('",\n"')

    const pairs: { parent: string; child: string }[] = []

    for (const line of rawArray) {
        const cleaned = line.replace(/^"|"$/g, '').trim()
        const [parentRaw, childRaw] = cleaned.split('>')

        const parent = parentRaw?.trim()
        const child = childRaw?.trim()

        // Filter out noise
        if (
            parent &&
            child &&
            parent !== child
        ) {
            pairs.push({ parent, child })
        }
    }

    return pairs;
}

module.exports = {
    chunkArray,
    mergeObjects,
    convertStringToJson
}
import { Relation } from '../types/relation'

export function createParentChildPrompt(terms: string[], previous: Relation[] = []): string {
    const previousJSON = previous.map(r => JSON.stringify(r)).join(',\n')

    return `
                You are given a list of foodON terms.

                Your task is to identify hierarchical relationships between terms — where one is a more general "parent" and the other is a more specific "child".
                Analyze EVERY term and identify SPECIFIC "is-a" relationships.

                ### STRICT INSTRUCTIONS:
                - You MUST ONLY use terms from the provided list.
                - Every "parent" and every "child" MUST be from the list. Do NOT invent new terms.
                - Do NOT duplicate or reverse relations.
                - Do NOT include explanations or markdown.
                - Respond ONLY with a String format (no markdown, explanation, or formatting).
                - Preserve spacing and formatting as-is.

                ## FORMAT:
                "TERM_FROM_LIST>TERM_FROM_LIST",
                "TERM_FROM_LIST>TERM_FROM_LIST"

                ${previous.length > 0 ? `## Previously discovered terms you can use as parents or children:\n${previousJSON}` : ''}

                EXAMPLES:
                    "Intangible>JobPosting",
                    "CreativeWork>Menu"

                ## TERMS:
                - ${terms.join('\n- ')}
                `.trim()
}

export function createGeneralCategoryPrompt(terms: string[]): string  {
    return `
        You are a categorization assistant.

        Classify the following scientific terms into high-level parent categories. Use only from the following standardized parent categories:

                - Medicine
                - Physics
                - Chemistry
                - Biology
                - Engineering
                - Science
                - Other

        ### INSTRUCTIONS:

        - Given a list of (term, fine-grained category) pairs, your task is to:
        1. Group similar categories together into broader, higher-level categories.
        2. Assign each term to its new minimized category.
        - Return only a **JSON object** where:
        - Each key is a minimized category.
        - Each value is an array of terms that belong to that category.
        - Do not invent new terms. Only regroup the existing categories.
        - If a term does not clearly fit a category, place it under "Other".

        ---

        ### FORMAT:
        json
        {
            "Minimized Category A": ["term1", "term2", ...],
            "Minimized Category B": ["term3", "term4", ...]
        }

        ### TERMS:
        - ${terms.join('\n- ')}

        ### RESPONSE FORMAT:
        Valid JSON array only. No markdown.
    `.trim()
}

module.exports = {
    createParentChildPrompt,
    createGeneralCategoryPrompt
}
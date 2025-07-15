import { GoogleGenerativeAI } from '@google/generative-ai'
import { chunkArray, mergeObjects, convertStringToJson } from './utils'
import { Relation } from '../types/relation'
import { createParentChildPrompt, createGeneralCategoryPrompt } from './prompt'

const API_KEY = '<omit>'
const genAI = new GoogleGenerativeAI(API_KEY)

async function getRelations(prompt: string): Promise<string> {
    const result = await genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        generationConfig: {
            temperature: 0.1,
            topK: 3,
            topP: 0.9
        }
    }).generateContent(prompt)

    const text: string = result.response.text()
                            .replace(/```json/g, '')
                            .replace(/```/g, '')
                            .trim();

    return text
}

export async function processByCategory(data: string) {
    const arrayData = data.split('\n')
    const chunks = chunkArray(arrayData, 200)
    let allRelations: any = {}

    for (let i=0; i<chunks.length; i++) {
        const prompt = createGeneralCategoryPrompt(chunks[i])

        try {
            const newRelations: string = await getRelations(prompt)
            
            if(JSON.parse(newRelations)) {
                allRelations = mergeObjects(allRelations, JSON.parse(newRelations))
            }
        } catch (err: any) {
            console.warn(`⚠️ Category Chunk ${i+1} failed: ${err.message}`)
        }
    }
    return allRelations
}

export async function processGetParentChildFromCategory(data: string) {
    const arrayData = JSON.parse(data)
    let allRelations: Relation[] = []
    const keyList = Object.keys(arrayData)
    
    for(let keyNum=0; keyNum<keyList.length-1; keyNum++) {
        let key = keyList[keyNum]
        let combineData = [...arrayData[key], ...arrayData['Other']]
        const chunks:any = chunkArray(combineData, 200)

        for(let i=0; i<chunks.length; i++) {
            try {
                const memory = allRelations
                const prompt: string = createParentChildPrompt(chunks[i], memory)
                const newRelations = await getRelations(prompt)
                const convertToJson = convertStringToJson(newRelations)
                
                if(typeof convertToJson == 'object') {
                    allRelations = [...allRelations, ...convertToJson]
                }
            } catch (err: any) {
                console.warn(`⚠️ Parent-Child Chunk ${i} failed: ${err.message}`)
            }
        }
    }
    return allRelations
}

module.exports = {
    processByCategory,
    processGetParentChildFromCategory
}
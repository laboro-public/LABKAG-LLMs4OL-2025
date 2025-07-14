import { Request, Response } from 'express'
import { processByCategory, processGetParentChildFromCategory } from '../utils/llm_model'
import { promises as fs } from 'fs'
import path from 'path'

export const getGeminiResult = async (request: Request, response: Response) => {
    const { taskGroup } = request.params
    const inputTextTypePath = path.join(__dirname, '..', 'data', taskGroup, 'train_data.txt')
    const categoryPath = path.join(__dirname, '..', 'data', taskGroup, 'category.txt')
    const data = await fs.readFile(inputTextTypePath, 'utf-8')

    try {
        const result = await processByCategory(data)
        await fs.writeFile(categoryPath, JSON.stringify(result, null, 2))

        response
            .contentType('application/json')
            .status(200)
            .json({
                code: 200,
                message: 'Okay'
            })
    } catch (parseError: any) {
        response
            .contentType('application/json')
            .status(400)
            .json({
                status: 400,
                message: parseError
            })
    }
}

export const getParentChild = async (request: Request, response: Response) => {
    const { taskGroup } = request.params
    const categoryPath = path.join(__dirname, '..', 'data', taskGroup, 'category.txt')
    const file = path.join(__dirname, '..', 'data', taskGroup, 'isArelationship.json')
    const data = await fs.readFile(categoryPath, 'utf-8')
    try {
        const result = await processGetParentChildFromCategory(data)
        await fs.writeFile(file, JSON.stringify(result, null, 2))

        response
            .contentType('application/json')
            .status(200)
            .json({
                code: 200,
                message: 'Okay'
            })
    } catch (parseError: any) {
        response
            .contentType('application/json')
            .status(400)
            .json({
                status: 400,
                message: parseError
            })
    }
}

module.exports = {
    getGeminiResult,
    getParentChild
}
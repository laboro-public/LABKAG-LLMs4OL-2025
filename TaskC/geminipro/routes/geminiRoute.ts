import express from 'express'
import { getGeminiResult, getParentChild } from '../controllers/geminiController'

const router = express.Router()

router.get('/category/:taskGroup', getGeminiResult)
router.get('/parent-child/:taskGroup', getParentChild)

export default router
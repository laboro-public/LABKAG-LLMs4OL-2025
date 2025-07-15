import express, { NextFunction, Request, Response } from 'express'
import cors from 'cors'

import geminiRoute from './routes/geminiRoute'

const port = 8080

const app = express()

const myMiddleware = (req: Request, res: Response, next: NextFunction) => {
    next()
}
 
app.use(myMiddleware)
app.use(cors())
app.use(express.json())

app.use('/gemini', geminiRoute)

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})
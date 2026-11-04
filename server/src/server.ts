import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/error'
import routes from './routes'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', routes)

app.use(errorHandler)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`StarCoreWeb server running on port ${PORT}`)
})

export default app
require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Contact = require('./models/persons')

const requestLogger = (request, response, next) => {
    console.log('Method:', request.method)
    console.log('Path:  ', request.path)
    console.log('Body:  ', request.body)
    console.log('---')
    next()
  }
  
const app = express()
app.use(express.static('dist'))
app.use(cors())
app.use(express.json())
app.use(morgan(':method :url :body'))
app.use(requestLogger)

morgan.token('body', req => {
    return JSON.stringify(req.body)
  })
  
let currDate = new Date()

const errorHandler = (error, request, response, next) => {
    console.error(error.message)
  
    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    } else if (error.number === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }
    next(error)
  }


const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
  }

app.get('/api/persons', (request, response) => {
    Contact.find({}).then(contacts => {
        response.json(contacts)
    })
})

app.get('/api/persons/:id', (request, response, next) => {
    Contact.findById(request.params.id).then( contact => {
        if (contact){
            response.json(contact)
        } else {
            response.status(404).end()
        }
    }).catch( error => next(error))
  })

app.delete('/api/persons/:id',(request,response,next)=>{
    Contact.findByIdAndDelete(request.params.id).then( ()=>{
        response.status(204).end()
    }).catch(error => next(error))
})

app.get('/info', (request, response) => {
    let dbLength = 0
    Contact.find({}).then(contacts => {
        console.log(contacts)
        dbLength = contacts.length
        response.send('<p>'+'Phone book has info for '+dbLength+' people</p>'+'<p>'+currDate+'</p>')
    })
})

app.post('/api/persons',(request, response,next)=>{

    const body = request.body

    if (body.name === undefined || body.number === undefined) {
        return response.status(400).json({ 
                error: 'content missing' 
        })
    }

    const person = new Contact({
        name: body.name, 
        number: body.number
    })

	person.save().then(savedContact => {
		response.json(savedContact)
	}).catch(error=>next(error))
})

app.put('/api/persons/:id',(request, response, next)=>{

    const { name, number } = request.body

    Contact.findByIdAndUpdate(
        request.params.id,
        {name, number},
        {new: true,runValidators:true,context:'query'}
    ).then(updatedContact => {
        response.json(updatedContact)
    }).catch(error => next(error))
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
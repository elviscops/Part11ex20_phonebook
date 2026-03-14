const mongoose = require('mongoose')

const url = process.env.MONGODB_URI

mongoose.set('strictQuery',false)
 
mongoose.connect(url)

const contactSchema = new mongoose.Schema({
    name: String,
    number: String,
})

const Contact = mongoose.model('Contact', contactSchema)

const contact = new Contact({
    name: process.argv[3],
    number: process.argv[4],
})

if (process.argv.length<4) {
    console.log('Phonebook:')
    Contact.find({}).then(persons=>{

        persons.forEach(item => {
            console.log(item.name, item.number)
        })
        mongoose.connection.close()
    })
  }
else if  (process.argv.length === 5) {
    contact.save().then(result => {
        console.log('Added:',contact.name,' number:', contact.number, 'to Phonebook')
        mongoose.connection.close()
      })
}


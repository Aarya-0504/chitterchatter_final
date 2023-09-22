const mongoose = require('mongoose');

const url = `mongodb+srv://aaryappatil1:ke8Z7JRiA46Cmyis@chitterchatter.mhvs4g5.mongodb.net/`;

mongoose.connect(url, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(() => console.log('Connected to DB')).catch((e)=> console.log('Error', e))

const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const io = require('socket.io')(8080 ,{
    cors:{
        origin:'http://localhost:3000'
    }
})
require('./db/connection');
//dotenv.config();

const Users = require('./models/Users');
const Conversations = require('./models/Conversations');
const Messages = require('./models/Messages');



const PORT=8000 || process.env.PORT 

//SOCKET IO
let users=[];
io.on('connection', socket =>{
    console.log('User Connected', socket.id);
    socket.on('addUser', userId=>{
        const isUser = users.find(user=>user.userId === userId);
        if(!isUser){
            const user={userId:userId,socketId: socket.id};
            users.push(user);
            io.emit('getUsers', users);
        }
    })

    socket.on('sendMessage', async ({ senderId, receiverId, message, conversationId }) => {
        const receiver = users.find(user => user.userId === receiverId);
        const sender = users.find(user => user.userId === senderId);
        const user = await Users.findById(senderId);
        //console.log('sender :>> ', sender, receiver);
        if (receiver) {
            io.to(receiver.socketId).to(sender.socketId).emit('getMessage', {
                senderId,
                message,
                conversationId,
                receiverId,
                user: { id: user._id, fullName: user.fullName, email: user.email }
            });
            }else {
                io.to(sender.socketId).emit('getMessage', {
                    senderId,
                    message,
                    conversationId,
                    receiverId,
                    user: { id: user._id, fullName: user.fullName, email: user.email }
                });
            }
        });


    socket.on('disconnect', () => {
        users = users.filter(user => user.socketId !== socket.id);
        io.emit('getUsers', users);
    });
});





//app USE
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());


//routes
app.get('/', (req, res) => {
    res.send('Welcome');
})


//registering user
app.post('/api/register',async (req,res,next) => {
    const {fullName,email,password} = req.body;
    if (!fullName || !email || !password) return res
        .status(400)
        .json({ error: `Please enter all required fields!` });

    const emailReg =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    // name validation.
    if (fullName.length > 25)
        return res
            .status(400)
            .json({ error: "name can only be less than 25 characters" });

    //email validation
    if (!emailReg.test(email))
        return res
            .status(400)
            .json({ error: "please enter a valid email address." });

    //password validation
    if (password.length < 6)
        return res
            .status(400)
            .json({ error: "password must be atleast 6 characters long" });
    try{
        const doesUserAlreadyExist = await Users.findOne({ email });

        if (doesUserAlreadyExist){
            return res.status(400).json({ error: `a user of same email id [${email}] exist! please use a different one.` })
        }else{
            const newUser = new Users({ fullName, email });
            bcryptjs.hash(password,10,(err,hashedPassword)=>{
                newUser.set('password',hashedPassword);
                newUser.save();
                next();
            })
            return res.status(200).send('User registered successfully');
        }
            

    }catch(e){
        console.log(e,'error');
    }
})

//LOGIN
app.post('/api/login', async (req,res,next)=>{
    const { email, password } = req.body;
    if (!email || !password)
        return res
            .status(400)
            .json({ error: "please enter all the required fields!" });

    //email validation
    const emailReg =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (!emailReg.test(email))
        return res
            .status(400)
            .json({ error: "please enter a valid email address." });

    try{
        const user = await Users.findOne({ email });
            if (!user) {
                res.status(400).send('User email or password is incorrect');
            } else {
                const validateUser = await bcryptjs.compare(password, user.password);
                if (!validateUser) {
                    res.status(400).send('User email or password is incorrect');
                } else {
                    const payload = {
                        userId: user._id,
                        email: user.email
                    }
                    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'THIS_IS_A_JWT_SECRET_KEY';

                    jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: '1hr' }, async (err, token) => {
                        await Users.updateOne({ _id: user._id }, {
                            $set: { token }
                        })
                        user.save();
                        return res.status(200).json({ user: { id: user._id, email: user.email, fullName: user.fullName }, token: token })
                    })
                }
            }
                
    }catch(e){
        console.log(e);
        return res.status(500).json({ error: e.message });
    }        
})

//CONVERSATION API
app.post('/api/conversations',async (req,res)=>{
    try{
        const {senderId, receiverId}=req.body;
        const newConversation = new Conversations({members:[senderId,receiverId]});
        await newConversation.save();
        res.status(200).send('Conversation created successfully');
    }catch(e){
        console.log(error, 'Error')
    }
})

//Getting conversations 
app.get('/api/conversations/:userId',async(req,res)=>{
    try{
        const userId = req.params.userId;
        const conversations = await Conversations.find({members:{ $in:[userId]}});
        const conversationUserData = Promise.all(conversations.map(async (conversation)=>{
            const receiverId = conversation.members.find((member) => member !== userId);
            const user = await Users.findById(receiverId);
            return { user: { receiverId: user._id, email: user.email, fullName: user.fullName }, conversationId: conversation._id }
        }))
        res.status(200).json(await conversationUserData);
    }catch(e){
        console.log(e);
    }
})

//Message API
app.post('/api/message',async (req,res)=>{
    try{
        const { conversationId, senderId, message, receiverId = '' } = req.body;
    if(!senderId || !message) return res.status(400).send('Please fill all required fields!');
    if(conversationId === 'new' && receiverId){
        const newConversation = new Conversations({members:[senderId,receiverId]});
        await newConversation.save();
        const newMessage = new Messages({ conversationId: newConversation._id, senderId, message });
        await newMessage.save();
        return res.status(200).send('Message sent successfully');
    } else if(!conversationId && !receiverId){
        return res.status(400).send('Please fill all required fields')
    }
    const newMessage = new Messages({ conversationId, senderId, message });
    await newMessage.save();
    res.status(200).send('Message sent successfully');
    }catch(e){
        console.log(e); 
    }

})

//Search messages
app.get('/api/message/:conversationId', async (req, res) => {
    try {
        const checkMessages = async (conversationId) => {
            console.log(conversationId, 'conversationId')
            const messages = await Messages.find({ conversationId });
            const messageUserData = Promise.all(messages.map(async (message) => {
                const user = await Users.findById(message.senderId);
                return { user: { id: user._id, email: user.email, fullName: user.fullName }, message: message.message }
            }));
            res.status(200).json(await messageUserData);
        }
        const conversationId = req.params.conversationId;
        if (conversationId === 'new') {
            const checkConversation = await Conversations.find({ members: { $all: [req.query.senderId, req.query.receiverId] } });
            if (checkConversation.length > 0) {
                checkMessages(checkConversation[0]._id);
            } else {
                return res.status(200).json([])
            }
        } else {
            checkMessages(conversationId);
        }
    } catch (error) {
        console.log('Error', error)
    }
})

//displaying all available users
app.get('/api/users/:userId',async (req,res)=>{
    try{
        const userId = req.params.userId;
        const users = await Users.find({_id:{$ne:userId}});
        const usersData = Promise.all(users.map(async (user) => {
            return { user: { email: user.email, fullName: user.fullName, receiverId: user._id } }
        }))
        res.status(200).json(await usersData);
    }catch(e){

    }
})

app.listen(PORT,async ()=>{
    
    console.log(`Listening on port:${PORT}`);
})
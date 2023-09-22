import { useEffect, useRef, useState } from 'react';
import Img1 from '../../assets/img1.jpg'
import Img2 from '../../assets/img2.jpg'
import Img3 from '../../assets/img3.jpg'
import Img4 from '../../assets/img4.jpg'
import Img5 from '../../assets/img5.jpg'
import people from '../../assets/people.png'
import user1 from '../../assets/user.png'
import aarya from '../../assets/aarya.jpg'
import tutorialsdev from '../../assets/tutorialsdev.png'
import Input from '../../components/Input'
import { useContext } from "react";
import { useNavigate } from 'react-router-dom'
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import ToastContext from '../../components/ToastContext';
import {io} from 'socket.io-client';
import './scrollbar.css'
//import style from 'style'

const Dashboard=()=>{

    const {toast}=useContext(ToastContext);
	const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user:detail')));
	const [conversations, setConversations] = useState([]);
	const [messages, setMessages] = useState({});
	const [message, setMessage] = useState('');
	const [users, setUsers] = useState([]);
	const [socket, setSocket] = useState(null);
	const messageRef = useRef(null);
	const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

	useEffect(() => {
		setSocket(io('http://localhost:8080'))
	}, [])

	useEffect(()=>{
		socket?.emit('addUser', user?.id)
		socket?.on('getUsers', users=>{
			console.log('Users connected are:',users); 
		} )
		socket?.on('getMessage', data=>{
			console.log('data>>',data);
			setMessages(prev=>({
				...prev,
				messages: [...prev.messages,{user: data.user,message: data.message}]
			}))
		})
	},[socket])

	useEffect(() => {
		messageRef?.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages?.messages]) 

	useEffect(() => {
		const loggedInUser = JSON.parse(localStorage.getItem('user:detail'))
		const fetchConversations = async () => {
			const res = await fetch(`http://localhost:8000/api/conversations/${loggedInUser?.id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				}
			});
			const resData = await res.json()
			setConversations(resData)
		}
		fetchConversations()
	}, [])

	useEffect(() => {
		const fetchUsers = async () => {
			const res = await fetch(`http://localhost:8000/api/users/${user?.id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				}
			});
			const resData = await res.json()
			setUsers(resData)
		}
		fetchUsers()
	}, [])

	const handleSearchInputChange = (e) => {
		const query = e.target.value;
		setSearchQuery(query);
	
		// Filter users based on the search query
		const filtered = users.filter((user) =>
		  user.user.fullName.toLowerCase().includes(query.toLowerCase())
		);
		setFilteredUsers(filtered);
	  };

	const fetchMessages=async (conversationId,receiver)=>{
		const result = await fetch(`http://localhost:8000/api/message/${conversationId}?senderId=${user?.id} && receiverId=${receiver?.receiverId}`,{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			}
		});
		const resData = await result.json()
		setMessages({ messages: resData, receiver, conversationId })
	}
	
	const sendMessage=async (e)=>{
		setMessage('')
		socket?.emit('sendMessage', {
			senderId: user?.id,
			receiverId: messages?.receiver?.receiverId,
			message,
			conversationId: messages?.conversationId
		});
		const res = await fetch(`http://localhost:8000/api/message`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				conversationId: messages?.conversationId,
				senderId: user?.id,
				message,
				receiverId: messages?.receiver?.receiverId
			})
		});
		//const resData = await res.json();
		//console.log('resData>>',resData);
		
	}



    return (
		<div className='w-screen flex '>
			<div className='w-[25%] h-screen bg-secondary overflow-scroll scrollbar'>
				<div className='flex items-center my-9  mx-14'>
					<div><img src={aarya} width={75} height={75} className='border border-primary p-[2px] rounded-full' /></div>
					<div className='ml-8'>
						<h3 className='text-2xl'>{user?.fullName}</h3>
						<p className='text-lg font-light'>My Account</p>
					</div>
				</div>
				<hr />
				<div className='mx-14 mt-10'>
					<div className='text-primary text-lg'>Messages</div>
					<div>
						{
							conversations.length > 0 ?
								conversations.map(({ conversationId, user }) => {
									return (
										<div className='flex items-center py-2 '>
											<div className='cursor-pointer flex items-center' onClick={() => fetchMessages(conversationId, user)}>
												<div><img src={user1} className="w-[60px] h-[60px] rounded-full p-[2px] border border-primary" /></div>
												<div className='ml-6'>
													<h3 className='text-lg font-semibold'>{user?.fullName}</h3>
													<p className='text-sm font-light text-gray-600'>{user?.email}</p>
												</div>
											</div>
										</div>
									)
								}) : <div className='text-center text-lg font-semibold mt-24'>No Conversations</div>
						}
					</div>
				</div>
			</div>
			<div className='w-[50%] h-screen bg-white flex flex-col items-center scrollbar'>
				{
					messages?.receiver?.fullName &&
					<div className='w-[75%] bg-secondary h-[80px] my-14 rounded-full flex items-center px-14 py-2'>
						<div className='cursor-pointer'><img src={user1} width={60} height={60} className="rounded-full" /></div>
						<div className='ml-6 mr-auto'>
							<h3 className='text-lg'>{messages?.receiver?.fullName}</h3>
							<p className='text-sm font-light text-gray-600'>{messages?.receiver?.email}</p>
						</div>
						<div className='cursor-pointer'>
							<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-phone-outgoing" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="black" fill="none" stroke-linecap="round" stroke-linejoin="round">
								<path stroke="none" d="M0 0h24v24H0z" fill="none" />
								<path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
								<line x1="15" y1="9" x2="20" y2="4" />
								<polyline points="16 4 20 4 20 8" />
							</svg>
						</div>
					</div>
				}
				<div className='h-[75%] w-full overflow-scroll  shadow-sm scrollbar'>
					<div className='p-14'>
						{
							messages?.messages?.length > 0 ?
								messages.messages.map(({ message, user: { id } = {} }) => {
									return (
										<>
										<div className={`max-w-[40%] rounded-b-xl p-4 mb-6 ${id === user?.id ? 'bg-primary text-white rounded-tl-xl ml-auto' : 'bg-secondary rounded-tr-xl'} `}>{message}</div>
										<div ref={messageRef} ></div>
										</>
									)
								}) : <div className='text-center text-lg font-semibold mt-24'>No Messages or No Conversation Selected</div>
						}
					</div>
				</div>
				{
					messages?.receiver?.fullName &&
					<div className='p-14 w-full flex items-center'>
						<Input placeholder='Type a message...' value={message} onChange={(e) => setMessage(e.target.value)} className='w-[75%]' inputClassName='p-4 border-0 shadow-md rounded-full bg-light focus:ring-0 focus:border-0 outline-none' />
						<div className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${!message && 'pointer-events-none'}`} onClick={() => sendMessage()}>
							<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-send" width="30" height="30" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
								<path stroke="none" d="M0 0h24v24H0z" fill="none" />
								<line x1="10" y1="14" x2="21" y2="3" />
								<path d="M21 3l-6.5 18a0.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a0.55 .55 0 0 1 0 -1l18 -6.5" />
							</svg>
						</div>
						<div className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${!message && 'pointer-events-none'}`}>
							<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-plus" width="30" height="30" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
								<path stroke="none" d="M0 0h24v24H0z" fill="none" />
								<circle cx="12" cy="12" r="9" />
								<line x1="9" y1="12" x2="15" y2="12" />
								<line x1="12" y1="9" x2="12" y2="15" />
							</svg>
						</div>
					</div>
				}
			</div>
			<div className='w-[25%] h-screen bg-light px-8 py-8 overflow-scroll scrollbar'>
				<div className='flex justify-center my-5 '>
			<button class="nav-item h-10 px-5 m-2 text-red-100 transition-colors duration-150 bg-red-700 rounded-lg focus:shadow-outline  hover:bg-red-800" onClick={()=>{
              setUser(null);
              localStorage.clear();
              toast.success("Logged out");
              navigate("/users/sign_in",{replace:true});
            }}>
             
			  Logout</button> 
			  </div>
			<div className='mb-6'>
          <input
            type='text'
            placeholder='Search users...'
            value={searchQuery}
            onChange={handleSearchInputChange}
            className='w-full p-2 border border-green-500 rounded-md focus:border-green-500 '
          />
        </div>
				<div className='text-primary text-lg'>People</div>
				<div>
				{searchQuery === '' ? (
            users.map(({ userId, user }) => (
              <div
                className='flex items-center py-0  '
                key={userId}
              >
                <div
				className='flex items-center py-2  '
				key={userId}
				>
				<div className='cursor-pointer flex items-center' onClick={() => fetchMessages('new', user)}>
					<div><img src={user1} className="w-[60px] h-[60px] rounded-full p-[2px] border border-primary" /></div>
					<div className='ml-6'>
					<h3 className='text-lg font-semibold'>{user?.fullName}</h3>
					<p className='text-sm font-light text-gray-600'>{user?.email}</p>
					</div>
				</div>
				</div>
              </div>
            ))
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map(({ userId, user }) => (
              <div className='flex items-center py-0 '
                key={userId}>
                <div className='flex items-center py-2'
				key={userId}>
				<div className='cursor-pointer flex items-center' onClick={() => fetchMessages('new', user)}>
					<div><img src={user1} className="w-[60px] h-[60px] rounded-full p-[2px] border border-primary" /></div>
					<div className='ml-6'>
					<h3 className='text-lg font-semibold'>{user?.fullName}</h3>
					<p className='text-sm font-light text-gray-600'>{user?.email}</p>
					</div>
				</div>
				</div>
              </div>
            ))
          ) : (
            <div className='text-center text-lg font-semibold mt-2'>
              No matching users found.
            </div>
          )}
				</div>
			</div>
		</div>
	)
}

export default Dashboard;

import { useState } from "react"
import Button from "../../components/Button"
import Input from "../../components/Input"
import { useNavigate } from 'react-router-dom';
import { useContext } from "react";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import ToastContext from '../../components/ToastContext';

const Sign_in = () => {
    const [data, setData] = useState({
        email: '',
        password: ''
    })
    
    const navigate = useNavigate();
    const {toast} = useContext(ToastContext)
    const handleSubmit = async(e) => {
        console.log('data :>> ', data);
        e.preventDefault()
        
        const res = await fetch(`http://localhost:8000/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

        if(res.status === 400) {
            alert('Invalid credentials')
        }else{
            const resData = await res.json()
            if(resData.token) {
                localStorage.setItem('user:token', resData.token)
                localStorage.setItem('user:detail', JSON.stringify(resData.user));
                toast.success(`Logged in successfully as ${data.email}`);
                navigate('/');
            }
        }
    }
  return (
    <div className="bg-light h-screen flex items-center justify-center">
        <div className=" bg-white w-[600px] h-[800px] shadow-lg rounded-lg flex flex-col justify-center items-center">
            <div className=" text-4xl font-extrabold">Welcome Back</div>
            <div className=" text-xl font-light mb-14">Sign in to get explored</div>
            <form className="flex flex-col items-center w-full" onSubmit={(e) => handleSubmit(e)}>
            <Input label="Email address" type="email" name="email" placeholder="Enter your email" className="mb-6 w-[75%]" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value }) }/>
            <Input label="Password" type="password" name="password" placeholder="Enter your Password" className="mb-14 w-[75%]" value={data.password} onChange={(e) => setData({ ...data, password: e.target.value }) }/>
            <Button label='Sign in' type='submit' className="w-[75%] mb-2" />
            </form>
            <div>Didn't have an account?<span className=" text-primary cursor-pointer underline" onClick={() => navigate('/users/sign_up')}>Sign up</span></div>
        </div>
    </div>
  )
}

export default Sign_in;
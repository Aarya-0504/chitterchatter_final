//import logo from './logo.svg';
import './App.css';
import Form from './modules/Form';
import Dashboard from './modules/Dashboard';
import SignIn from './modules/Form/sign_in';
import { Routes,Route, Navigate } from 'react-router-dom';
import {ToastContextProvider} from './components/ToastContext';

const ProtectedRoute=({children, auth=false})=>{
  const isLoggedIn = localStorage.getItem('user:token') !==null || false;
  if(!isLoggedIn && auth){ 
    return <Navigate to={'/users/sign_in'} />
  }else if(isLoggedIn && ['/users/sign_in', '/users/sign_up'].includes(window.location.pathname)){
    console.log('object :>> ');
    return <Navigate to={'/'} />
  }

  return children;
}

function App() {
  return (
    <ToastContextProvider>
    <Routes>
      <Route path='/' element={
        <ProtectedRoute auth={true}>
        <Dashboard/>
      </ProtectedRoute>
      }/> 
      <Route path='/users/sign_in' element={
        <ProtectedRoute>
        <SignIn/>
      </ProtectedRoute>
      }/>
      <Route path='/users/sign_up' element={
        <ProtectedRoute>
        <Form/>
      </ProtectedRoute>
      }/>
    </Routes>
    </ToastContextProvider>
  );
}

export default App;

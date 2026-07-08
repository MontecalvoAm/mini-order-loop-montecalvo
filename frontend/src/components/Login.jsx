import React, { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = React.useState('');

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err) {
      setErrorMsg('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <h2 className="text-3xl font-bold text-center text-white mb-6">Welcome Back</h2>
        {errorMsg && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-center">{errorMsg}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Email</label>
            <input 
              type="email" 
              {...register('email', { required: true })} 
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="customer@example.com"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Password</label>
            <input 
              type="password" 
              {...register('password', { required: true })} 
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="password"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-blue-600/30"
          >
            Sign In
          </button>
        </form>
        
        <div className="mt-6 text-sm text-gray-400 text-center">
          <p>Test Accounts:</p>
          <p>Requester: requester@demo.test / password</p>
          <p>Approver: approver@demo.test / password</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

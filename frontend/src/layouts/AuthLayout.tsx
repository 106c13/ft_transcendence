import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';

const AuthLayout = () => {
	const navigate = useNavigate();
	const token = localStorage.getItem('token');

	useEffect(() => {
		if (token) {
			navigate('/home', { replace: true });
		}
	}, [token, navigate]);

	if (token) {
		return null;
	}

	return (
		<div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
			<Navbar currentUser={null} />
			<div className="flex flex-1 items-center justify-center min-h-[calc(100vh-64px)] pt-20 px-5 pb-10 box-border bg-[radial-gradient(circle_at_top,#0F172A,#101A30)] text-slate-200">
				<div className="w-[340px] p-[30px] rounded-[14px] bg-[#1E293B] border border-slate-400/12 shadow-[0_10px_40px_rgba(0,0,0,0.35)] [&_h1]:mt-0 [&_h1]:mb-5 [&_h1]:text-[22px] [&_h1]:font-bold [&_h1]:text-center [&_h1]:text-slate-200">
					<Outlet />
				</div>
			</div>
			<Footer currentUser={null} />
		</div>
	);
};

export default AuthLayout;
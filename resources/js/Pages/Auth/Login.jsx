import { useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <Head title="Log in" />

            <div className="w-full max-w-sm p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-emerald-700">SABIRA TAHFIDZ</h1>
                    <p className="text-sm text-gray-500">Silakan masuk ke akun Anda</p>
                </div>

                {status && <div className="mb-4 text-sm font-medium text-green-600">{status}</div>}

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            value={data.username}
                            onChange={e => setData('username', e.target.value)}
                            className={`w-full mt-1 border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 ${errors.username ? 'border-red-500' : ''}`}
                            required
                            autoFocus
                        />
                        {/* PENANGKAP ERROR: Akan memunculkan teks merah jika login gagal */}
                        {errors.username && <div className="mt-1 text-sm font-medium text-red-600">{errors.username}</div>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            className="w-full mt-1 border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                            required
                        />
                        {errors.password && <div className="mt-1 text-sm font-medium text-red-600">{errors.password}</div>}
                    </div>

                    <button disabled={processing} className="w-full py-2.5 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 transition-colors">
                        {processing ? 'Memproses...' : 'Log in'}
                    </button>
                </form>
            </div>
        </div>
    );
}

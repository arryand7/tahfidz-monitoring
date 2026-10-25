import { Head, useForm } from '@inertiajs/react';

export default function Login({ status, ssoEnabled = true }) {
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
        <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-br from-emerald-50 via-gray-50 to-teal-50">
            <Head title="Masuk - Sabira Tahfidz" />

            <div className="w-full max-w-md p-8 bg-white border border-gray-100 shadow-xl rounded-2xl">
                {/* Brand Header */}
                <div className="mb-6 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 mb-3 text-white shadow-md rounded-2xl bg-emerald-600 shadow-emerald-200">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-emerald-800">SABIRA TAHFIDZ</h1>
                    <p className="mt-1 text-sm text-gray-500">Sistem Informasi Monitoring Hafalan Santri</p>
                </div>

                {/* Status Notice */}
                {status && (
                    <div className="p-3 mb-4 text-sm font-medium border rounded-lg text-emerald-800 bg-emerald-50 border-emerald-200">
                        {status}
                    </div>
                )}

                {/* SSO Error Banner */}
                {errors.sso && (
                    <div className="flex items-start gap-2.5 p-3.5 mb-4 text-sm font-medium text-red-800 border border-red-200 bg-red-50 rounded-xl">
                        <svg className="flex-shrink-0 w-5 h-5 mt-0.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>{errors.sso}</div>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Tombol Login Gate SSO */}
                    {ssoEnabled && (
                        <a
                            href={route('sso.login')}
                            id="btn-gate-sso-login"
                            className="group relative flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white transition-all duration-200 bg-emerald-600 rounded-xl hover:bg-emerald-700 active:scale-[0.99] shadow-md shadow-emerald-200 gap-3"
                        >
                            <div className="flex items-center justify-center w-6 h-6 transition-colors rounded-lg bg-emerald-500 group-hover:bg-emerald-600">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <span>Masuk dengan Gate SSO</span>
                        </a>
                    )}

                    {ssoEnabled && (
                        <div className="relative flex items-center justify-center my-4">
                            <div className="w-full border-t border-gray-200"></div>
                            <span className="absolute px-3 text-xs font-medium text-gray-400 bg-white uppercase">
                                atau gunakan username
                            </span>
                        </div>
                    )}

                    {/* Form Login Username & Password */}
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <input
                                type="text"
                                value={data.username}
                                onChange={e => setData('username', e.target.value)}
                                className={`w-full mt-1 border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm ${
                                    errors.username && !errors.sso ? 'border-red-500' : ''
                                }`}
                                required
                                autoFocus
                                placeholder="Masukkan username, NIS, atau NIP"
                            />
                            {errors.username && !errors.sso && (
                                <div className="mt-1 text-sm font-medium text-red-600">{errors.username}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                className="w-full mt-1 text-sm border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                required
                                placeholder="Masukkan password"
                            />
                            {errors.password && (
                                <div className="mt-1 text-sm font-medium text-red-600">{errors.password}</div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-2.5 text-sm font-medium text-white transition-colors bg-gray-800 rounded-lg shadow-sm hover:bg-gray-900 disabled:opacity-50"
                        >
                            {processing ? 'Memproses...' : 'Masuk Manual'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

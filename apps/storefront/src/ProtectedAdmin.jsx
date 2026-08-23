import { useEffect, useState } from 'react';
import { api, ApiError } from './api';
import AdminPanel from './AdminPanel';
import logoGutShoes from './assets/logo-gutshoes.png';

export default function ProtectedAdmin(props){
  const [authenticated,setAuthenticated]=useState(false);
  const [checking,setChecking]=useState(true);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{let active=true;api.me().then(({data})=>{if(active)setAuthenticated(data.role==='ADMIN')}).catch(()=>{}).finally(()=>{if(active)setChecking(false)});return()=>{active=false}},[]);
  const submit=async event=>{event.preventDefault();setError('');setLoading(true);const data=new FormData(event.currentTarget);try{const response=await api.adminLogin({email:data.get('email'),password:data.get('password')});if(response.data.role!=='ADMIN')throw new ApiError('Akun ini bukan administrator.',403,{});setAuthenticated(true)}catch(err){setError(err instanceof ApiError?err.message:'Server tidak dapat dijangkau. Coba lagi.')}finally{setLoading(false)}};
  if(checking)return <main className="admin-login"><form aria-busy="true"><img src={logoGutShoes} alt="GutShoes"/><h2>Memeriksa sesi…</h2></form></main>;
  if(authenticated)return <AdminPanel {...props}/>;
  return <main className="admin-login"><section><button onClick={props.onStorefront}>← Kembali ke storefront</button><div><span>OPERASIONAL GUTSHOES</span><h1>Kelola toko dari satu ruang kerja.</h1><p>Produk, stok, pembayaran, pemenuhan, dan layanan purnajual tetap terhubung dalam satu alur yang dapat diaudit.</p></div></section><form onSubmit={submit}><img src={logoGutShoes} alt="GutShoes"/><span>PORTAL ADMIN</span><h2>Masuk sebagai administrator</h2><p>Gunakan akun admin yang dibuat melalui perintah Artisan. Sesi dilindungi Sanctum dan CSRF.</p><label>Email admin<input name="email" type="email" required autoComplete="username"/></label><label>Kata sandi<input name="password" type="password" required minLength="12" autoComplete="current-password"/></label>{error&&<div className="notice error" role="alert">{error}</div>}<button className="adm-button" disabled={loading} aria-busy={loading}>{loading?'Memverifikasi…':'Masuk ke admin panel'}</button></form></main>
}

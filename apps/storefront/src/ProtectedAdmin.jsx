import React, { useEffect, useState } from 'react';
import { api, ApiError } from './api';
import AdminPanel from './AdminPanel';
import logoGutShoes from './assets/logo-gutshoes.png';
import {forgetAdminSession, readAdminSession, rememberAdminSession} from './lib/adminSession';

export default function ProtectedAdmin(props){
  const [cachedSession]=useState(readAdminSession);
  const [authenticated,setAuthenticated]=useState(cachedSession.valid);
  const [checking,setChecking]=useState(!cachedSession.valid);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(cachedSession.fresh)return undefined;
    let active=true;
    api.me().then(({data})=>{
      if(!active)return;
      const isAdmin=data.role==='ADMIN';
      setAuthenticated(isAdmin);
      if(isAdmin)rememberAdminSession();else forgetAdminSession();
    }).catch((err)=>{
      if(!active)return;
      if(!cachedSession.valid||err?.status===401||err?.status===403){forgetAdminSession();setAuthenticated(false)}
    }).finally(()=>{if(active)setChecking(false)});
    return()=>{active=false};
  },[cachedSession]);
  const submit=async event=>{event.preventDefault();setError('');setLoading(true);const data=new FormData(event.currentTarget);try{const response=await api.adminLogin({email:data.get('email'),password:data.get('password')});if(response.data.role!=='ADMIN')throw new ApiError('Akun ini bukan administrator.',403,{});rememberAdminSession();setAuthenticated(true)}catch(err){forgetAdminSession();setError(err instanceof ApiError?err.message:'Server tidak dapat dijangkau. Coba lagi.')}finally{setLoading(false)}};
  if(checking)return <main className="admin-session-pending" aria-label="Memuat admin" aria-busy="true"><span className="action-spinner"/><span className="sr-only">Memeriksa sesi admin</span></main>;
  if(authenticated)return <AdminPanel {...props}/>;
  return <main className="admin-login"><section><button onClick={props.onStorefront}>← Kembali ke storefront</button><div><span>OPERASIONAL GUTSHOES</span><h1>Kelola toko dari satu ruang kerja.</h1><p>Produk, stok, pembayaran, pemenuhan, dan layanan purnajual tetap terhubung dalam satu alur yang dapat diaudit.</p></div></section><form onSubmit={submit}><img src={logoGutShoes} alt="GutShoes"/><span>PORTAL ADMIN</span><h2>Masuk sebagai administrator</h2><p>Gunakan akun admin yang dibuat melalui perintah Artisan. Sesi dilindungi Sanctum dan CSRF.</p><label>Email admin<input name="email" type="email" required autoComplete="username"/></label><label>Kata sandi<input name="password" type="password" required minLength="12" autoComplete="current-password"/></label>{error&&<div className="notice error" role="alert">{error}</div>}<button className="adm-button" disabled={loading} aria-busy={loading}>{loading?'Memverifikasi…':'Masuk ke admin panel'}</button></form></main>
}


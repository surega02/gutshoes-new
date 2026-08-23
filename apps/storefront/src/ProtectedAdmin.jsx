import React, { useState } from 'react';
import AdminPanel from './AdminPanel';
import logoGutShoes from './assets/logo-gutshoes.png';

export default function ProtectedAdmin(props){
  const [authenticated,setAuthenticated]=useState(()=>sessionStorage.getItem('gutshoes-admin-demo')==='active');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  if(authenticated)return <AdminPanel {...props}/>;
  const submit=event=>{event.preventDefault();const data=new FormData(event.currentTarget);if(data.get('email')!=='admin@gutshoes.id'||data.get('password')!=='admin123'){setError('Email atau kata sandi demo tidak sesuai. Gunakan kredensial yang tertera.');return}setLoading(true);window.setTimeout(()=>{sessionStorage.setItem('gutshoes-admin-demo','active');setAuthenticated(true)},450)};
  return <main className="admin-login"><section><button onClick={props.onStorefront}>← Kembali ke storefront</button><div><span>OPERASIONAL GUTSHOES</span><h1>Kelola toko dari satu ruang kerja.</h1><p>Produk, stok, pembayaran, pemenuhan, dan layanan purnajual tetap terhubung dalam satu alur yang dapat diaudit.</p></div></section><form onSubmit={submit}><img src={logoGutShoes} alt="GutShoes"/><span>PORTAL ADMIN</span><h2>Masuk sebagai administrator</h2><p>Frontend demonstrasi. Produksi wajib memakai autentikasi dan otorisasi server untuk role ADMIN.</p><label>Email admin<input name="email" type="email" required autoComplete="username" defaultValue="admin@gutshoes.id"/></label><label>Kata sandi<input name="password" type="password" required minLength="8" autoComplete="current-password" defaultValue="admin123"/></label>{error&&<div className="notice error" role="alert">{error}</div>}<button className="adm-button" disabled={loading} aria-busy={loading}>{loading?'Memverifikasi…':'Masuk ke admin panel'}</button><small>Akun demo: admin@gutshoes.id · admin123</small></form></main>
}

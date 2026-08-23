import React, { useEffect, useMemo, useRef, useState } from 'react';
import { products, categories, rupiah } from './data';
import logoGutShoes from './assets/logo-gutshoes.png';
import heroRunning from './assets/products/hero-running.webp';
import AdminPanel from './ProtectedAdmin';
import { api, googleLoginUrl } from './api';

const Icon = ({ name, size = 20 }) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    cart: <><path d="M3 4h2l2 11h10l2-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c.7-4 3.4-6 8-6s7.3 2 8 6"/></>,
    arrow: <><path d="M5 12h14M14 6l6 6-6 6"/></>,
    back: <><path d="M19 12H5M10 18l-6-6 6-6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></>,
    minus: <path d="M5 12h14"/>, plus: <path d="M12 5v14M5 12h14"/>,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
    shield: <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/>,
    package: <><path d="m4 7 8-4 8 4-8 4-8-4ZM4 7v10l8 4 8-4V7M12 11v10"/></>,
    locate: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    close: <path d="M6 6l12 12M18 6 6 18"/>,
    filter: <path d="M4 5h16M7 12h10M10 19h4"/>,
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

const Button = ({ children, variant = 'primary', className = '', ...props }) => <button className={`button button--${variant} ${className}`} {...props}>{children}</button>;

const Feedback = ({ children, type = 'error', id }) => children ? <p id={id} className={`notice ${type}`} role={type === 'error' ? 'alert' : 'status'} aria-live={type === 'error' ? 'assertive' : 'polite'}>{children}</p> : null;

function readRoute() {
  const raw = window.location.hash.replace(/^#/, '') || 'home';
  const [path, search = ''] = raw.split('?');
  const [page, id] = path.split('/');
  if (page === 'admin') return { page, data: { section: id || 'dashboard' } };
  if (page === 'product') return { page, data: { product: products.find(item => item.id === Number(id)) || products[0] } };
  if (page === 'catalog') return { page, data: { filter: new URLSearchParams(search).get('filter') || undefined } };
  if (page === 'order-detail') return { page, data: { orderNumber: id } };
  if (['home', 'cart', 'checkout', 'payment', 'tracking', 'login', 'profile', 'addresses', 'orders'].includes(page)) return { page, data: {} };
  return { page: 'home', data: {} };
}

function routeHash(page, data = {}) {
  if (page === 'admin') return `#admin/${data.section || 'dashboard'}`;
  if (page === 'product' && data.product) return `#product/${data.product.id}`;
  if (page === 'catalog' && data.filter) return `#catalog?filter=${encodeURIComponent(data.filter)}`;
  if (page === 'order-detail') return `#order-detail/${data.orderNumber || ''}`;
  return `#${page}`;
}

function Header({ cartCount, navigate, query, setQuery, user, page }) {
  return <>
    <header className="header">
      <button className="brand" onClick={() => navigate('home')} aria-label="Ke beranda GutShoes"><img src={logoGutShoes} alt="GutShoes" /></button>
      <label className="search"><Icon name="search"/><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && navigate('catalog')} placeholder="Cari nama sepatu, merek, atau SKU" aria-label="Cari produk"/></label>
      <nav className="utility" aria-label="Menu pengguna">
        <button onClick={() => navigate('tracking')}><Icon name="package"/><span>Lacak pesanan</span></button>
        <button onClick={() => navigate(user ? 'profile' : 'login')} aria-label={user ? `Buka profil ${user.name}` : 'Masuk ke akun'}>{user ? <span className="account-avatar" aria-hidden="true">{user.name.charAt(0)}</span> : <Icon name="user"/>}<span>{user ? user.name.split(' ')[0] : 'Masuk'}</span></button>
        <button className="cart-button" onClick={() => navigate('cart')} aria-label={`Keranjang, ${cartCount} barang`}><Icon name="cart"/><span>Keranjang</span>{cartCount > 0 && <b aria-hidden="true">{cartCount}</b>}</button>
      </nav>
    </header>
    <nav className="nav" aria-label="Navigasi utama">
      <button className={page==='home'?'active':''} aria-current={page==='home'?'page':undefined} onClick={() => navigate('home')}>Beranda</button>
      <button className={page==='catalog'?'active':''} aria-current={page==='catalog'?'page':undefined} onClick={() => navigate('catalog')}>Semua sepatu</button>
      {categories.slice(0, 4).map(c => <button key={c} onClick={() => { setQuery(c); navigate('catalog'); }}>{c}</button>)}
    </nav>
  </>;
}

function ProductCard({ product, onOpen }) {
  return <article className="product-card">
    <button className="product-card__image" onClick={() => onOpen(product)} aria-label={`Lihat ${product.name}`}><img src={product.image} alt={`${product.name}, sepatu ${product.category.toLowerCase()}`} loading="lazy" decoding="async" /></button>
    <div className="product-card__meta"><span>{product.category}</span><small>{product.brand}</small></div>
    <h3><button className="product-name-button" onClick={() => onOpen(product)}>{product.name}</button></h3>
    <p>{rupiah(product.price)}</p>
    <div className="sizes-preview" aria-label="Ukuran tersedia">{product.sizes.slice(0, 5).map(s => <span className={!product.stock[s] ? 'sold' : ''} key={s}>{s}</span>)}</div>
  </article>;
}

function Home({ navigate, openProduct }) {
  return <main>
    <section className="hero">
      <div className="hero__copy">
        <h1>Sepatu olahraga untuk langkah sehari-hari.</h1>
        <p>Temukan pasangan yang sesuai aktivitas, ukuran, dan anggaranmu.</p>
        <Button onClick={() => navigate('catalog')}>Belanja sekarang <Icon name="arrow"/></Button>
      </div>
      <div className="hero__visual"><span className="hero__mark"/><img src={heroRunning} alt="Sepatu lari berwarna biru navy"/></div>
    </section>
    <section className="category-strip" aria-label="Belanja berdasarkan aktivitas">
      {categories.map((c, i) => <button key={c} onClick={() => navigate('catalog', { filter: c })}><img src={products[i].image} alt=""/><span><strong>{c}</strong><small>Lihat pilihan</small></span><Icon name="chevron"/></button>)}
    </section>
    <section className="section">
      <div className="section__heading"><div><h2>Pilihan untukmu</h2><p>Produk demo untuk memvalidasi pengalaman belanja.</p></div><button className="text-link" onClick={() => navigate('catalog')}>Lihat semua <Icon name="arrow"/></button></div>
      <div className="product-grid">{products.slice(0,4).map(p => <ProductCard key={p.id} product={p} onOpen={openProduct}/>)}</div>
    </section>
    <section className="confidence">
      <div><Icon name="shield" size={28}/><h3>Informasi yang bisa diperiksa</h3><p>Harga, ukuran, dan ketersediaan ditampilkan per varian.</p></div>
      <div><Icon name="truck" size={28}/><h3>Biaya terlihat sebelum bayar</h3><p>Ongkir dan potongan dirinci di ringkasan checkout.</p></div>
      <div><Icon name="package" size={28}/><h3>Pesanan mudah dilacak</h3><p>Pembeli tamu dapat menggunakan nomor pesanan dan email.</p></div>
    </section>
  </main>;
}

function Catalog({ query, setQuery, openProduct, initialFilter }) {
  const [category, setCategory] = useState(initialFilter || 'Semua');
  const [sort, setSort] = useState('newest');
  const [priceBand, setPriceBand] = useState('all');
  const [selectedSize, setSelectedSize] = useState(null);
  const [mobileFilters, setMobileFilters] = useState(false);
  useEffect(() => setCategory(initialFilter || 'Semua'), [initialFilter]);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const list = products.filter(p => {
      const matchesPrice = priceBand === 'all' || (priceBand === 'under' && p.price < 600000) || (priceBand === 'mid' && p.price >= 600000 && p.price <= 800000) || (priceBand === 'over' && p.price > 800000);
      return (category === 'Semua' || p.category === category) && `${p.name} ${p.brand} ${p.category} ${p.variants.map(v=>v.sku).join(' ')}`.toLowerCase().includes(q) && matchesPrice && (!selectedSize || p.stock[selectedSize] > 0);
    });
    return [...list].sort((a,b) => sort === 'low' ? a.price-b.price : sort === 'high' ? b.price-a.price : b.id-a.id);
  }, [query, category, priceBand, selectedSize, sort]);
  const filters = <div className="filters">
    <div className="filters__head"><h2>Filter</h2><button onClick={() => setMobileFilters(false)} aria-label="Tutup filter"><Icon name="close"/></button></div>
    <fieldset><legend>Aktivitas</legend>{['Semua', ...categories].map(c => <label key={c}><input type="radio" name="category" checked={category === c} onChange={() => setCategory(c)}/><span>{c}</span></label>)}</fieldset>
    <fieldset><legend>Rentang harga</legend>{[['all','Semua harga'],['under','Di bawah Rp600.000'],['mid','Rp600.000–Rp800.000'],['over','Di atas Rp800.000']].map(([value,label]) => <label key={value}><input type="radio" name="price" value={value} checked={priceBand === value} onChange={() => setPriceBand(value)}/><span>{label}</span></label>)}</fieldset>
    <fieldset><legend>Ukuran tersedia</legend><div className="size-filter">{[36,37,38,39,40,41,42,43,44].map(s => <button type="button" aria-pressed={selectedSize === s} className={selectedSize === s ? 'active' : ''} onClick={() => setSelectedSize(selectedSize === s ? null : s)} key={s}>{s}</button>)}</div></fieldset>
  </div>;
  return <main className="catalog-page">
    <div className="page-title"><div><button className="back-link" onClick={() => {setQuery('');setCategory('Semua');setPriceBand('all');setSelectedSize(null)}}>Reset semua filter</button><h1>Temukan sepatu untuk aktivitasmu</h1><p aria-live="polite">{filtered.length} produk ditampilkan</p></div><div className="catalog-actions"><Button variant="secondary" className="mobile-filter" onClick={() => setMobileFilters(true)} aria-expanded={mobileFilters}><Icon name="filter"/> Filter</Button><label>Urutkan <select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Terbaru</option><option value="low">Harga terendah</option><option value="high">Harga tertinggi</option></select></label></div></div>
    <div className="catalog-layout"><aside className={mobileFilters ? 'filter-drawer open' : 'filter-drawer'} aria-label="Filter katalog">{filters}</aside><section>{filtered.length ? <div className="product-grid product-grid--catalog">{filtered.map(p => <ProductCard key={p.id} product={p} onOpen={openProduct}/>)}</div> : <div className="empty"><Icon name="search" size={34}/><h2>Produk belum ditemukan</h2><p>Coba hapus kata pencarian atau ubah filter harga dan ukuran.</p><Button onClick={() => {setQuery('');setCategory('Semua');setPriceBand('all');setSelectedSize(null)}}>Reset pencarian dan filter</Button></div>}</section></div>
  </main>;
}

function ProductDetail({ product, addToCart, navigate }) {
  const [size, setSize] = useState(null);
  const [notice, setNotice] = useState('');
  if (!product) return null;
  const selectedVariant=product.variants?.find(v=>v.size===size); const displayPrice=selectedVariant?.price||product.price;
  const add = () => { if (!size) { setNotice('Pilih ukuran yang tersedia sebelum menambahkan produk.'); return; } addToCart({...product,price:displayPrice}, size); setNotice('Produk ditambahkan ke keranjang.'); };
  return <main className="detail-page">
    <button className="back-link" onClick={() => navigate('catalog')}><Icon name="back"/> Kembali ke katalog</button>
    <div className="detail-layout">
      <div className="product-gallery"><img src={product.image} alt={product.name}/><div className="gallery-dots"><span/><span/><span/></div></div>
      <section className="purchase-panel"><p className="product-brand">{product.brand} · {product.category}</p><h1>{product.name}</h1><p className="price">{rupiah(displayPrice)}</p>{selectedVariant&&<p className="variant-meta">SKU {selectedVariant.sku} · {selectedVariant.weight} gram</p>}<p className="description">Sepatu olahraga serbaguna dengan konstruksi ringan untuk aktivitas harian. Informasi ini merupakan konten demonstrasi dan harus diganti dengan detail produk dari katalog.</p>
        <div className="size-heading"><strong id="size-picker-label">Pilih ukuran</strong><button disabled title="Panduan ukuran belum tersedia pada prototipe">Panduan ukuran segera</button></div><div className="size-picker" role="group" aria-labelledby="size-picker-label">{product.sizes.map(s => <button key={s} aria-pressed={size === s} className={size === s ? 'active' : ''} disabled={!product.stock[s]} onClick={() => {setSize(s);setNotice('')}}>{s}<small>{!product.stock[s] ? 'Habis' : `${product.stock[s]} stok`}</small></button>)}</div>
        <Feedback type={notice.includes('ditambahkan') ? 'success' : 'error'}>{notice}</Feedback>
        <Button className="add-button" onClick={add}>Tambah ke keranjang <Icon name="cart"/></Button>
        <div className="product-facts"><div><Icon name="package"/><span><strong>SKU per ukuran</strong>Varian diverifikasi saat checkout</span></div><div><Icon name="truck"/><span><strong>Ongkir otomatis</strong>Dihitung berdasarkan alamat dan berat</span></div></div>
      </section>
    </div>
    <section className="section related"><div className="section__heading"><div><h2>Produk lainnya</h2><p>Alternatif dari aktivitas berbeda.</p></div></div><div className="product-grid">{products.filter(p => p.id !== product.id).slice(0,4).map(p => <ProductCard key={p.id} product={p} onOpen={p => navigate('product', {product:p})}/>)}</div></section>
  </main>;
}

function OrderSummary({ cart, shipping = 0, voucher = 0, totalLabel = 'Total' }) {
  const subtotal = cart.reduce((sum,i) => sum + i.product.price*i.qty,0);
  return <aside className="order-summary"><h2>Ringkasan pesanan</h2><div className="summary-lines"><span>Subtotal <b>{rupiah(subtotal)}</b></span>{shipping > 0 && <span>Pengiriman <b>{rupiah(shipping)}</b></span>}{voucher > 0 && <span>Potongan voucher <b className="discount">−{rupiah(voucher)}</b></span>}</div><div className="summary-total"><span>{totalLabel}</span><strong>{rupiah(subtotal+shipping-voucher)}</strong></div><small>Total demonstrasi akan dihitung ulang oleh backend sebelum pesanan dibuat.</small></aside>;
}

function Cart({ cart, updateQty, removeItem, navigate }) {
  return <main className="cart-page"><div className="page-title"><div><h1>Keranjangmu</h1><p>{cart.length ? `${cart.length} varian siap diperiksa` : 'Belum ada produk di keranjang'}</p></div></div>{cart.length ? <div className="cart-layout"><section className="cart-items">{cart.map(item => <article className="cart-item" key={`${item.product.id}-${item.size}`}><img src={item.product.image} alt=""/><div className="cart-item__info"><span>{item.product.brand}</span><h2>{item.product.name}</h2><p>Ukuran {item.size}</p><strong>{rupiah(item.product.price)}</strong></div><div className="quantity"><button onClick={() => updateQty(item, -1)} aria-label="Kurangi jumlah"><Icon name="minus"/></button><span>{item.qty}</span><button onClick={() => updateQty(item, 1)} disabled={item.qty >= item.product.stock[item.size]} aria-label="Tambah jumlah"><Icon name="plus"/></button></div><button className="remove" onClick={() => removeItem(item)} aria-label={`Hapus ${item.product.name}`}><Icon name="trash"/></button></article>)}</section><div><OrderSummary cart={cart}/><Button className="checkout-button" onClick={() => navigate('checkout')}>Lanjut ke checkout <Icon name="arrow"/></Button></div></div> : <div className="empty"><Icon name="cart" size={36}/><h2>Keranjang masih kosong</h2><p>Mulai dari koleksi sepatu yang sesuai aktivitasmu.</p><Button onClick={() => navigate('catalog')}>Lihat semua sepatu</Button></div>}</main>;
}

function Checkout({ cart, navigate, createOrder, user, addresses, guestCartToken }) {
  const [step, setStep] = useState(1); const [shipping, setShipping] = useState(18000); const [voucher, setVoucher] = useState(''); const [voucherValue, setVoucherValue] = useState(0); const [error, setError] = useState(''); const [submitting,setSubmitting]=useState(false); const [buyer,setBuyer]=useState(null);
  const next = e => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); if (step === 1 && (!data.name || !data.email || !data.phone)) {setError('Lengkapi nama, email, dan nomor telepon untuk melanjutkan.');return;} setBuyer(data); setError(''); setStep(Math.min(3, step+1)); };
  const applyVoucher = async () => { try{const quote=await api.quote({destination_area_id:buyer?.city||'destination',courier:'jne',service:shipping===40000?'YES':'REG',voucher_code:voucher||null},guestCartToken);setVoucherValue(Number(quote.data.pricing.voucher_discount));setShipping(Number(quote.data.pricing.shipping_fee));setError('')}catch(err){setVoucherValue(0);setError(err.message||'Voucher atau pengiriman tidak valid.')} };
  const submitOrder=async()=>{if(submitting||!buyer)return;setSubmitting(true);setError('');try{const payload={customer:{name:buyer.name,email:buyer.email,phone:buyer.phone},address:{recipient_name:buyer.name,phone:buyer.phone,address_line:buyer.address,province:buyer.province,city:buyer.city,district:buyer.district,postal_code:buyer.postal,provider_area_id:buyer.city},shipping:{courier:'jne',service:shipping===40000?'YES':'REG'},voucher_code:voucher||null};const created=await api.checkout(payload,guestCartToken,crypto.randomUUID());const payment=await api.createPayment(created.data.order_number,buyer.email);createOrder({number:created.data.order_number,total:Number(created.data.grand_total),redirectUrl:payment.data.redirect_url});navigate('payment')}catch(err){setError(err.message||'Pesanan tidak dapat dibuat.');setSubmitting(false)}};
  if(!cart.length)return <main className="checkout-page"><div className="empty"><Icon name="cart" size={36}/><h1>Keranjang belum siap di-checkout</h1><p>Tambahkan setidaknya satu sepatu sebelum melanjutkan.</p><Button onClick={()=>navigate('catalog')}>Lihat semua sepatu</Button></div></main>;
  return <main className="checkout-page"><button className="back-link" onClick={() => navigate('cart')}><Icon name="back"/> Kembali ke keranjang</button><div className="checkout-head"><h1>Checkout</h1><div className="steps" aria-label="Tahapan checkout">{['Data pembeli','Pengiriman','Pembayaran'].map((s,i)=><span className={step>=i+1?'active':''} aria-current={step===i+1?'step':undefined} key={s}><b>{step>i+1?<Icon name="check" size={15}/>:i+1}</b>{s}</span>)}</div></div><div className="checkout-layout"><section className="checkout-form">
    {step===1 && <form onSubmit={next}><h2>{user?'Pilih alamat pengiriman':'Data pembeli'}</h2><p>{user?'Gunakan alamat tersimpan atau masukkan tujuan baru.':'Masuk tidak wajib. Informasi ini digunakan untuk pembaruan pesanan.'}</p>{user&&addresses.length>0&&<div className="saved-address-choice" role="radiogroup" aria-label="Alamat tersimpan">{addresses.map(a=><label className={a.isDefault?'selected':''} key={a.id}><input type="radio" name="savedAddress" defaultChecked={a.isDefault}/><span><strong>{a.label} · {a.recipient}</strong><small>{a.address}, {a.city} {a.postal}</small></span>{a.isDefault&&<b>Utama</b>}</label>)}</div>}<div className="form-grid"><label>Nama lengkap<input name="name" required maxLength="100" autoComplete="name" defaultValue={user?.name||'Ega Pratama'}/></label><label>Email<input name="email" required type="email" autoComplete="email" defaultValue={user?.email||'ega@example.com'} readOnly={Boolean(user)}/></label><label>Nomor telepon<input name="phone" required inputMode="tel" autoComplete="tel" pattern="[0-9+ -]{8,20}" defaultValue={user?.phone||'081234567890'}/></label><label className="span-2">Alamat lengkap<textarea name="address" required maxLength="300" autoComplete="street-address" defaultValue={addresses.find(a=>a.isDefault)?.address||'Jl. Contoh No. 17, Kebayoran Baru'}/></label><label>Provinsi<select name="province" autoComplete="address-level1" defaultValue={addresses.find(a=>a.isDefault)?.province||'DKI Jakarta'}><option>DKI Jakarta</option><option>Jawa Barat</option></select></label><label>Kota/Kabupaten<select name="city" autoComplete="address-level2" defaultValue={addresses.find(a=>a.isDefault)?.city||'Jakarta Selatan'}><option>Jakarta Selatan</option><option>Jakarta Pusat</option></select></label><label>Kecamatan<input name="district" required autoComplete="address-level3" defaultValue="Kebayoran Baru"/></label><label>Kode pos<input name="postal" required inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" defaultValue={addresses.find(a=>a.isDefault)?.postal||'12120'}/></label></div><Feedback id="checkout-error">{error}</Feedback><Button type="submit">Pilih pengiriman <Icon name="arrow"/></Button></form>}
    {step===2 && <div><h2>Pilih layanan pengiriman</h2><p>Tarif berikut adalah data demonstrasi dari lapisan provider pengiriman.</p><div className="shipping-options">{[[18000,'Reguler','2–4 hari kerja'],[32000,'Express','1–2 hari kerja']].map(([fee,name,eta])=><label className={shipping===fee?'selected':''} key={fee}><input type="radio" name="shipping" checked={shipping===fee} onChange={()=>setShipping(fee)}/><Icon name="truck"/><span><strong>{name}</strong><small>{eta}</small></span><b>{rupiah(fee)}</b></label>)}</div><div className="voucher"><label>Kode voucher<input value={voucher} onChange={e=>setVoucher(e.target.value)} maxLength="24" autoComplete="off" placeholder="Masukkan kode"/></label><Button variant="secondary" onClick={applyVoucher}>Terapkan</Button></div><Feedback>{error}</Feedback><div className="form-actions"><Button variant="ghost" onClick={()=>setStep(1)}>Kembali</Button><Button onClick={()=>{setError('');setStep(3)}}>Pilih pembayaran <Icon name="arrow"/></Button></div></div>}
    {step===3 && <div><h2>Metode pembayaran</h2><p>Metode tersedia akan mengikuti konfigurasi Midtrans ketika API terhubung.</p><div className="payment-choice selected"><span className="midtrans-mark">M</span><span><strong>Bayar melalui Midtrans</strong><small>Pilih bank, dompet digital, atau metode lainnya di halaman pembayaran.</small></span><Icon name="check"/></div><div className="review-box"><h3>Periksa sebelum membayar</h3><p>Dengan melanjutkan, stok akan direservasi selama maksimal 24 jam. Status pembayaran akan dikonfirmasi oleh webhook server.</p></div><div className="form-actions"><Button variant="ghost" onClick={()=>setStep(2)} disabled={submitting}>Kembali</Button><Button onClick={submitOrder} disabled={submitting} aria-busy={submitting}>{submitting?'Membuat pesanan…':<>Buat pesanan <Icon name="arrow"/></>}</Button></div></div>}
  </section><OrderSummary cart={cart} shipping={shipping} voucher={voucherValue} totalLabel="Total pembayaran"/></div></main>;
}

function Payment({ order, navigate }) {
  const [status,setStatus]=useState('pending');
  if(!order)return <main className="status-page"><div className="status-symbol"><Icon name="package" size={34}/></div><h1>Belum ada pesanan untuk dibayar</h1><p>Buat pesanan dari keranjang agar nomor dan total pembayaran dapat diverifikasi.</p><Button onClick={()=>navigate('cart')}>Buka keranjang</Button></main>;
  const copy={pending:['Menunggu pembayaran','Selesaikan pembayaran dalam 24 jam'],success:['Pembayaran terkonfirmasi','Pesanan siap diproses'],expired:['Pembayaran kedaluwarsa','Waktu pembayaran telah berakhir'],failed:['Pembayaran belum berhasil','Coba metode pembayaran kembali']}[status];
  return <main className="status-page"><div className={`status-symbol ${status}`}><Icon name={status==='success'?'check':'package'} size={34}/></div><p className="status-label" role="status" aria-live="polite">{copy[0]}</p><h1>{copy[1]}</h1><p>Nomor pesanan <strong>{order.number}</strong>. Status pembayaran akan diperbarui oleh webhook Midtrans pada backend.</p><div className="payment-box"><span>Total pembayaran<strong>{rupiah(order.total)}</strong></span><span>Batas pembayaran<strong>{status==='expired'?'Telah berakhir':'23 Agustus 2026, 14.30 WIB'}</strong></span></div>{status==='pending'&&<Button onClick={()=>window.location.assign(order.redirectUrl)}>Lanjutkan ke Midtrans</Button>}{status==='success'&&<Button onClick={()=>navigate('tracking')}>Lacak pesanan <Icon name="arrow"/></Button>}{status==='failed'&&<Button onClick={()=>setStatus('pending')}>Coba pembayaran lagi</Button>}{status==='expired'&&<Button onClick={()=>navigate('cart')}>Buat pesanan baru</Button>}<button className="text-link" onClick={()=>navigate('home')}>Kembali ke beranda</button></main>;
}

function Tracking({ order, navigate, user }) {
  const [number,setNumber]=useState(order?.number||''); const [email,setEmail]=useState(user?.email||''); const [found,setFound]=useState(Boolean(order)); const [error,setError]=useState('');
  const submit=async e=>{e.preventDefault();try{await api.track({order_number:number,email});setFound(true);setError('')}catch{setFound(false);setError('Pesanan tidak ditemukan. Periksa kembali nomor pesanan dan email yang digunakan saat checkout.')}};
  return <main className="tracking-page"><div className="tracking-intro"><h1>Lacak perjalanan pesananmu</h1><p>Masukkan nomor pesanan dan email yang digunakan saat checkout.</p><form onSubmit={submit}><label>Nomor pesanan<input value={number} onChange={e=>setNumber(e.target.value)} placeholder="GS-YYYYMMDD-00000"/></label><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><Button type="submit">Lacak pesanan</Button></form>{error&&<p className="notice error">{error}</p>}{found&&!user&&<div className="guest-conversion"><strong>Simpan pesanan ini ke akun</strong><p>Masuk dengan Google memakai email yang sama agar pesanan yang memenuhi syarat dapat ditautkan.</p><Button variant="secondary" onClick={()=>navigate('login')}>Masuk dan tautkan pesanan</Button></div>}</div>{found&&<section className="tracking-card"><div className="tracking-card__head"><div><span>Nomor pesanan</span><h2>{number}</h2></div><strong>Diproses</strong></div><div className="tracking-meta"><span>Estimasi tiba<strong>25–27 Agustus 2026</strong></span><span>Kurir<strong>Reguler · Resi menunggu</strong></span></div><div className="timeline">{[['Pesanan dibuat','22 Agu · 14.30',true],['Pembayaran terkonfirmasi','22 Agu · 14.32',true],['Pesanan diproses','Sedang disiapkan',true],['Dikirim','Menunggu kurir',false],['Diterima','Belum tersedia',false]].map(([title,sub,done],i)=><div className={done?'done':''} key={title}><span>{done?<Icon name="check"/>:i+1}</span><p><strong>{title}</strong><small>{sub}</small></p></div>)}</div><p className="demo-note">Status diverifikasi langsung oleh backend menggunakan nomor pesanan dan email checkout.</p></section>}</main>;
}

function Login({ navigate, onLogin, returnTo }) {
  const [status,setStatus]=useState('idle');
  const login=()=>{setStatus('loading');window.setTimeout(()=>{onLogin();navigate(returnTo||'profile')},650)};
  return <main className="auth-login"><section className="login-copy"><button className="back-link" onClick={()=>navigate('home')}><Icon name="back"/> Kembali ke toko</button><h1>Satu akun untuk langkah berikutnya.</h1><p>Simpan alamat, lihat riwayat pesanan, dan lanjutkan belanja dengan data yang sudah dikenali.</p><div className="auth-route" aria-hidden="true"><span>Temukan</span><i/><span>Beli</span><i/><strong>Ikuti</strong></div></section><section className="login-panel" aria-labelledby="login-title"><img src={logoGutShoes} alt=""/><h2 id="login-title">Masuk ke GutShoes</h2><p>Gunakan akun Google sebagai identitas utama. Email dari Google tidak dapat diubah di GutShoes.</p><Feedback type="success">Login aman melalui Google OAuth. Kamu akan kembali ke GutShoes setelah verifikasi.</Feedback><Button className="google-button" onClick={login} disabled={status==='loading'} aria-busy={status==='loading'}><span className="google-mark" aria-hidden="true">G</span>{status==='loading'?'Menghubungkan akun…':'Lanjutkan dengan Google'}</Button><small>Guest checkout tetap tersedia tanpa membuat akun.</small></section></main>;
}

function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onCancel }) {
  const ref=useRef(null);
  useEffect(()=>{const dialog=ref.current;if(open&&!dialog.open)dialog.showModal();if(!open&&dialog.open)dialog.close()},[open]);
  return <dialog ref={ref} className="confirm-dialog" onCancel={e=>{e.preventDefault();onCancel()}} aria-labelledby="confirm-title"><strong id="confirm-title">{title}</strong><p>{description}</p><div><Button variant="ghost" onClick={onCancel}>Batal</Button><Button variant="secondary" onClick={onConfirm}>{confirmLabel}</Button></div></dialog>;
}

function AccountShell({ active, navigate, user, children, onLogout }) {
  const [confirming,setConfirming]=useState(false);
  const tabs=[['profile','Profil'],['addresses','Alamat'],['orders','Pesanan']];
  return <main className="account-page"><ConfirmDialog open={confirming} title="Keluar dari akun?" description="Data akun demo tersimpan di browser perangkat ini sampai kamu keluar atau menghapus data situs. Keranjang tetap tersedia." confirmLabel="Ya, keluar" onCancel={()=>setConfirming(false)} onConfirm={onLogout}/><header className="account-head"><div className="profile-avatar" aria-hidden="true">{user.name.charAt(0)}</div><div><h1>Halo, {user.name.split(' ')[0]}</h1><p>{user.email} · Akun demo</p></div></header><div className="account-layout"><aside className="account-nav" aria-label="Menu akun">{tabs.map(([page,label])=><button key={page} className={active===page?'active':''} aria-current={active===page?'page':undefined} onClick={()=>navigate(page)}>{label}<Icon name="chevron"/></button>)}<button className="logout-link" onClick={()=>setConfirming(true)}>Keluar</button></aside><section className="account-content">{children}</section></div></main>;
}

function Profile({ user, setUser, navigate, onLogout }) {
  const [name,setName]=useState(user.name); const [phone,setPhone]=useState(user.phone); const [saved,setSaved]=useState('');
  const submit=e=>{e.preventDefault();setUser({...user,name:name.trim(),phone:phone.trim(),updated:'22 Agustus 2026, 16.10 WIB'});setSaved('Perubahan profil tersimpan di sesi demo ini.')};
  return <AccountShell active="profile" navigate={navigate} user={user} onLogout={onLogout}><div className="account-title"><div><h2>Profil</h2><p>Informasi kontak untuk pembaruan dan pemenuhan pesanan.</p></div><span className="account-status"><Icon name="check"/> Terhubung ke Google · demo</span></div><form className="profile-form" onSubmit={submit}><label>Nama lengkap<input required maxLength="100" autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label><label>Email Google<input disabled value={user.email}/><small>Email adalah identitas utama dan tidak dapat diubah.</small></label><label>Nomor telepon<input required inputMode="tel" autoComplete="tel" pattern="[0-9+ -]{8,20}" value={phone} onChange={e=>setPhone(e.target.value)}/></label><div className="profile-meta"><span>Akun dibuat<strong>{user.created}</strong></span><span>Terakhir diperbarui<strong>{user.updated}</strong></span></div><Feedback type="success">{saved}</Feedback><Button type="submit">Simpan perubahan</Button></form></AccountShell>;
}

function Addresses({ user, addresses, setAddresses, navigate, onLogout }) {
  const blank={id:null,label:'Rumah',recipient:user.name,phone:user.phone,address:'',city:'Jakarta Selatan',province:'DKI Jakarta',postal:'',isDefault:false};
  const [editing,setEditing]=useState(null); const [notice,setNotice]=useState(''); const [removeId,setRemoveId]=useState(null);
  const save=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));const next={...blank,...data,id:editing?.id||Date.now(),isDefault:editing?.isDefault||addresses.length===0};setAddresses(prev=>editing?.id?prev.map(a=>a.id===editing.id?next:a):[...prev,next]);setEditing(null);setNotice('Alamat tersimpan di sesi demo.')};
  const remove=()=>{setAddresses(prev=>{const kept=prev.filter(a=>a.id!==removeId);return kept.length&&!kept.some(a=>a.isDefault)?kept.map((a,i)=>({...a,isDefault:i===0})):kept});setRemoveId(null);setNotice('Alamat dihapus.')};
  const makeDefault=id=>{setAddresses(prev=>prev.map(a=>({...a,isDefault:a.id===id})));setNotice('Alamat utama diperbarui.')};
  const formValue=editing||blank;
  return <AccountShell active="addresses" navigate={navigate} user={user} onLogout={onLogout}><div className="account-title"><div><h2>Alamat</h2><p>Simpan beberapa tujuan pengiriman dan tentukan alamat utama.</p></div><Button onClick={()=>setEditing(blank)}>Tambah alamat</Button></div><Feedback type="success">{notice}</Feedback>{editing&&<form className="address-form" onSubmit={save}><div className="address-form-head"><h3>{editing.id?'Edit alamat':'Alamat baru'}</h3><button type="button" onClick={()=>setEditing(null)} aria-label="Tutup formulir"><Icon name="close"/></button></div><div className="form-grid"><label>Label alamat<input name="label" required maxLength="24" defaultValue={formValue.label}/></label><label>Nama penerima<input name="recipient" required autoComplete="name" defaultValue={formValue.recipient}/></label><label>Nomor telepon<input name="phone" required inputMode="tel" autoComplete="tel" pattern="[0-9+ -]{8,20}" defaultValue={formValue.phone}/></label><label className="span-2">Alamat lengkap<textarea name="address" required maxLength="300" autoComplete="street-address" defaultValue={formValue.address}/></label><label>Kota/Kabupaten<input name="city" required autoComplete="address-level2" defaultValue={formValue.city}/></label><label>Provinsi<input name="province" required autoComplete="address-level1" defaultValue={formValue.province}/></label><label>Kode pos<input name="postal" required inputMode="numeric" pattern="[0-9]{5}" autoComplete="postal-code" defaultValue={formValue.postal}/></label></div><div className="form-actions"><Button variant="ghost" type="button" onClick={()=>setEditing(null)}>Batal</Button><Button type="submit">Simpan alamat</Button></div></form>}{removeId&&<div className="delete-confirm" role="alertdialog" aria-labelledby="delete-title"><div><strong id="delete-title">Hapus alamat ini?</strong><p>Alamat yang sudah tersalin ke pesanan lama tidak ikut berubah.</p></div><div><Button variant="ghost" onClick={()=>setRemoveId(null)}>Batal</Button><Button variant="secondary" onClick={remove}>Hapus</Button></div></div>}<div className="address-list">{addresses.length?addresses.map(a=><article className="address-item" key={a.id}><div className="address-item-head"><h3>{a.label}</h3>{a.isDefault&&<span>Utama</span>}</div><strong>{a.recipient} · {a.phone}</strong><p>{a.address}<br/>{a.city}, {a.province} {a.postal}</p><div><button className="text-link" onClick={()=>setEditing(a)}>Edit</button>{!a.isDefault&&<button className="text-link" onClick={()=>makeDefault(a.id)}>Jadikan utama</button>}<button className="text-link danger-link" onClick={()=>setRemoveId(a.id)}>Hapus</button></div></article>):<div className="empty"><Icon name="locate" size={34}/><h3>Belum ada alamat tersimpan</h3><p>Tambahkan alamat agar checkout berikutnya lebih cepat.</p><Button onClick={()=>setEditing(blank)}>Tambah alamat pertama</Button></div>}</div></AccountShell>;
}

function LoginV2({ navigate, onLogin, returnTo }) {
  const [status, setStatus] = useState('idle');
  const login = () => { setStatus('loading'); onLogin(returnTo); };
  return <main className="auth-login"><section className="login-copy"><button className="back-link" onClick={() => navigate('home')}><Icon name="back"/> Kembali ke toko</button><h1>Satu akun untuk langkah berikutnya.</h1><p>Simpan alamat, lihat riwayat pesanan, dan lanjutkan belanja dengan data yang sudah dikenali.</p><div className="auth-route" aria-hidden="true"><span>Temukan</span><i/><span>Beli</span><i/><strong>Ikuti</strong></div></section><section className="login-panel" aria-labelledby="login-title"><img src={logoGutShoes} alt=""/><h2 id="login-title">Masuk ke GutShoes</h2><p>Gunakan akun Google sebagai identitas utama. Email dari Google tidak dapat diubah di GutShoes.</p><Feedback type="success">Login aman melalui Google OAuth. Kamu akan kembali ke GutShoes setelah verifikasi.</Feedback><Feedback>{status === 'error' ? 'Koneksi simulasi gagal. Periksa jaringan lalu coba masuk kembali.' : ''}</Feedback><Button className="google-button" onClick={login} disabled={status === 'loading'} aria-busy={status === 'loading'}><span className="google-mark" aria-hidden="true">G</span>{status === 'loading' ? 'Menghubungkan akun…' : 'Lanjutkan dengan Google'}</Button><button className="text-link login-error-demo" onClick={() => setStatus('error')}>Uji kondisi koneksi gagal</button><small>Guest checkout tetap tersedia tanpa membuat akun.</small></section></main>;
}

function AddressesV2({ user, addresses, setAddresses, navigate, onLogout }) {
  const blank = { id: null, label: 'Rumah', recipient: user.name, phone: user.phone, address: '', city: 'Jakarta Selatan', province: 'DKI Jakarta', postal: '', isDefault: false };
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const [removeId, setRemoveId] = useState(null);
  const save = event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const next = { ...blank, ...data, id: editing?.id || Date.now(), isDefault: editing?.isDefault || addresses.length === 0 };
    setAddresses(previous => editing?.id ? previous.map(address => address.id === editing.id ? next : address) : [...previous, next]);
    setEditing(null);
    setNotice('Alamat tersimpan di browser perangkat ini.');
  };
  const remove = () => {
    setAddresses(previous => {
      const kept = previous.filter(address => address.id !== removeId);
      return kept.length && !kept.some(address => address.isDefault) ? kept.map((address, index) => ({ ...address, isDefault: index === 0 })) : kept;
    });
    setRemoveId(null);
    setNotice('Alamat dihapus.');
  };
  const makeDefault = id => {
    setAddresses(previous => previous.map(address => ({ ...address, isDefault: address.id === id })));
    setNotice('Alamat utama diperbarui.');
  };
  const formValue = editing || blank;
  return <AccountShell active="addresses" navigate={navigate} user={user} onLogout={onLogout}>
    <ConfirmDialog open={Boolean(removeId)} title="Hapus alamat ini?" description="Alamat yang sudah tersalin ke pesanan lama tidak ikut berubah." confirmLabel="Hapus" onCancel={() => setRemoveId(null)} onConfirm={remove}/>
    <div className="account-title"><div><h2>Alamat</h2><p>Simpan beberapa tujuan pengiriman dan tentukan alamat utama.</p></div><Button onClick={() => setEditing(blank)}>Tambah alamat</Button></div>
    <Feedback type="success">{notice}</Feedback>
    {editing && <form className="address-form" onSubmit={save}><div className="address-form-head"><h3>{editing.id ? 'Edit alamat' : 'Alamat baru'}</h3><button type="button" onClick={() => setEditing(null)} aria-label="Tutup formulir"><Icon name="close"/></button></div><div className="form-grid"><label>Label alamat<input name="label" required maxLength="24" defaultValue={formValue.label}/></label><label>Nama penerima<input name="recipient" required maxLength="100" autoComplete="name" defaultValue={formValue.recipient}/></label><label>Nomor telepon<input name="phone" required inputMode="tel" autoComplete="tel" pattern="[0-9+ -]{8,20}" defaultValue={formValue.phone}/></label><label className="span-2">Alamat lengkap<textarea name="address" required maxLength="300" autoComplete="street-address" defaultValue={formValue.address}/></label><label>Kota/Kabupaten<input name="city" required maxLength="80" autoComplete="address-level2" defaultValue={formValue.city}/></label><label>Provinsi<input name="province" required maxLength="80" autoComplete="address-level1" defaultValue={formValue.province}/></label><label>Kode pos<input name="postal" required inputMode="numeric" pattern="[0-9]{5}" autoComplete="postal-code" defaultValue={formValue.postal}/></label></div><div className="form-actions"><Button variant="ghost" type="button" onClick={() => setEditing(null)}>Batal</Button><Button type="submit">Simpan alamat</Button></div></form>}
    <div className="address-list">{addresses.length ? addresses.map(address => <article className="address-item" key={address.id}><div className="address-item-head"><h3>{address.label}</h3>{address.isDefault && <span>Utama</span>}</div><strong>{address.recipient} · {address.phone}</strong><p>{address.address}<br/>{address.city}, {address.province} {address.postal}</p><div><button className="text-link" onClick={() => setEditing(address)}>Edit</button>{!address.isDefault && <button className="text-link" onClick={() => makeDefault(address.id)}>Jadikan utama</button>}<button className="text-link danger-link" onClick={() => setRemoveId(address.id)}>Hapus</button></div></article>) : <div className="empty"><Icon name="locate" size={34}/><h3>Belum ada alamat tersimpan</h3><p>Tambahkan alamat agar checkout berikutnya lebih cepat.</p><Button onClick={() => setEditing(blank)}>Tambah alamat pertama</Button></div>}</div>
  </AccountShell>;
}

function Orders({ user, order, navigate, onLogout }) {
  const demoOrders=order?[{number:order.number,date:'22 Agustus 2026',status:'Diproses',total:order.total,item:'Stride Flow · 1 produk'}]:[{number:'GS-20260812-00037',date:'12 Agustus 2026',status:'Diterima',total:717000,item:'Stride Flow · 1 produk'},{number:'GS-20260728-00018',date:'28 Juli 2026',status:'Diterima',total:631000,item:'Daily Court · 1 produk'}];
  return <AccountShell active="orders" navigate={navigate} user={user} onLogout={onLogout}><div className="account-title"><div><h2>Riwayat pesanan</h2><p>Pesanan demo yang terhubung dengan akun ini.</p></div></div><div className="order-history">{demoOrders.map(item=><article className="history-item" key={item.number}><div><span>{item.date}</span><h3>{item.number}</h3><p>{item.item}</p><small>Pembayaran · {item.status==='Diterima'?'Lunas':'Terkonfirmasi'}</small></div><div><strong>{rupiah(item.total)}</strong><span className={`order-state ${item.status==='Diterima'?'done':''}`}>{item.status}</span><button className="text-link" onClick={()=>navigate('order-detail',{orderNumber:item.number})}>Lihat detail <Icon name="arrow"/></button></div></article>)}</div><p className="demo-note">Riwayat ini bersifat demonstratif. Produksi hanya boleh menampilkan pesanan milik pelanggan yang tervalidasi server.</p></AccountShell>;
}

function OrderDetail({user,orderNumber,navigate,onLogout}){const [status,setStatus]=useState(orderNumber.includes('00037')?'DELIVERED':'PAID');const [refund,setRefund]=useState(null);const [confirm,setConfirm]=useState(false);const eligible=['PENDING_PAYMENT','PAID'].includes(status);const cancel=()=>{setStatus('CANCELLED');setRefund(status==='PAID'?'PENDING':null);setConfirm(false)};return <AccountShell active="orders" navigate={navigate} user={user} onLogout={onLogout}><ConfirmDialog open={confirm} title="Batalkan pesanan?" description={status==='PAID'?'Pembayaran sudah diterima. Pembatalan akan membuat permintaan refund untuk ditinjau admin.':'Reservasi stok akan dilepas setelah pembatalan dikonfirmasi backend.'} confirmLabel="Ya, batalkan" onCancel={()=>setConfirm(false)} onConfirm={cancel}/><button className="back-link" onClick={()=>navigate('orders')}><Icon name="back"/> Kembali ke riwayat</button><div className="order-detail-head"><div><span>DETAIL PESANAN</span><h2>{orderNumber}</h2><p>22 Agustus 2026 · Pembayaran terkonfirmasi</p></div><span className={`order-state ${status==='DELIVERED'?'done':''}`}>{status.replace('_',' ')}</span></div><div className="order-progress">{['PAID','PROCESSING','SHIPPED','DELIVERED'].map((x,i)=><div className={['PAID','PROCESSING','SHIPPED','DELIVERED'].indexOf(status)>=i?'done':''} key={x}><b>{i+1}</b><span>{x}</span></div>)}</div><section className="order-detail-block"><h3>Produk</h3><div className="order-product-line"><img src={products[0].image} alt=""/><span><strong>Stride Flow</strong><small>AeroRun · Ukuran 42 · SKU GS-1042-NAVY · 1 barang</small></span><strong>{rupiah(699000)}</strong></div></section><div className="order-detail-columns"><section className="order-detail-block"><h3>Pengiriman</h3><p>JNE Reguler · Rp18.000<br/>Jl. Contoh No. 17, Jakarta Selatan 12120<br/><strong>Resi:</strong> {status==='SHIPPED'||status==='DELIVERED'?'JNE0123456789':'Menunggu pengiriman'}</p></section><section className="order-detail-block"><h3>Ringkasan pembayaran</h3><p>Subtotal <strong>{rupiah(699000)}</strong><br/>Pengiriman <strong>{rupiah(18000)}</strong><br/>Total <strong>{rupiah(717000)}</strong></p></section></div>{refund&&<section className="refund-card"><div><span>REFUND TERPISAH DARI STATUS PESANAN</span><h3>Refund {refund}</h3><p>Permintaan sedang menunggu pemeriksaan admin. Hasilnya akan dikirim melalui email.</p></div><span className="order-state">{refund}</span></section>}{eligible&&<div className="order-danger-zone"><div><strong>Perlu membatalkan pesanan?</strong><p>Pembatalan hanya tersedia sebelum pesanan mulai diproses.</p></div><Button variant="secondary" onClick={()=>setConfirm(true)}>Ajukan pembatalan</Button></div>}<p className="demo-note">Detail dan transisi ini adalah simulasi frontend. Backend wajib memvalidasi kepemilikan, status, dan kelayakan pembatalan.</p></AccountShell>}

function Footer() { return <footer><div><img src={logoGutShoes} alt="GutShoes"/><p>Sepatu olahraga dengan informasi harga dan ukuran yang mudah dipahami.</p></div><div><strong>Belanja</strong><a href="#catalog">Semua sepatu</a><a href="#catalog?filter=Lari">Lari</a><a href="#catalog?filter=Training">Training</a></div><div><strong>Bantuan</strong><a href="#tracking">Lacak pesanan</a><span className="footer-pending" aria-disabled="true" title="Tersedia setelah backend layanan pelanggan terhubung">Pembatalan & refund · segera</span><span className="footer-pending" aria-disabled="true" title="Tersedia setelah kanal layanan pelanggan terhubung">Hubungi kami · segera</span></div><div><strong>Catatan</strong><p>Konten produk dan transaksi pada prototipe ini bersifat demonstrasi.</p></div></footer> }

export default function App() {
  const [route,setRoute]=useState(()=>readRoute()); const {page,data:pageData}=route; const [query,setQuery]=useState(''); const [cart,setCart]=useState([]); const [order,setOrder]=useState(null); const [returnTo,setReturnTo]=useState('profile');
  const [guestCartToken,setGuestCartToken]=useState(()=>sessionStorage.getItem('gutshoes-guest-cart')||'');
  const [,setCatalogRevision]=useState(0);
  const mainRef=useRef(null);
  const [user,setUser]=useState(null);
  const [addresses,setAddresses]=useState([]);
  useEffect(()=>{let active=true;Promise.all([api.me(),api.profile(),api.addresses()]).then(([session,profile,addressList])=>{if(!active)return;setUser({...session.data,phone:profile.data.phone||'',created:'—',updated:'—'});setAddresses(addressList.data.map(a=>({id:a.id,label:a.label,recipient:a.recipient_name,phone:a.phone,address:a.address_line,city:a.city,province:a.province,district:a.district,postal:a.postal_code,isDefault:a.is_default}))) }).catch(()=>{});return()=>{active=false}},[]);
  useEffect(()=>{let active=true;api.catalog({per_page:48}).then(response=>{if(!active||!response.data.length)return;const mapped=response.data.map((item,index)=>{const variants=item.variants;const stock=Object.fromEntries(variants.map(v=>[v.size,v.available_stock]));return {id:index+1,slug:item.slug,name:item.name,category:item.categories[0]?.name||'Sepatu',brand:item.brand.name,price:Math.min(...variants.map(v=>Number(v.price))),image:item.images[0]?.path?googleLoginUrl.replace('/api/v1/auth/google','')+'/storage/'+item.images[0].path:products[index%products.length]?.image,sizes:variants.map(v=>v.size),stock,tone:'navy',variants:variants.map(v=>({id:v.id,size:v.size,sku:v.sku,price:Number(v.price),weight:v.weight_grams,stock:v.available_stock}))}});products.splice(0,products.length,...mapped);setCatalogRevision(x=>x+1)}).catch(()=>{});return()=>{active=false}},[]);
  useEffect(()=>{const sync=()=>{setRoute(readRoute());window.scrollTo({top:0,behavior:'smooth'})};window.addEventListener('hashchange',sync);if(!window.location.hash)window.history.replaceState(null,'','#home');return()=>window.removeEventListener('hashchange',sync)},[]);
  useEffect(()=>{if(['profile','addresses','orders','order-detail'].includes(page)&&!user){setReturnTo(page);window.location.hash='#login'}},[page,user]);
  useEffect(()=>{mainRef.current?.focus()},[page]);
  const navigate=(next,data={})=>{const target=routeHash(next,data);if(window.location.hash===target){setRoute(readRoute());window.scrollTo({top:0,behavior:'smooth'})}else window.location.hash=target};
  const openProduct=p=>navigate('product',{product:p});
  const addToCart=async(product,size)=>{const variant=product.variants.find(v=>String(v.size)===String(size));if(!variant?.id)return;const response=await api.addCartItem(variant.id,1,guestCartToken);const token=response.data.guest_token||guestCartToken;if(token){setGuestCartToken(token);sessionStorage.setItem('gutshoes-guest-cart',token)}const backendItem=response.data.items.find(i=>i.product_variant_id===variant.id);setCart(prev=>{const ix=prev.findIndex(i=>i.product.id===product.id&&i.size===size);if(ix>=0)return prev.map((i,n)=>n===ix?{...i,qty:Math.min(i.qty+1,product.stock[size]),backendItemId:backendItem?.id}:i);return [...prev,{product,size,qty:1,backendItemId:backendItem?.id}]})};
  const updateQty=(item,delta)=>setCart(prev=>prev.map(i=>i===item?{...i,qty:Math.max(1,Math.min(i.qty+delta,i.product.stock[i.size]))}:i));
  const removeItem=item=>setCart(prev=>prev.filter(i=>i!==item));
  const createOrder=created=>setOrder(created);
  const login=()=>{window.location.assign(googleLoginUrl)};
  const logout=async()=>{try{await api.logout()}finally{setUser(null);setAddresses([]);setReturnTo('profile');navigate('home')}};
  const cartCount=cart.reduce((sum,i)=>sum+i.qty,0);
  if(page==='admin') return <AdminPanel section={pageData.section} navigate={(section)=>navigate('admin',{section})} onStorefront={()=>navigate('home')}/>;
  let content=<Home navigate={navigate} openProduct={openProduct}/>;
  if(page==='catalog')content=<Catalog query={query} setQuery={setQuery} openProduct={openProduct} initialFilter={pageData.filter}/>;
  if(page==='product')content=<ProductDetail product={pageData.product||products[0]} addToCart={addToCart} navigate={navigate}/>;
  if(page==='cart')content=<Cart cart={cart} updateQty={updateQty} removeItem={removeItem} navigate={navigate}/>;
  if(page==='checkout')content=<Checkout cart={cart} navigate={navigate} createOrder={createOrder} user={user} addresses={addresses} guestCartToken={guestCartToken}/>;
  if(page==='payment')content=<Payment order={order} navigate={navigate}/>;
  if(page==='tracking')content=<Tracking order={order} navigate={navigate} user={user}/>;
  if(page==='login')content=user?<Profile user={user} setUser={setUser} navigate={navigate} onLogout={logout}/>:<LoginV2 navigate={navigate} onLogin={login} returnTo={returnTo}/>;
  if(page==='profile'&&user)content=<Profile user={user} setUser={setUser} navigate={navigate} onLogout={logout}/>;
  if(page==='addresses'&&user)content=<AddressesV2 user={user} addresses={addresses} setAddresses={setAddresses} navigate={navigate} onLogout={logout}/>;
  if(page==='orders'&&user)content=<Orders user={user} order={order} navigate={navigate} onLogout={logout}/>;
  if(page==='order-detail'&&user)content=<OrderDetail user={user} orderNumber={pageData.orderNumber} navigate={navigate} onLogout={logout}/>;
  return <div className="app"><a className="skip-link" href="#main">Lewati ke konten</a><Header cartCount={cartCount} navigate={navigate} query={query} setQuery={setQuery} user={user} page={page}/><div id="main" className="main-focus" ref={mainRef} tabIndex="-1">{content}</div><Footer/></div>;
}

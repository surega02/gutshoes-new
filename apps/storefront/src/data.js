import runningBlue from './assets/products/running-blue.webp';
import trainingBlack from './assets/products/training-black.webp';
import lifestyleCream from './assets/products/lifestyle-cream.webp';
import kidsNavy from './assets/products/kids-navy.webp';
import basketballWhite from './assets/products/basketball-white.webp';
import futsalRed from './assets/products/futsal-red.webp';

export const products = [
  { id: 1, name: 'Stride Flow', category: 'Lari', brand: 'AeroRun', price: 699000, image: runningBlue, sizes: [39, 40, 41, 42, 43], stock: {39: 3, 40: 6, 41: 4, 42: 2, 43: 0}, tone: 'navy' },
  { id: 2, name: 'Core Trainer', category: 'Training', brand: 'Motion Lab', price: 749000, image: trainingBlack, sizes: [39, 40, 41, 42, 43], stock: {39: 0, 40: 2, 41: 5, 42: 5, 43: 1}, tone: 'black' },
  { id: 3, name: 'Daily Court', category: 'Kasual', brand: 'North Street', price: 599000, image: lifestyleCream, sizes: [38, 39, 40, 41, 42], stock: {38: 2, 39: 3, 40: 7, 41: 4, 42: 2}, tone: 'cream' },
  { id: 4, name: 'Junior Dash', category: 'Anak', brand: 'AeroRun', price: 449000, image: kidsNavy, sizes: [32, 33, 34, 35, 36], stock: {32: 2, 33: 4, 34: 0, 35: 6, 36: 1}, tone: 'navy' },
  { id: 5, name: 'Elevate High', category: 'Basket', brand: 'Motion Lab', price: 899000, image: basketballWhite, sizes: [39, 40, 41, 42, 43, 44], stock: {39: 1, 40: 3, 41: 4, 42: 4, 43: 2, 44: 0}, tone: 'white' },
  { id: 6, name: 'Swift Indoor', category: 'Futsal', brand: 'Field One', price: 679000, image: futsalRed, sizes: [39, 40, 41, 42, 43], stock: {39: 0, 40: 2, 41: 3, 42: 1, 43: 0}, tone: 'red' },
];

// Metadata varian demonstratif. Backend tetap menjadi sumber kebenaran untuk harga dan stok.
products.forEach(product => {
  product.variants = product.sizes.map((size, index) => ({
    size,
    sku: `GS-${String(product.id).padStart(2, '0')}-${size}-${product.tone.toUpperCase()}`,
    price: product.price + (index === product.sizes.length - 1 ? 20000 : 0),
    weight: 900,
    stock: product.stock[size],
  }));
});

export const categories = ['Lari', 'Training', 'Kasual', 'Anak', 'Basket', 'Futsal'];

export const rupiah = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

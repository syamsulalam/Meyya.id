import Database from 'better-sqlite3';

const db = new Database('meyya.db');
const products = db.prepare('SELECT id, name, is_active FROM products;').all();
console.log('Products:', products);

const categories = db.prepare('SELECT id, name, slug, image_url FROM categories;').all();
console.log('Categories:', categories);

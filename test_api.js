import fetch from 'node-fetch';

(async () => {
    const res = await fetch('http://localhost:3000/api/products');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
})();

const aes = new Aes();
aes.setKey('key');
aes.setCtr(3);
const encrypted = aes.encrypt('test');
console.log(encrypted);
const decrypted = aes.decrypt(encrypted);
console.log(decrypted);
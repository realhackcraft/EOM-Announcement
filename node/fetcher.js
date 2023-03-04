const sheetDB = require('sheetdb-node');
const client = sheetDB({ address: "ks0eqvwv8habb" })
const fs = require('fs');

let data;

client.read().then((sheet) => {
  data = JSON.parse(sheet);
  for (let i = 0; i < data.length; i++) {
    response = data[i];
    fs.writeFileSync(`./responses/${i}.json`, JSON.stringify(response))
  }
})

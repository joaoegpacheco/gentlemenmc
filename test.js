'use server'

const Test = async (values) => {

  const fs = require('fs')
  const DB = require('../../../comandas.json')

  DB.users.push(values);

  fs.writeFile('comandas.json', JSON.stringify(DB), 'utf8', (err) => {
    if (err) {
      console.error('Ocorreu um erro ao gravar:', err);
      return;
    }
    console.log('Comanda cadastrada com sucesso.');
  });

}



export default Test;
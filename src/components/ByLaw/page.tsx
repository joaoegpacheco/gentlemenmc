"use client";

const ByLaw = () => (
  <object 
    data="/estatuto.pdf" 
    type="application/pdf" 
    style={{ width: '100%', height: '500px' }}
  >
    <p>
      Seu navegador não tem um plugin para PDF. 
      <a href="/estatuto.pdf">Clique aqui</a> para baixar o arquivo.
    </p>
  </object>
);

export default ByLaw;

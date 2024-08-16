"use client";
// import Link from 'next/link';

const ByLaw = () => {
  return (
    <object data="/estatuto.pdf" type="application/pdf" width="100%" height="500">
        <p>Seu navegador não tem um plugin pra PDF. <a href="/estatuto.pdf">Clique aqui</a> para baixar o arquivo.</p>
    </object>
  );
};

export default ByLaw;

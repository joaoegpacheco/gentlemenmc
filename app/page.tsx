
export default function Home() {
  return (
    <>
    <main>



        <nav className="navbar navbar-expand-lg navbarPosition">
            <div className="container">
                <a className="navbar-brand" href="index.html">
                    GENTLEMEN MC
                </a>

                

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                    aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav align-items-lg-center ms-auto me-lg-5">
                        <li className="nav-item">
                            <a className="nav-link click-scroll" href="#section_1">Início</a>
                        </li>

                        <li className="nav-item">
                            <a className="nav-link click-scroll" href="#section_2">Sobre</a>
                        </li>

                        <li className="nav-item">
                            <a className="nav-link click-scroll" href="#section_3">Comando e Diretoria</a>
                        </li>

                        <li className="nav-item">
                            <a className="nav-link click-scroll" href="#section_6">Sede</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>


        <section className="hero-section" id="section_1">
            <div className="section-overlay"></div>

            <div className="container d-flex justify-content-center align-items-center">
                <div className="row">

                    <div className="col-12 mt-auto mb-5 text-center">

                        <h1 className="text-white mb-5"><img src="images/LOGO GENTLEMEN.png" width="30%" /></h1>

                        <a className="btn custom-btn smoothscroll" href="#section_2">Conheça o MC</a>
                    </div>

                    <div className="col-lg-12 col-12 mt-auto d-flex flex-column flex-lg-row text-center">
                        <div className="date-wrap">
                            <h5 className="text-white">
                                <i className="custom-icon bi-clock me-2"></i>
                                22<sup></sup> mar 2024
                            </h5>
                        </div>

                        <div className="location-wrap mx-auto py-3 py-lg-0">
                            <h5 className="text-white">
                                <i className="custom-icon bi-geo-alt me-2"></i>
                                Nova Sede
                            </h5>
                        </div>

                        <div className="social-share">
                            <ul className="social-icon d-flex align-items-center justify-content-center">
                                <span className="text-white me-3">Siga</span>
                                <li className="social-icon-item">
                                    <a href="https://instagram.com/gentlemenmotoclube" className="social-icon-link">
                                        <span className="bi-instagram"></span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="video-wrap">
                <video className="custom-video" loop muted controls autoPlay preload="auto" aria-label="Video player">
                    <source src="video/nova-sede.mp4" type="video/mp4" />

                    Your browser does not support the video tag.
                </video>
            </div>
        </section>


        <section className="about-section section-padding" id="section_2">
            <div className="container">
                <div className="row">

                    <div className="col-lg-6 col-12 mb-4 mb-lg-0 d-flex align-items-center">
                        <div className="services-info">
                            <h2 className="text-white mb-4">Sobre o Gentlemen MC</h2>

                            <p className="text-white">Fundado em 2017, o Gentlemen MC é mais do que um motoclube, é uma família unida pela paixão por motocicletas. Nosso brasão é de um verdadeiro cavalheiro, que compartilha valores de respeito e solidariedade.</p>

                            <h6 className="text-white mt-4">Brotherhood, liberty and charity</h6>

                            <p className="text-white">Através de ações e voluntariado, deixamos nossa marca em cada curva, em cada quilômetro percorrido.</p>

                            <h6 className="text-white mt-4">Acesse nossas redes sociais</h6>

                            <p className="text-white">Acesse nossas redes sociais para conhecer mais sobre nosso trabalho</p>
                        </div>
                    </div>

                    <div className="col-lg-6 col-12">
                        <div className="about-text-wrap">
                            <img src="images/membros.jpg" className="about-image img-fluid" width="80%" />
                        </div>
                    </div>

                </div>
            </div>
        </section>


        <section className="artists-section section-padding" id="section_3">
            <div className="container">
                <div className="row justify-content-center">

                    <div className="col-12 text-center">
                        <h2 className="mb-4">Comando e Diretoria</h2>
                    </div>

                    <div className="col-lg-5 col-12">
                        <div className="artists-thumb">
                            <div className="artists-image-wrap">
                                <img src="images/alex.png"
                                    className="artists-image img-fluid"/>
                            </div>

                            <div className="artists-hover">
                                <p>
                                    <strong>Nome:</strong>
                                    Alex
                                </p>

                                <p>
                                    <strong>Cargo:</strong>
                                    President
                                </p>

                                <p>
                                    <strong>Moto:</strong>
                                    Harley Davidson Ultra Limited
                                </p>
                            </div>
                        </div>
                        <div className="artists-thumb">
                            <img src="images/giuliano2.png"
                                className="artists-image img-fluid"/>

                             <div className="artists-hover">
                                <p>
                                    <strong>Nome:</strong>
                                    Giuliano
                                </p>

                                <p>
                                    <strong>Cargo:</strong>
                                    Secretary
                                </p>

                                <p>
                                    <strong>Moto:</strong>
                                    Harley Davidson Road Glide Special
                                </p>
                            </div>
                        </div>   
                    </div>

                    <div className="col-lg-5 col-12">
                        <div className="artists-thumb">
                            <div className="artists-image-wrap">
                                <img src="images/weriton.png"
                                    className="artists-image img-fluid" width="80%"/>
                            </div>

                             <div className="artists-hover">
                                <p>
                                    <strong>Nome:</strong>
                                    Weriton
                                </p>

                                <p>
                                    <strong>Cargo:</strong>
                                    Vice President
                                </p>

                                <p>
                                    <strong>Moto:</strong>
                                    Harley Davidson Ultra Limited
                                </p>
                            </div>
                        </div>

                        <div className="artists-thumb">
                            <div className="artists-image-wrap">
                                <img src="images/pacheco.png"
                                    className="artists-image img-fluid" width="80%"/>
                            </div>

                             <div className="artists-hover">
                                <p>
                                    <strong>Nome:</strong>
                                    Pacheco
                                </p>

                                <p>
                                    <strong>Cargo:</strong>
                                    Treasurer
                                </p>

                                <p>
                                    <strong>Moto:</strong>
                                    Harley Davidson Fat Boy 114
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-5 col-12">
                       

                        <div className="artists-thumb">
                            <div className="artists-image-wrap">
                                <img src="images/mortari2.png"
                                    className="artists-image img-fluid" width="80%"/>
                            </div>

                             <div className="artists-hover">
                                <p>
                                    <strong>Nome:</strong>
                                    Mortari
                                </p>

                                <p>
                                    <strong>Cargo:</strong>
                                    Road Captain
                                </p>

                                <p>
                                    <strong>Moto:</strong>
                                    Harley Davidson Road Glide Ultra
                                </p>
                            </div>
                        </div>
                    </div>
                     <div className="col-lg-5 col-12">
                        <div className="artists-thumb">
                            <div className="artists-image-wrap">
                                <img src="images/zanona.png"
                                    className="artists-image img-fluid" width="80%"/>
                            </div>

                             <div className="artists-hover">
                                <p>
                                    <strong>Nome:</strong>
                                    Zanona
                                </p>

                                <p>
                                    <strong>Cargo:</strong>
                                    Sgt at Arms
                                </p>

                                <p>
                                    <strong>Moto:</strong>
                                    Harley Davidson Road Glide Special
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-5 col-12">
                       

                        <div className="artists-thumb">
                            <div className="artists-image-wrap">
                                <img src="images/rafael.png"
                                    className="artists-image img-fluid" width="80%"/>
                            </div>

                             <div className="artists-hover">
                                <p>
                                    <strong>Nome:</strong>
                                    Rafael
                                </p>

                                <p>
                                    <strong>Cargo:</strong>
                                    Lawyer
                                </p>

                                <p>
                                    <strong>Moto:</strong>
                                    Harley Davidson Heritage Classic
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section className="contact-section section-padding" id="section_6">
            <div className="container">
                <div className="row">

                    <div className="col-lg-8 col-12 mx-auto">
                        <h2 className="text-center mb-4">Sede Nacional Gentlemen MC</h2>

                        <div className="tab-content shadow-lg mt-5" id="nav-tabContent">
                   

                            <div className="tab-pane fade show active" id="nav-ContactMap" role="tabpanel"
                                aria-labelledby="nav-ContactMap-tab">
                                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3602.8955228386017!2d-49.31015548926185!3d-25.44175623326291!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94dce32e320e4e6b%3A0x246b9238854b4079!2sGentlemen%20Moto%20Clube!5e0!3m2!1spt-BR!2sbr!4v1693951892274!5m2!1spt-BR!2sbr" width="100%" height="450" style={{border:0}} loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    </main>


    <footer className="site-footer">
        <div className="site-footer-top">
            <div className="container">
                <div className="row">

                    <div className="col-lg-6 col-12">
                        <h2 className="text-white mb-lg-0">Brotherhood, liberty and charity</h2>
                    </div>

                    <div className="col-lg-6 col-12 d-flex justify-content-lg-end align-items-center">
                        <ul className="social-icon d-flex justify-content-lg-end">
                            <li className="social-icon-item">
                                <a href="https://instagram.com/gentlemenmotoclube" className="social-icon-link">
                                        <span className="bi-instagram"></span>
                                    </a>
                            </li>

                            <li className="social-icon-item">
                                <a href="https://youtu.be/5xihWF5fTrs?si=PmJYfepiKQmOpB8C" className="social-icon-link">
                                    <span className="bi-youtube"></span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div className="container">
            <div className="row">

                <div className="col-lg-6 col-12 mb-4 pb-2">
                    <h5 className="site-footer-title mb-3">Links</h5>

                    <ul className="site-footer-links">
                        <li className="site-footer-link-item">
                            <a href="#section_1" className="site-footer-link">Início</a>
                        </li>

                        <li className="site-footer-link-item">
                            <a href="#section_2" className="site-footer-link">Sobre</a>
                        </li>

                        <li className="site-footer-link-item">
                            <a href="#section_3" className="site-footer-link">Comando & Diretoria</a>
                        </li>

                        <li className="site-footer-link-item">
                            <a href="#section_6"  className="site-footer-link">Sede</a>
                        </li>
                    </ul>
                </div>

                <div className="col-lg-3 col-md-6 col-12 mb-4 mb-lg-0">
                    <h5 className="site-footer-title mb-3">Conheça o clube</h5>

                    <p className="text-white d-flex mb-1">
                        <a href="https://wa.me/5541984300412" className="site-footer-link">
                            Fale conosco pelo whatsapp
                        </a>
                    </p>

                    <p className="text-white d-flex">
                        <a href="mailto:contato@gentlemenmc.com.br" className="site-footer-link">
                            contato@gentlemenmc.com.br
                        </a>
                    </p>
                </div>

                <div className="col-lg-3 col-md-6 col-11 mb-4 mb-lg-0 mb-md-0">
                    <h5 className="site-footer-title mb-3">Sede</h5>

                    <p className="text-white d-flex mt-3 mb-2">
                        R. Maj. Heitor Guimarães, 155 - Seminário - Curitiba/PR</p>
                </div>
            </div>
        </div>

        <div className="site-footer-bottom">
            <div className="container">
                <div className="row">

                    <div className="col-lg-3 col-12 mt-5">
                        <p className="copyright-text">Copyright © 2024 Gentlemen MC</p>
                    </div>
                </div>
            </div>
        </div>
    </footer>
  </>
  );
}

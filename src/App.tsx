import React, { useEffect } from 'react';
import './App.css';

// jQuery-like functionality for carousel
declare global {
  interface Window {
    $: any;
    jQuery: any;
  }
}

function App() {
  useEffect(() => {
    // Load jQuery
    const script = document.createElement('script');
    script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
    script.onload = () => {
      window.$ = window.jQuery;
      initializeCarousels();
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const initializeCarousels = () => {
    // Multiple Carousel Management System
    let carousels: any = {};
    let disabled = false;

    const SPIN_FORWARD_CLASS = 'js-spin-fwd';
    const SPIN_BACKWARD_CLASS = 'js-spin-bwd';
    const DISABLE_TRANSITIONS_CLASS = 'js-transitions-disabled';
    const SPIN_DUR = 1000;

    // Initialize carousel data structure
    const initCarousel = (carouselId: string) => {
        carousels[carouselId] = {
            activeIndex: 0,
            limit: 0,
            $stage: null,
            $controls: null,
            canvas: false
        };
    };

    const appendControls = (carouselId: string) => {
        const carousel = carousels[carouselId];
        const $control = window.$(`.carousel__control[data-carousel="${carouselId}"]`);
        
        for (let i = 0; i < carousel.limit; i++) {
            $control.append(`<a href="#" data-index="${i}" data-carousel="${carouselId}"></a>`);
        }
        
        let height = $control.children().last().outerHeight();
        $control.css('height', (30 + (carousel.limit * height)));
        
        carousel.$controls = $control.children();
        carousel.$controls.eq(carousel.activeIndex).addClass('active');
    };

    const setIndexes = (carouselId: string) => {
        const carousel = carousels[carouselId];
        window.$(`#carousel-${carouselId} .spinner`).children().each((i: number, el: any) => {
            window.$(el).attr('data-index', i);
            carousel.limit++;
        });
    };

    const duplicateSpinner = (carouselId: string) => {
        const $el = window.$(`#carousel-${carouselId} .spinner`).parent();
        const html = window.$(`#carousel-${carouselId} .spinner`).parent().html();
        $el.append(html);
        window.$(`#carousel-${carouselId} .spinner`).last().addClass('spinner--right');
        window.$(`#carousel-${carouselId} .spinner--right`).removeClass('spinner--left');
    };

    const paintFaces = (carouselId: string) => {
        window.$(`#carousel-${carouselId} .spinner__face`).each((i: number, el: any) => {
            const $el = window.$(el);
            let color = window.$(el).attr('data-bg');
            $el.children().css('backgroundImage', `url(${getBase64PixelByColor(color, carouselId)})`);
        });
    };

    const getBase64PixelByColor = (hex: string, carouselId: string) => {
        const carousel = carousels[carouselId];
        if (!carousel.canvas) {
            carousel.canvas = document.createElement('canvas');
            carousel.canvas.height = 1;
            carousel.canvas.width = 1;
        }
        if (carousel.canvas.getContext) {
            const ctx = carousel.canvas.getContext('2d');
            ctx.fillStyle = hex;
            ctx.fillRect(0, 0, 1, 1);
            return carousel.canvas.toDataURL();
        }
        return false;
    };

    const prepareDom = (carouselId: string) => {
        setIndexes(carouselId);
        paintFaces(carouselId);
        duplicateSpinner(carouselId);
        appendControls(carouselId);
    };

    const spin = (inc = 1, carouselId: string) => {
        if (disabled) return;
        if (!inc) return;
        
        const carousel = carousels[carouselId];
        carousel.activeIndex += inc;
        disabled = true;

        if (carousel.activeIndex >= carousel.limit) {
            carousel.activeIndex = 0;
        }
      
        if (carousel.activeIndex < 0) {
            carousel.activeIndex = (carousel.limit - 1);
        }

        const $activeEls = window.$(`#carousel-${carouselId} .spinner__face.js-active`);
        const $nextEls = window.$(`#carousel-${carouselId} .spinner__face[data-index=${carousel.activeIndex}]`);
        $nextEls.addClass('js-next');
      
        if (inc > 0) {
            carousel.$stage.addClass(SPIN_FORWARD_CLASS);
        } else {
            carousel.$stage.addClass(SPIN_BACKWARD_CLASS);
        }
        
        carousel.$controls.removeClass('active');
        carousel.$controls.eq(carousel.activeIndex).addClass('active');
      
        setTimeout(() => {
            spinCallback(inc, carouselId);
        }, SPIN_DUR, inc);
    };

    const spinCallback = (inc: number, carouselId: string) => {
        const carousel = carousels[carouselId];
        
        window.$(`#carousel-${carouselId} .js-active`).removeClass('js-active');
        window.$(`#carousel-${carouselId} .js-next`).removeClass('js-next').addClass('js-active');
        
        carousel.$stage
            .addClass(DISABLE_TRANSITIONS_CLASS)
            .removeClass(SPIN_FORWARD_CLASS)
            .removeClass(SPIN_BACKWARD_CLASS);
      
        window.$(`#carousel-${carouselId} .js-active`).each((i: number, el: any) => {
            const $el = window.$(el);
            $el.prependTo($el.parent());
        });
        
        setTimeout(() => {
            carousel.$stage.removeClass(DISABLE_TRANSITIONS_CLASS);
            disabled = false;
        }, 100);
    };

    const attachListeners = () => {
        // Global keyboard navigation - only works for visible carousel
        document.onkeyup = (e) => {
            // Find which carousel is currently in viewport
            let visibleCarousel = null;
            window.$('.carousel-section').each(function() {
                const rect = this.getBoundingClientRect();
                if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                    const carouselId = this.id.split('-')[1];
                    visibleCarousel = carouselId;
                    return false; // break the loop
                }
            });
            
            if (visibleCarousel) {
                switch (e.keyCode) {
                    case 38: // Up arrow
                        spin(-1, visibleCarousel);
                        break;
                    case 40: // Down arrow
                        spin(1, visibleCarousel);
                        break;
                }
            }
        };
     
        // Control clicks for each carousel
        window.$(document).on('click', '.carousel__control a', function(e: any) {
            e.preventDefault();
            if (disabled) return;
            
            const $el = window.$(e.target);
            const carouselId = $el.attr('data-carousel');
            const toIndex = parseInt($el.attr('data-index'), 10);
            const carousel = carousels[carouselId];
            
            spin(toIndex - carousel.activeIndex, carouselId);
        });
    };

    const assignEls = (carouselId: string) => {
        const carousel = carousels[carouselId];
        carousel.$stage = window.$(`#carousel-${carouselId} .carousel__stage`);
    };

    const initSingleCarousel = (carouselId: string) => {
        initCarousel(carouselId);
        assignEls(carouselId);
        prepareDom(carouselId);
    };

    const init = () => {
        // Initialize all carousels
        for (let i = 1; i <= 5; i++) {
            initSingleCarousel(i.toString());
        }
        
        // Attach global listeners
        attachListeners();
        
        // Smooth scrolling for anchor links
        window.$('a[href^="#"]').on('click', function(e: any) {
            e.preventDefault();
            const target = window.$(this.getAttribute('href'));
            if (target.length) {
                window.$('html, body').stop().animate({
                    scrollTop: target.offset().top
                }, 1000);
            }
        });
    };

    // Initialize when ready
    setTimeout(init, 100);
  };

  return (
    <div className="App">
      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="welcome-container">
          <div className="welcome-header">
            <h1>PROYECTO RESIDENCIAL MODERNO</h1>
            <p className="welcome-subtitle">Una nueva visión de la arquitectura contemporánea</p>
          </div>
          
          <div className="project-intro">
            <div className="intro-text">
              <h2>Sobre el Proyecto</h2>
              <p>Este proyecto arquitectónico representa la fusión perfecta entre diseño contemporáneo y funcionalidad. Ubicado en una zona privilegiada, el desarrollo busca redefinir los estándares de vida moderna a través de espacios innovadores y sostenibles.</p>
              <p>Con una superficie total de 2,500 m² y una propuesta que integra tecnología de vanguardia con materiales nobles, este proyecto establece un nuevo paradigma en el diseño residencial.</p>
            </div>
            
            <div className="project-stats">
              <div className="stat">
                <span className="stat-number">2,500</span>
                <span className="stat-label">m² Construidos</span>
              </div>
              <div className="stat">
                <span className="stat-number">24</span>
                <span className="stat-label">Meses de Desarrollo</span>
              </div>
              <div className="stat">
                <span className="stat-number">15</span>
                <span className="stat-label">Unidades Residenciales</span>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="team-section">
            <h2>Nuestro Equipo</h2>
            <div className="team-grid">
              <div className="team-member">
                <div className="member-photo">
                  <img src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop" alt="Arquitecto Principal" />
                </div>
                <h3>Arq. María González</h3>
                <p>Arquitecta Principal</p>
                <span>15 años de experiencia en proyectos residenciales</span>
              </div>
              
              <div className="team-member">
                <div className="member-photo">
                  <img src="https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop" alt="Ingeniero Estructural" />
                </div>
                <h3>Ing. Carlos Rodríguez</h3>
                <p>Ingeniero Estructural</p>
                <span>Especialista en estructuras de concreto y acero</span>
              </div>
              
              <div className="team-member">
                <div className="member-photo">
                  <img src="https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop" alt="Diseñadora de Interiores" />
                </div>
                <h3>Dis. Ana Martínez</h3>
                <p>Diseñadora de Interiores</p>
                <span>Experta en espacios contemporáneos y sostenibles</span>
              </div>
              
              <div className="team-member">
                <div className="member-photo">
                  <img src="https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop" alt="Director de Proyecto" />
                </div>
                <h3>Arq. Roberto Silva</h3>
                <p>Director de Proyecto</p>
                <span>Gestión integral de proyectos arquitectónicos</span>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="location-section">
            <h2>Ubicación del Proyecto</h2>
            <div className="location-content">
              <div className="location-info">
                <h3>Zona Privilegiada</h3>
                <p>Ubicado en el corazón de la ciudad, con acceso directo a las principales vías de comunicación y cerca de centros comerciales, escuelas y áreas recreativas.</p>
                <div className="location-details">
                  <div className="detail">
                    <strong>Dirección:</strong> Av. Principal 123, Colonia Moderna
                  </div>
                  <div className="detail">
                    <strong>Ciudad:</strong> Ciudad de México
                  </div>
                  <div className="detail">
                    <strong>Zona:</strong> Área Metropolitana
                  </div>
                </div>
              </div>
              <div className="map-container">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.9234567890123!2d-99.1332!3d19.4326!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDI1JzU3LjQiTiA5OcKwMDcnNTkuNSJX!5e0!3m2!1ses!2smx!4v1234567890123!5m2!1ses!2smx"
                  width="100%" 
                  height="300" 
                  style={{border: 0}} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade">
                </iframe>
                <p className="map-note">* Reemplaza este iframe con tu API key de Google Maps</p>
              </div>
            </div>
          </div>

          <div className="scroll-indicator">
            <span>Desliza para ver el proceso de desarrollo</span>
            <div className="scroll-arrow">↓</div>
          </div>
        </div>
      </section>

      {/* First Carousel Section */}
      <section className="carousel-section" id="carousel-1">
        <div className="section-header">
          <h2>PROCESO DE DESARROLLO</h2>
          <p>Conoce cada etapa de nuestro proceso creativo</p>
        </div>
        
        <div className="carousel">
          <div className="carousel__control" data-carousel="1"></div>
          <div className="carousel__stage">
            <div className="spinner spinner--left">
              
              {/* Fase 1: Diseño Conceptual */}
              <div className="spinner__face js-active" data-index="0" data-bg="#2C3E50" data-type="concept">
                <div className="content">
                  <div className="content__left">
                    <h1>DISEÑO<br /><span>CONCEPTUAL</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>La fase inicial del proyecto se centra en el desarrollo de conceptos arquitectónicos innovadores que responden a las necesidades específicas del cliente y el entorno urbano.</p>
                      <p>Incluye análisis del sitio, estudios de factibilidad y primeros bocetos conceptuales que definen la visión general del proyecto.</p>
                      <p>FASE 01 - CONCEPTUALIZACIÓN</p>
                    </div>
                    <div className="content__index">01</div>
                  </div>
                </div>
              </div>

              {/* Fase 2: Desarrollo de Diseño */}
              <div className="spinner__face" data-index="1" data-bg="#34495E" data-type="design">
                <div className="content">
                  <div className="content__left">
                    <h1>DESARROLLO<br /><span>DE DISEÑO</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>En esta etapa se refinan los conceptos iniciales, desarrollando plantas arquitectónicas detalladas, elevaciones y cortes que definen la espacialidad del proyecto.</p>
                      <p>Se integran sistemas estructurales, instalaciones y acabados, creando una propuesta arquitectónica coherente y funcional.</p>
                      <p>FASE 02 - DISEÑO DETALLADO</p>
                    </div>
                    <div className="content__index">02</div>
                  </div>
                </div>
              </div>

              {/* Fase 3: Documentación Técnica */}
              <div className="spinner__face" data-index="2" data-bg="#1ABC9C" data-type="documentation">
                <div className="content">
                  <div className="content__left">
                    <h1>DOCUMENTACIÓN<br /><span>TÉCNICA</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Elaboración de planos ejecutivos, especificaciones técnicas y detalles constructivos necesarios para la materialización del proyecto arquitectónico.</p>
                      <p>Incluye coordinación con especialistas en estructura, instalaciones y paisajismo para garantizar la integralidad del diseño.</p>
                      <p>FASE 03 - PLANOS EJECUTIVOS</p>
                    </div>
                    <div className="content__index">03</div>
                  </div>
                </div>
              </div>

              {/* Fase 4: Visualización 3D */}
              <div className="spinner__face" data-index="3" data-bg="#E74C3C" data-type="visualization">
                <div className="content">
                  <div className="content__left">
                    <h1>VISUALIZACIÓN<br /><span>3D</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Creación de renders fotorrealistas y recorridos virtuales que permiten experimentar el proyecto antes de su construcción.</p>
                      <p>Estas herramientas facilitan la comunicación con el cliente y la toma de decisiones sobre materiales, colores y acabados finales.</p>
                      <p>FASE 04 - RENDERS Y ANIMACIONES</p>
                    </div>
                    <div className="content__index">04</div>
                  </div>
                </div>
              </div>

              {/* Fase 5: Construcción */}
              <div className="spinner__face" data-index="4" data-bg="#F39C12" data-type="construction">
                <div className="content">
                  <div className="content__left">
                    <h1>CONSTRUCCIÓN<br /><span>Y SUPERVISIÓN</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Supervisión técnica durante el proceso constructivo, asegurando que la obra se ejecute conforme a los planos y especificaciones establecidas.</p>
                      <p>Control de calidad, seguimiento de cronograma y coordinación con contratistas para garantizar la excelencia en la ejecución.</p>
                      <p>FASE 05 - EJECUCIÓN DE OBRA</p>
                    </div>
                    <div className="content__index">05</div>
                  </div>
                </div>
              </div>

              {/* Fase 6: Entrega Final */}
              <div className="spinner__face" data-index="5" data-bg="#9B59B6" data-type="delivery">
                <div className="content">
                  <div className="content__left">
                    <h1>ENTREGA<br /><span>FINAL</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Culminación del proyecto con la entrega de la obra terminada, incluyendo manuales de operación, garantías y documentación as-built.</p>
                      <p>Seguimiento post-entrega para asegurar la satisfacción del cliente y el correcto funcionamiento de todos los sistemas implementados.</p>
                      <p>FASE 06 - PROYECTO TERMINADO</p>
                    </div>
                    <div className="content__index">06</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Text Section 1 */}
      <section className="text-section">
        <div className="text-container">
          <h2>INNOVACIÓN Y SOSTENIBILIDAD</h2>
          <div className="text-content">
            <div className="text-column">
              <p>Nuestro enfoque se basa en la integración de tecnologías sostenibles y materiales de última generación. Cada elemento del proyecto ha sido cuidadosamente seleccionado para minimizar el impacto ambiental mientras maximiza la eficiencia energética.</p>
              <p>La implementación de sistemas de captación de agua pluvial, paneles solares y materiales reciclados demuestra nuestro compromiso con el medio ambiente y la responsabilidad social.</p>
            </div>
            <div className="text-column">
              <p>Los espacios han sido diseñados para promover el bienestar de los usuarios, incorporando principios de biofilia y aprovechamiento de la luz natural. Cada ambiente cuenta con ventilación cruzada y orientación optimizada.</p>
              <p>La flexibilidad espacial permite adaptaciones futuras, asegurando que el proyecto mantenga su relevancia y funcionalidad a lo largo del tiempo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Second Carousel Section */}
      <section className="carousel-section" id="carousel-2">
        <div className="section-header">
          <h2>ESPACIOS INTERIORES</h2>
          <p>Descubre la elegancia y funcionalidad de cada ambiente</p>
        </div>
        
        <div className="carousel">
          <div className="carousel__control" data-carousel="2"></div>
          <div className="carousel__stage">
            <div className="spinner spinner--left">
              
              <div className="spinner__face js-active" data-index="0" data-bg="#8E44AD" data-type="living">
                <div className="content">
                  <div className="content__left">
                    <h1>SALA<br /><span>PRINCIPAL</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Espacio amplio y luminoso diseñado para la convivencia familiar. Dobles alturas y ventanales de piso a techo crean una sensación de amplitud y conexión con el exterior.</p>
                      <p>Materiales nobles como madera y piedra natural se combinan con elementos contemporáneos para crear un ambiente cálido y sofisticado.</p>
                      <p>ÁREA SOCIAL - CONVIVENCIA</p>
                    </div>
                    <div className="content__index">01</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="1" data-bg="#27AE60" data-type="kitchen">
                <div className="content">
                  <div className="content__left">
                    <h1>COCINA<br /><span>GOURMET</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Cocina integral con isla central y electrodomésticos de última generación. El diseño abierto permite la integración con el comedor y la sala, facilitando la interacción social.</p>
                      <p>Acabados en cuarzo y acero inoxidable garantizan durabilidad y facilidad de mantenimiento, mientras que la iluminación LED crea ambientes versátiles.</p>
                      <p>ÁREA GOURMET - FUNCIONALIDAD</p>
                    </div>
                    <div className="content__index">02</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="2" data-bg="#E67E22" data-type="bedroom">
                <div className="content">
                  <div className="content__left">
                    <h1>RECÁMARA<br /><span>PRINCIPAL</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Suite principal con vestidor y baño privado. Grandes ventanales ofrecen vistas panorámicas mientras que el diseño interior promueve la relajación y el descanso.</p>
                      <p>Sistemas de automatización permiten el control de iluminación, temperatura y privacidad desde un panel central o dispositivos móviles.</p>
                      <p>ÁREA PRIVADA - DESCANSO</p>
                    </div>
                    <div className="content__index">03</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="3" data-bg="#3498DB" data-type="bathroom">
                <div className="content">
                  <div className="content__left">
                    <h1>BAÑO<br /><span>PRINCIPAL</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Baño tipo spa con tina de inmersión y regadera de lluvia. Materiales como mármol y madera crean un ambiente de lujo y relajación.</p>
                      <p>Iluminación indirecta y sistemas de ventilación natural garantizan confort y bienestar en todo momento.</p>
                      <p>ÁREA DE BIENESTAR - RELAJACIÓN</p>
                    </div>
                    <div className="content__index">04</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="4" data-bg="#E74C3C" data-type="study">
                <div className="content">
                  <div className="content__left">
                    <h1>ESTUDIO<br /><span>HOME OFFICE</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Espacio de trabajo diseñado para la productividad y creatividad. Biblioteca integrada y escritorio empotrado optimizan el uso del espacio.</p>
                      <p>Aislamiento acústico y iluminación natural controlada crean el ambiente perfecto para el trabajo desde casa.</p>
                      <p>ÁREA DE TRABAJO - PRODUCTIVIDAD</p>
                    </div>
                    <div className="content__index">05</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="5" data-bg="#95A5A6" data-type="terrace">
                <div className="content">
                  <div className="content__left">
                    <h1>TERRAZA<br /><span>JARDÍN</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Terraza con jardín vertical y área de entretenimiento al aire libre. Pérgola bioclimática permite el uso del espacio en cualquier época del año.</p>
                      <p>Sistema de riego automatizado y selección de plantas nativas garantizan un mantenimiento mínimo y máximo impacto visual.</p>
                      <p>ÁREA EXTERIOR - NATURALEZA</p>
                    </div>
                    <div className="content__index">06</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Text Section 2 */}
      <section className="text-section">
        <div className="text-container">
          <h2>TECNOLOGÍA INTEGRADA</h2>
          <div className="text-content">
            <div className="text-column">
              <p>La domótica y los sistemas inteligentes están integrados en cada aspecto del proyecto. Desde el control de iluminación hasta la gestión energética, todo puede ser monitoreado y controlado remotamente.</p>
              <p>Sensores de movimiento, termostatos inteligentes y sistemas de seguridad avanzados proporcionan comodidad, eficiencia y tranquilidad a los usuarios.</p>
            </div>
            <div className="text-column">
              <p>La infraestructura de telecomunicaciones incluye fibra óptica y puntos de acceso WiFi 6 en toda la propiedad, asegurando conectividad de alta velocidad en cada espacio.</p>
              <p>Sistemas de respaldo energético y gestión inteligente del agua garantizan la continuidad de servicios y la optimización de recursos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Third Carousel Section */}
      <section className="carousel-section" id="carousel-3">
        <div className="section-header">
          <h2>ÁREAS COMUNES</h2>
          <p>Espacios diseñados para la comunidad y el bienestar</p>
        </div>
        
        <div className="carousel">
          <div className="carousel__control" data-carousel="3"></div>
          <div className="carousel__stage">
            <div className="spinner spinner--left">
              
              <div className="spinner__face js-active" data-index="0" data-bg="#16A085" data-type="lobby">
                <div className="content">
                  <div className="content__left">
                    <h1>LOBBY<br /><span>PRINCIPAL</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Recepción elegante con dobles alturas y materiales de lujo. El diseño contemporáneo da la bienvenida a residentes y visitantes con una primera impresión memorable.</p>
                      <p>Área de espera confortable y servicio de conserjería 24/7 garantizan atención personalizada y seguridad constante.</p>
                      <p>ACCESO PRINCIPAL - BIENVENIDA</p>
                    </div>
                    <div className="content__index">01</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="1" data-bg="#2980B9" data-type="gym">
                <div className="content">
                  <div className="content__left">
                    <h1>GIMNASIO<br /><span>FITNESS</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Gimnasio completamente equipado con maquinaria de última generación y área de entrenamiento funcional. Ventilación natural y vistas al jardín crean un ambiente motivador.</p>
                      <p>Vestidores con lockers individuales y área de hidratación complementan las instalaciones deportivas.</p>
                      <p>ÁREA DEPORTIVA - BIENESTAR</p>
                    </div>
                    <div className="content__index">02</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="2" data-bg="#8E44AD" data-type="pool">
                <div className="content">
                  <div className="content__left">
                    <h1>ALBERCA<br /><span>RECREATIVA</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Alberca semiolímpica con área de chapoteadero para niños. Sistema de filtración ecológico y calentamiento solar mantienen el agua en condiciones óptimas.</p>
                      <p>Área de asoleadero con camastros y sombrillas, rodeada de jardines tropicales que crean un oasis urbano.</p>
                      <p>ÁREA ACUÁTICA - RECREACIÓN</p>
                    </div>
                    <div className="content__index">03</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="3" data-bg="#D35400" data-type="salon">
                <div className="content">
                  <div className="content__left">
                    <h1>SALÓN<br /><span>DE EVENTOS</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Salón multiusos para celebraciones y reuniones familiares. Cocina integral equipada y terraza anexa permiten eventos tanto interiores como al aire libre.</p>
                      <p>Sistema de audio y video integrado, junto con iluminación ambiental variable, se adapta a cualquier tipo de celebración.</p>
                      <p>ÁREA SOCIAL - CELEBRACIONES</p>
                    </div>
                    <div className="content__index">04</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="4" data-bg="#27AE60" data-type="garden">
                <div className="content">
                  <div className="content__left">
                    <h1>JARDÍN<br /><span>CENTRAL</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Jardín paisajístico con senderos peatonales y áreas de descanso. Especies nativas y sistema de riego inteligente crean un ecosistema sustentable.</p>
                      <p>Área de juegos infantiles y zona para mascotas complementan los espacios verdes familiares.</p>
                      <p>ÁREA VERDE - NATURALEZA</p>
                    </div>
                    <div className="content__index">05</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="5" data-bg="#34495E" data-type="parking">
                <div className="content">
                  <div className="content__left">
                    <h1>ESTACIONAMIENTO<br /><span>INTELIGENTE</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Estacionamiento subterráneo con sistema de ventilación mecánica y estaciones de carga para vehículos eléctricos. Cada cajón cuenta con bodega individual.</p>
                      <p>Control de acceso automatizado y sistema de seguridad con cámaras garantizan la protección de los vehículos.</p>
                      <p>ÁREA DE SERVICIOS - MOVILIDAD</p>
                    </div>
                    <div className="content__index">06</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Text Section 3 */}
      <section className="text-section">
        <div className="text-container">
          <h2>SEGURIDAD Y CONFORT</h2>
          <div className="text-content">
            <div className="text-column">
              <p>La seguridad es una prioridad fundamental en nuestro diseño. Sistemas de control de acceso biométrico, circuito cerrado de televisión y personal de seguridad capacitado garantizan la tranquilidad de los residentes.</p>
              <p>Iluminación perimetral con sensores de movimiento y sistemas de comunicación de emergencia proporcionan seguridad adicional durante las 24 horas del día.</p>
            </div>
            <div className="text-column">
              <p>El confort térmico se logra mediante sistemas de climatización eficientes y diseño bioclimático que aprovecha las condiciones naturales del sitio.</p>
              <p>Aislamiento acústico de alta calidad y materiales que regulan la humedad crean ambientes interiores saludables y confortables en todo momento.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fourth Carousel Section */}
      <section className="carousel-section" id="carousel-4">
        <div className="section-header">
          <h2>DETALLES CONSTRUCTIVOS</h2>
          <p>La excelencia en cada elemento del proyecto</p>
        </div>
        
        <div className="carousel">
          <div className="carousel__control" data-carousel="4"></div>
          <div className="carousel__stage">
            <div className="spinner spinner--left">
              
              <div className="spinner__face js-active" data-index="0" data-bg="#C0392B" data-type="structure">
                <div className="content">
                  <div className="content__left">
                    <h1>ESTRUCTURA<br /><span>SISMORRESISTENTE</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Sistema estructural de concreto reforzado con marcos rígidos y muros de cortante. Diseño sismorresistente que cumple y supera las normativas locales de construcción.</p>
                      <p>Cimentación profunda con pilotes de fricción garantiza estabilidad en cualquier tipo de suelo y condiciones sísmicas.</p>
                      <p>INGENIERÍA ESTRUCTURAL - SEGURIDAD</p>
                    </div>
                    <div className="content__index">01</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="1" data-bg="#7F8C8D" data-type="facade">
                <div className="content">
                  <div className="content__left">
                    <h1>FACHADA<br /><span>INTELIGENTE</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Sistema de fachada ventilada con paneles de aluminio compuesto y cristal de control solar. Diseño que optimiza la ganancia térmica y reduce el consumo energético.</p>
                      <p>Elementos de protección solar automatizados se ajustan según la posición del sol y las condiciones climáticas.</p>
                      <p>ENVOLVENTE ARQUITECTÓNICA - EFICIENCIA</p>
                    </div>
                    <div className="content__index">02</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="2" data-bg="#1ABC9C" data-type="installations">
                <div className="content">
                  <div className="content__left">
                    <h1>INSTALACIONES<br /><span>ESPECIALES</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Sistemas hidráulicos, eléctricos y de gas de última generación. Instalaciones redundantes garantizan continuidad de servicios y facilitan el mantenimiento.</p>
                      <p>Red de datos estructurada y sistemas de automatización integrados proporcionan conectividad y control inteligente.</p>
                      <p>INFRAESTRUCTURA TÉCNICA - FUNCIONALIDAD</p>
                    </div>
                    <div className="content__index">03</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="3" data-bg="#F39C12" data-type="finishes">
                <div className="content">
                  <div className="content__left">
                    <h1>ACABADOS<br /><span>DE LUJO</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Selección cuidadosa de materiales nobles: mármol, madera de ingeniería, porcelanatos de gran formato y herrería artística. Cada elemento contribuye a la elegancia del conjunto.</p>
                      <p>Acabados resistentes y de fácil mantenimiento que conservan su belleza a través del tiempo.</p>
                      <p>MATERIALIDAD - ELEGANCIA</p>
                    </div>
                    <div className="content__index">04</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="4" data-bg="#9B59B6" data-type="lighting">
                <div className="content">
                  <div className="content__left">
                    <h1>ILUMINACIÓN<br /><span>ARQUITECTÓNICA</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Diseño de iluminación LED con control inteligente que se adapta a las actividades y horarios. Iluminación de acento resalta elementos arquitectónicos y artísticos.</p>
                      <p>Sistemas de iluminación de emergencia y respaldo energético garantizan seguridad en todo momento.</p>
                      <p>DISEÑO LUMÍNICO - AMBIENTE</p>
                    </div>
                    <div className="content__index">05</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="5" data-bg="#E67E22" data-type="sustainability">
                <div className="content">
                  <div className="content__left">
                    <h1>SUSTENTABILIDAD<br /><span>AMBIENTAL</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Certificación LEED con sistemas de captación pluvial, tratamiento de aguas grises y paneles solares. Materiales reciclados y de bajo impacto ambiental.</p>
                      <p>Jardines verticales y azoteas verdes contribuyen a la regulación térmica y la calidad del aire urbano.</p>
                      <p>RESPONSABILIDAD AMBIENTAL - FUTURO</p>
                    </div>
                    <div className="content__index">06</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Text Section 4 */}
      <section className="text-section">
        <div className="text-container">
          <h2>CALIDAD Y GARANTÍA</h2>
          <div className="text-content">
            <div className="text-column">
              <p>Nuestro compromiso con la calidad se refleja en cada proceso constructivo. Control de calidad riguroso en cada etapa, desde la selección de materiales hasta la entrega final del proyecto.</p>
              <p>Certificaciones internacionales de nuestros proveedores y procesos de construcción garantizan estándares de clase mundial en cada elemento del proyecto.</p>
            </div>
            <div className="text-column">
              <p>Garantías extendidas en estructura, instalaciones y acabados proporcionan tranquilidad a largo plazo. Servicio de mantenimiento especializado disponible para preservar la inversión.</p>
              <p>Documentación completa as-built y manuales de operación facilitan el mantenimiento preventivo y correctivo de todos los sistemas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fifth Carousel Section */}
      <section className="carousel-section" id="carousel-5">
        <div className="section-header">
          <h2>PROYECTO TERMINADO</h2>
          <p>El resultado final de nuestra visión arquitectónica</p>
        </div>
        
        <div className="carousel">
          <div className="carousel__control" data-carousel="5"></div>
          <div className="carousel__stage">
            <div className="spinner spinner--left">
              
              <div className="spinner__face js-active" data-index="0" data-bg="#2C3E50" data-type="exterior">
                <div className="content">
                  <div className="content__left">
                    <h1>VISTA<br /><span>EXTERIOR</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>La fachada principal muestra la integración armoniosa de elementos contemporáneos con el entorno urbano. Líneas limpias y proporciones equilibradas crean una presencia arquitectónica distintiva.</p>
                      <p>Paisajismo perimetral y elementos de agua complementan la composición arquitectónica, creando una transición suave entre el espacio público y privado.</p>
                      <p>IMAGEN URBANA - IDENTIDAD</p>
                    </div>
                    <div className="content__index">01</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="1" data-bg="#27AE60" data-type="interior-final">
                <div className="content">
                  <div className="content__left">
                    <h1>INTERIORES<br /><span>TERMINADOS</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Los espacios interiores reflejan la calidad de diseño y ejecución. Cada ambiente cuenta con mobiliario integrado y elementos decorativos que complementan la arquitectura.</p>
                      <p>La iluminación natural y artificial se combina para crear ambientes cálidos y funcionales durante todo el día.</p>
                      <p>ESPACIOS HABITABLES - CONFORT</p>
                    </div>
                    <div className="content__index">02</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="2" data-bg="#3498DB" data-type="amenities">
                <div className="content">
                  <div className="content__left">
                    <h1>AMENIDADES<br /><span>COMPLETAS</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Todas las amenidades están en funcionamiento y disponibles para los residentes. Desde el gimnasio hasta las áreas verdes, cada espacio está listo para ser disfrutado.</p>
                      <p>Personal capacitado y sistemas de mantenimiento garantizan el funcionamiento óptimo de todas las instalaciones.</p>
                      <p>SERVICIOS INTEGRALES - LIFESTYLE</p>
                    </div>
                    <div className="content__index">03</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="3" data-bg="#E74C3C" data-type="technology">
                <div className="content">
                  <div className="content__left">
                    <h1>TECNOLOGÍA<br /><span>OPERATIVA</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Todos los sistemas tecnológicos están calibrados y funcionando. La aplicación móvil permite a los residentes controlar sus espacios y acceder a servicios del edificio.</p>
                      <p>Monitoreo remoto y mantenimiento predictivo aseguran la continuidad y eficiencia de todos los sistemas inteligentes.</p>
                      <p>AUTOMATIZACIÓN - INTELIGENCIA</p>
                    </div>
                    <div className="content__index">04</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="4" data-bg="#F39C12" data-type="community">
                <div className="content">
                  <div className="content__left">
                    <h1>COMUNIDAD<br /><span>ESTABLECIDA</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Los primeros residentes ya han hecho de este lugar su hogar. La comunidad se está formando con familias que comparten valores de calidad de vida y sustentabilidad.</p>
                      <p>Eventos comunitarios y espacios de convivencia fomentan las relaciones vecinales y el sentido de pertenencia.</p>
                      <p>VIDA COMUNITARIA - HOGAR</p>
                    </div>
                    <div className="content__index">05</div>
                  </div>
                </div>
              </div>

              <div className="spinner__face" data-index="5" data-bg="#9B59B6" data-type="legacy">
                <div className="content">
                  <div className="content__left">
                    <h1>LEGADO<br /><span>ARQUITECTÓNICO</span></h1>
                  </div>
                  <div className="content__right">
                    <div className="content__main">
                      <p>Este proyecto representa un hito en el desarrollo urbano de la zona. Su diseño innovador y enfoque sustentable establecen nuevos estándares para futuros desarrollos.</p>
                      <p>El reconocimiento de la comunidad arquitectónica y la satisfacción de los residentes confirman el éxito de nuestra visión.</p>
                      <p>IMPACTO URBANO - TRASCENDENCIA</p>
                    </div>
                    <div className="content__index">06</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Final Section */}
      <section className="final-section">
        <div className="final-container">
          <h2>GRACIAS POR ACOMPAÑARNOS</h2>
          <p>En este recorrido por nuestro proyecto arquitectónico</p>
          <div className="contact-info">
            <div className="contact-item">
              <strong>Contacto:</strong> info@arquitectura.com
            </div>
            <div className="contact-item">
              <strong>Teléfono:</strong> +52 55 1234 5678
            </div>
            <div className="contact-item">
              <strong>Oficina:</strong> Av. Arquitectos 456, CDMX
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Instructions */}
      <div className="navigation-help">
        <p>Usa las flechas ↑↓ del teclado o los controles laterales para navegar en cada sección</p>
      </div>
    </div>
  );
}

export default App;
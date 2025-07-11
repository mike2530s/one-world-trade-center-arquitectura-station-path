// Multiple Carousel Management System
let carousels = {};
let disabled = false;

const SPIN_FORWARD_CLASS = 'js-spin-fwd';
const SPIN_BACKWARD_CLASS = 'js-spin-bwd';
const DISABLE_TRANSITIONS_CLASS = 'js-transitions-disabled';
const SPIN_DUR = 1000;

// Initialize carousel data structure
const initCarousel = (carouselId) => {
    carousels[carouselId] = {
        activeIndex: 0,
        limit: 0,
        $stage: null,
        $controls: null,
        canvas: false
    };
};

const appendControls = (carouselId) => {
    const carousel = carousels[carouselId];
    const $control = $(`.carousel__control[data-carousel="${carouselId}"]`);
    
    for (let i = 0; i < carousel.limit; i++) {
        $control.append(`<a href="#" data-index="${i}" data-carousel="${carouselId}"></a>`);
    }
    
    let height = $control.children().last().outerHeight();
    $control.css('height', (30 + (carousel.limit * height)));
    
    carousel.$controls = $control.children();
    carousel.$controls.eq(carousel.activeIndex).addClass('active');
};

const setIndexes = (carouselId) => {
    const carousel = carousels[carouselId];
    $(`#carousel-${carouselId} .spinner`).children().each((i, el) => {
        $(el).attr('data-index', i);
        carousel.limit++;
    });
};

const duplicateSpinner = (carouselId) => {
    const $el = $(`#carousel-${carouselId} .spinner`).parent();
    const html = $(`#carousel-${carouselId} .spinner`).parent().html();
    $el.append(html);
    $(`#carousel-${carouselId} .spinner`).last().addClass('spinner--right');
    $(`#carousel-${carouselId} .spinner--right`).removeClass('spinner--left');
};

const paintFaces = (carouselId) => {
    $(`#carousel-${carouselId} .spinner__face`).each((i, el) => {
        const $el = $(el);
        let color = $(el).attr('data-bg');
        $el.children().css('backgroundImage', `url(${getBase64PixelByColor(color, carouselId)})`);
    });
};

const getBase64PixelByColor = (hex, carouselId) => {
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

const prepareDom = (carouselId) => {
    setIndexes(carouselId);
    paintFaces(carouselId);
    duplicateSpinner(carouselId);
    appendControls(carouselId);
};

const spin = (inc = 1, carouselId) => {
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

    const $activeEls = $(`#carousel-${carouselId} .spinner__face.js-active`);
    const $nextEls = $(`#carousel-${carouselId} .spinner__face[data-index=${carousel.activeIndex}]`);
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

const spinCallback = (inc, carouselId) => {
    const carousel = carousels[carouselId];
    
    $(`#carousel-${carouselId} .js-active`).removeClass('js-active');
    $(`#carousel-${carouselId} .js-next`).removeClass('js-next').addClass('js-active');
    
    carousel.$stage
        .addClass(DISABLE_TRANSITIONS_CLASS)
        .removeClass(SPIN_FORWARD_CLASS)
        .removeClass(SPIN_BACKWARD_CLASS);
  
    $(`#carousel-${carouselId} .js-active`).each((i, el) => {
        const $el = $(el);
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
        $('.carousel-section').each(function() {
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
    $(document).on('click', '.carousel__control a', function(e) {
        e.preventDefault();
        if (disabled) return;
        
        const $el = $(e.target);
        const carouselId = $el.attr('data-carousel');
        const toIndex = parseInt($el.attr('data-index'), 10);
        const carousel = carousels[carouselId];
        
        spin(toIndex - carousel.activeIndex, carouselId);
    });
};

const assignEls = (carouselId) => {
    const carousel = carousels[carouselId];
    carousel.$stage = $(`#carousel-${carouselId} .carousel__stage`);
};

const initSingleCarousel = (carouselId) => {
    initCarousel(carouselId);
    assignEls(carouselId);
    prepareDom(carouselId);
};

const init = () => {
    // Initialize all carousels
    for (let i = 1; i <= 5; i++) {
        initSingleCarousel(i);
    }
    
    // Attach global listeners
    attachListeners();
    
    // Smooth scrolling for anchor links
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        const target = $(this.getAttribute('href'));
        if (target.length) {
            $('html, body').stop().animate({
                scrollTop: target.offset().top
            }, 1000);
        }
    });
};

// Initialize when document is ready
$(() => {
    init();
});
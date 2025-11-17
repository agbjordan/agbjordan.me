var swiper = new Swiper('.testimonials', {
    // slidesPerView: 5,
    centeredSlides: true,
    spaceBetween: 24,
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    navigation: {
        nextEl: ".btn-next",
        prevEl: ".btn-prev",
      },
    breakpoints: {
      0: {
        slidesPerView: 1,
      },
      768: {
        slidesPerView: 1,
      },
      991: {
        slidesPerView: 1,
      },
      1024: {
        slidesPerView: 1,
      },
    }
  });
window.addEventListener("DOMContentLoaded", function () {
  const $swiper = document.querySelectorAll(".swiper");
  if ($swiper) {
    $swiper.forEach((el) => {
      new Swiper(el, {
        autoplay: {
          delay: 111,
          disableOnInteraction: false,
          reverseDirection: el.dataset.reverse === "true",
        },
        loop: true,
        speed: 3000,
        slidesPerView: "auto",
        spaceBetween: 48,
      });
    });
  }
});

const setCarousel = (scroller) => {
  let items = scroller.querySelectorAll('.animate-visibility');
  let clones = [];
  let disableScroll = false;
  let scrollWidth = 0;
  let scrollPos = 0;
  let clonesWidth = 0;
  let isScrolling = false;
  let mobileStep = screen.width <= 768 ? scroller.children[0].offsetWidth/2 : 0;
  let isDragging = false;
  scroller.innerHTML += scroller.innerHTML;
  const getScrollPos = () => scroller.scrollLeft;
  const setScrollPos = (pos) => scroller.scrollLeft = pos;

  items.forEach(item => {
    const clone = item.cloneNode(true);
    scroller.appendChild(clone);
    clone.classList.add('js-clone');
  });
  clones = scroller.querySelectorAll('.js-clone');

  const getClonesWidth = () => {
    clonesWidth = 0;
    clones.forEach(clone => { clonesWidth += clone.offsetWidth; });

    return clonesWidth;
  }

  const reCalc = () => {
    scrollPos = getScrollPos();
    scrollWidth = scroller.scrollWidth;
    clonesWidth = getClonesWidth();
    if (scrollPos <= 0) return setScrollPos(1);
  }

  getClonesWidth();
  setScrollPos(clonesWidth - mobileStep);
  reCalc();

  const scrollUpdate = () => {
    if (!disableScroll) {
      scrollPos = Math.round(getScrollPos() / 100) * 100;
      if (clonesWidth + scrollPos >= scrollWidth) {
        setScrollPos(clonesWidth + mobileStep);
        disableScroll = true;
      } else if (scrollPos == 0 ) {
        setScrollPos(scrollWidth - clonesWidth * 2);
        disableScroll = true;
      } else if(scrollPos <= mobileStep ){
        setScrollPos(scrollWidth - clonesWidth * 2 + mobileStep);
        disableScroll = true;
      }
    }
    if (disableScroll) {
      setTimeout(() => {
        disableScroll = false;
      }, 50);
    }
  }

  const easeInOutQuad = (t, b, c, d) => {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }

  const smoothScroll = (element, to) => {
    if (isScrolling) return;
    isScrolling = true;

    const start = element.scrollLeft;
    const change = to - start;
    const duration = 500;
    let currentTime = 0;

    const animateScroll = () => {
      currentTime += 20;
      const val = easeInOutQuad(currentTime, start, change, duration);
      element.scrollLeft = val;
      if (currentTime < duration) {
        requestAnimationFrame(animateScroll);
      } else {
        isScrolling = false;
        requestAnimationFrame(scrollUpdate);
      }
    }
    animateScroll();
  }

  const handleWheelEvent = (e) => {
    e.preventDefault();
    const direction = e.shiftKey ? Math.sign(e.deltaY) : Math.sign(e.deltaX);
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
      const delta = direction * scroller.children[0].offsetWidth;
      smoothScroll(scroller, scroller.scrollLeft + delta);
    } else {
      window.scrollBy(0, e.deltaY);
    }
  }

  scroller.addEventListener("click", (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const middle = rect.width / 2;

    if (clickX > middle) {
      smoothScroll(scroller, scroller.scrollLeft + scroller.children[1].offsetWidth);
    } else {
      smoothScroll(scroller, scroller.scrollLeft - scroller.children[1].offsetWidth);
    }
    isDragging = false;
  });

  let startX, deltaX, currentX, halfOfCard;

  const onTouchStart = (event) => {
    startX = event.touches[0].pageX;
    deltaX = 0;
    currentX = 0;
    halfOfCard = 0;
  }

  const onTouchMove = (event) => {
    isDragging = true;
    currentX = event.touches[0].pageX;
    deltaX = currentX - startX;
    const scrollDelta = currentX - startX > 0 ? -1 : 1;
    halfOfCard = screen.width <= 768 ? (scroller.children[0].offsetWidth/2) * scrollDelta : 0;
    scroller.scrollLeft -= deltaX;
    startX = currentX;
  }

  const onTouchEnd = () => {
    if (isDragging) {
      smoothScroll(scroller, scroller.children[0].offsetWidth * Math.round(scroller.scrollLeft / scroller.children[0].offsetWidth) + halfOfCard);
      isDragging = false;
    }
  }

  scroller.addEventListener('wheel', handleWheelEvent, { passive: false });
  scroller.addEventListener('touchstart', onTouchStart, { passive: false });
  scroller.addEventListener('touchmove', onTouchMove, { passive: false });
  scroller.addEventListener('touchend', onTouchEnd, { passive: false });
}

const loop = ({ target, target: { offsetWidth } }) => {
  const checkPos = () => {
    [...target.children].map(e => {
      const toCenter = Math.abs(window.outerWidth / 2 - e.getBoundingClientRect().left - e.getBoundingClientRect().width / 2)
      const toCenter2 = window.outerWidth / 2 - e.getBoundingClientRect().left - e.getBoundingClientRect().width / 2
      const viewport = toCenter / offsetWidth * 100
      const viewport2 = toCenter2 / offsetWidth * 100
      e.style.setProperty('--viewport', viewport)
      e.style.setProperty('--viewport2', viewport2)
    })
  }
  requestAnimationFrame(checkPos)
}
window.loop = loop;

document.addEventListener("DOMContentLoaded", () => {
  const carousels = document.querySelectorAll('[data-scroll="scroller"]');
  carousels.forEach((element) => setCarousel(element));
});

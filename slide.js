$(function() {
  var slides = ['start.html', 'demo.html', 'obs.html', 'obshot.html', 'functor.html', 'monad.html', 'declarative.html', 'drag1.html', 'drag2.html', 'drag3.html', 'drag4.html', 'zip.html', 'merge.html', 'concat.html', 'combineLatest.html','search.html', 'search2.html', 'impls.html', 'obd.html']

  keyUps(190 /* . */).Where(ctrlDown).Subscribe(function(e) {
    window.location = slides[(currentSlide()+1) % slides.length]        
  })
  keyUps(188 /* , */).Where(ctrlDown).Subscribe(function(e) {
    window.location = slides[prevSlide()]
  })
  keyUps(49 /* 1 */).Where(ctrlDown).Subscribe(function(e) {
    window.location = slides[currentSlide()]
  })
  keyUps(50 /* 2 */).Where(ctrlDown).Subscribe(function(e) {
    window.location = 'split.html?split1=' + slides[prevSlide()] + '&split2=' + slides[currentSlide()]
  })

  function ctrlDown(e) {
    return e.ctrlKey == 1
  }

  function keyUps(code) {
    return $(document).toObservable("keyup").Where(function(e) { return e.keyCode == code })
  }

  function prevSlide() {
    var next = currentSlide()-1
    return next < 0 ? (slides.length-1) : next
  }

  function currentSlide() {
    for (i = 0; i < slides.length; i = i+1) {
      if (window.location.toString().lastIndexOf(slides[i]) != -1) return i
    }
    return 0
  }
})

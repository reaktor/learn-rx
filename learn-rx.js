$(function() {
  gr = new jsGraphics(document.getElementById("canvas"))
  pen = new jsPen(new jsColor("red"), 4)

  $(document).onAsObservable("keyup").where(isCtrl)
    .subscribe(function(e) {
      enableSelection($('#canvas'))
      enableSelection($('#code'))
      enableSelection($('#types'))
    })
  $(document).onAsObservable("keydown").where(isCtrl)
    .subscribe(function(e) {
      disableSelection($('#canvas'))
      disableSelection($('#code'))
      disableSelection($('#types'))
    })

  var mouseDown = $(document).onAsObservable("mousedown")
  var mouseUp   = $(document).onAsObservable("mouseup")
  var mouseMove = $(document).onAsObservable("mousemove")

  var moves = mouseMove.skipUntil(mouseDown).takeUntil(mouseUp)
  var path = moves.where(isCtrl).
    zip(moves.skip(1), function(prev, cur) { return [Point(prev), Point(cur)] }).
    repeat()

  path.subscribe(function(line) { drawline(line[0], line[1]) })

  function Point(event) { return { x: event.pageX, y: event.pageY }}

  $('#code pre').html($('#source').text().replace(/\</g, '&lt;').replace(/\>/g, '&gt;'));

  prettyPrint()
})

function disableSelection(elem) {
  elem.css({
    "-moz-user-select":"none",
    "-webkit-user-select":"none",
    "-khtml-user-select":"none"
  })  
}

function enableSelection(elem) {
  elem.css({
    "-moz-user-select":"auto",
    "-webkit-user-select":"auto",
    "-khtml-user-select":"auto"
  })  
}

function isCtrl(e) {
  return e.keyCode == 17 || e.ctrlKey == 1
}

function permute(input) {
  var ps = []
  function permute0(start, end) {
    if (end.length <= 1) {
      ps.push(start + end)
    } else {
      for (var i = 0; i < end.length; i++) {
        var next = end.substring(0, i) + end.substring(i + 1)
        permute0(start + end.charAt(i), next)
      }        
    }
  }

  permute0("", input)
  return ps
}

function drawline(from, to) {
  var p1 = new jsPoint(from.x, from.y)
  var p2 = new jsPoint(to.x, to.y)
  gr.drawLine(pen, p1, p2)
}

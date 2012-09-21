$(function() {
  var submit = $('#submit').onAsObservable('click')

  var fnameDiff = values('#fname').ResettableDiff(submit, $('#fname').val())
  var lnameDiff = values('#lname').ResettableDiff(submit, $('#lname').val())

  fnameDiff.subscribe(show("#fname"))
  lnameDiff.subscribe(show("#lname"))
})

function show(selector) { 
  return function(x) {
    $(selector + "-value").text(x[0])
    $(selector + "-saved").text(x[1])
  }
}

/* *** Common utilities below *** */

// Create a stream of diffs. The first argument is a stream of current values.
// The second argument is a stream of saved values. The result stream is a tuple
// of current value + last saved value.
// 
// Observable a -> Observable a -> a -> Observable (a, a)
Rx.Observable.prototype.Diff = function(savedValues, initialSavedValue) {
  var currentValues = this
  var saved = savedValues.StartWith(initialSavedValue)
  return currentValues.combineLatest(saved, tupled)
}  

// A helper for a common case where saved value is reset to be the latest value from
// current values. The value of 'reset' stream is not used. The 'reset' stream is
// often the save action which stores data to the server.
// 
// Observable a -> Observable _ -> a -> Observable (a, a)
Rx.Observable.prototype.ResettableDiff = function(reset, initialSavedValue) {
  var currentValues = this
  var mostRecent = reset.CombineWithLatestOf(currentValues, function(c, l) { return l })
  return currentValues.Diff(mostRecent, initialSavedValue)
}

Rx.Observable.prototype.CombineWithLatestOf = function(second, combinator) {
  var first = this
  var latest
  second.subscribe(function(value) { latest = value })

  return Rx.Observable.Create(function(subscriber) {
    var seq = first.subscribe(function(value) {
      subscriber.OnNext(combinator(value, latest))
    })
    return function() { seq.Dispose() }
  })
}

function values(selector) {
  return $(selector).onAsObservable('keyup').select(function(e) { return $(e.target).val() })
}

function tupled(x, y) { return [x, y] }

function trace(s) {
  return function(x) {
    console.log(s + '> ' + x)
    return x
  }
}

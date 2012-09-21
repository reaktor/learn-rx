// type ValidationResult = [String]
// type Validation = Observable ValidationResult

$(function() {
  $.fn.changes = function() {
    return eventSourceFor(this, ["keyup", "blur"])
  }

  $.fn.clicks = function() {
    return eventSourceFor(this, ["click"])
  }

  // Bool -> String -> ValidationResult
  Boolean.prototype.orFailure = function(failure) {
    if (this == true) return []
    else return [failure]
  }

  // Validation -> Validation -> Validation
  Rx.Observable.prototype.ValidWhileInvalid = function(other) {
    return this.ValidWhile(other, function(currentValue) { return currentValue.length > 0 })
  }

  // Validation -> Validation -> String -> Validation
  Rx.Observable.prototype.ValidWhileEqual = function(other, value) {
    return this.ValidWhile(other, function(currentValue) { return currentValue == value })
  }

  // Validation -> Validation -> (String -> Bool) -> Validation
  Rx.Observable.prototype.ValidWhile = function(other, predicate) {
    return this.combineLatest(other, function(v1, v2) { return [v1, v2] })
               .select(function(vs) { if (predicate(vs[1])) return []
                                      else return vs[0] })    
  }
})

// () -> (String -> ValidationResult)
function requiredValidator() {
  return function(x) {
    return ($.trim(x).length > 0).orFailure("required")
  }
}

// Int -> (String -> ValidationResult)
function maxLengthValidator(maxLen) {
  return function(x) {
    return (x.length <= maxLen).orFailure("too_long")
  }
}

// Int -> Int -> (String -> ValidationResult)
function lengthValidator(minLen, maxLen) {
  return function(x) {
    return (x.length >= minLen && x.length <= maxLen).orFailure("not_between")
  }
}

// () -> (String -> ValidationResult)
function numberValidator() {
  return function(x) {
    return (($.trim(x).length > 0) && !isNaN(x)).orFailure("not_number")
  }
}

// () -> ([Num] -> ValidationResult)
function orderValidator() {
  return function() {
    var prev = parseFloat(arguments[0])
    for (var i = 1; i < arguments.length; i = i + 1) {
      if (parseFloat(arguments[i]) < prev) return ["invalid_order"]
      prev = parseFloat(arguments[i])
    }
    return []
  }
}

// () -> ((String, String) -> ValidationResult)
function matchingValuesValidator() {
  return function(x1, x2) {
    return ($.trim(x1).toLowerCase() == $.trim(x2).toLowerCase()).orFailure("match")
  }
}

// () -> (String -> ValidationResult)
function emailValidator() {
  return function(x) {
    var validEmail = /^([A-Za-z0-9\x27\x2f!#$%&*+=?^_`{|}~-]+(\.[A-Za-z0-9\x27\x2f!#$%&*+=?^_`{|}~-]+)*)@(([a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|[a-zA-Z0-9]{1,63})(\.([a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]|[a-zA-Z0-9]{1,63}))*\.[a-zA-Z0-9]{2,63})$/
    var localPart = x.substring(0, x.indexOf('@'))
    return (localPart.length <= 64 && validEmail.test(x)).orFailure("invalid_email")
  }
}

// (String -> ValidationResult) -> (String -> ValidationResult)
function emptyOk(validatorF) {
  return function() {
    if (forall(arguments, function(a) { return a == null || $.trim(a) == "" }))
      return []
    else
      return validatorF.apply(this, arguments)
  }
}

// (String -> ValidationResult) -> (String -> ValidationResult)
function not(validatorF) {
  return function() {
    var errors = validatorF.apply(this, arguments)
    if (errors.length == 0)
      return ["not"]
    else
      return []
  }
}

// Observable a -> (a -> ValidationResult) -> Validation
function mkValidation(observable, validator) {
  return observable.select(
    function(args) {
      if ($.isArray(args))
        return validator.apply(null, args)
      else
        return validator(args)
    })
}

// Observable String -> String -> (Validation, Observable a, Observable a)
function mkServerValidation(observable, url) {
  var responseValidator = function(resp) {
    if (resp.data == undefined || resp.data.success) return [] 
    else return resp.data.error       
  }
  var validation = function(value) {
    if ($.trim(value) == "") return Rx.Observable.returnValue([])
    return $.ajaxAsObservable({ url: url + value, dataType: "jsonp"})
            .select(responseValidator)
            .catchException(function(exp) { return Rx.Observable.returnValue([]) })
  }
  var throttle = observable.throttle(1000).distinctUntilChanged()
  var serverHit = throttle.select(validation).switchLatest()
  return { validation:serverHit, requestOn:throttle, requestOff:serverHit }
}

// JQuery -> [String] -> Observable String
function eventSourceFor(selector, events) {
  var initialValue = currentValue(selector)
  var changes = selector.onAsObservable(events.toString().replace(/,/g, " "))
    .select(function(event) { return currentValue(selector) })
  return changes.merge(Rx.Observable.returnValue(initialValue)).distinctUntilChanged()
}

// JQuery -> String
function currentValue(selector) {
  if (selector.attr('type') == 'checkbox') {
    if (selector.attr('checked')) return selector.val()
    else return ""
  } else {
    return selector.val()
  }
}

// [Observable String] -> Validation
function required(xs) {
  return combine($.map(xs, function(x) { return mkValidation(x, requiredValidator()) }))
}

// ValidationResult -> Bool
function success(failures) {
  return failures.length == 0
}

// Element -> String -> (ValidationResult -> ())
function toggleClassEffect(field, className) {
  return function(p) {
    if (success(p)) {
      field.removeClass(className)
    } else {
      field.addClass(className)
    }
  }
}

// Element -> (ValidationResult -> ())
function toggleEffect(component) {
  return function(p) {
    if (success(p)) {
      component.hide()
    } else {
      component.show()
    }
  }
}

// Element -> (ValidationResult -> ())
function disableEffect(component) {
  return function(p) {
    if (success(p)) {
      component.removeAttr('disabled')
    } else {
      component.attr('disabled', 'disabled')
    }
  }
}

// [Observable a] -> Observable [a]
function combine(xs) {
  function flatten(x1, x2) {
    return $.map(Array(x1, x2), identity)
  }

  var combined = xs[0]
  for (i = 1; i < xs.length; i = i+1) {
    combined = combined.combineLatest(xs[i], flatten)
  }
  return combined
}

// a -> a
function identity(x) { return x }

// [a] -> (a -> Bool) -> Bool
function forall(xs, p) {
  return $.grep(xs, p).length == xs.length
}

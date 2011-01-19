$(function() {
  $('#allow-marketing').click(function() {
    if ($(this).is(':checked')) {
      $('#contact-info').show()
    } else {
      $('#contact-info').hide()
    }
  })

  var uname     = $('#username').changes()
  var pwd       = $('#password').changes()
  var pwd2      = $('#password-copy').changes()
  var min       = $('#target-min').changes()
  var max       = $('#target-max').changes()
  var email     = $('#email').changes()
  var marketing = $('#allow-marketing').clicks()

  var unameValidation = mkValidation(uname, maxLengthValidator(15))
  unameValidation.Subscribe(toggleEffect($('.username-too-long-error')))
  unameValidation.Subscribe(toggleClassEffect($('#username'), 'invalid'))

  var uniqueValidation = mkServerValidation(uname, "http://localhost:8080/validateusername/")
  uniqueValidation.validation.Subscribe(toggleEffect($('.username-taken-error')))
  uniqueValidation.requestOn.Subscribe(function() { $('#username').addClass("on-validate") })
  var indicatorOff = function() { $('#username').removeClass("on-validate") }
  uniqueValidation.requestOff.Subscribe(indicatorOff, indicatorOff, indicatorOff)

  var pwdValidation = mkValidation(combine([pwd, pwd2]), emptyOk(matchingValuesValidator()))
  pwdValidation.Subscribe(toggleEffect($('.password-match-error')))

  var unamePwdValidation = mkValidation(combine([uname, pwd]), emptyOk(not(matchingValuesValidator())))
  unamePwdValidation.Subscribe(toggleEffect($('.password-username-error')))

  var minNumValidation = mkValidation(min, emptyOk(numberValidator()))
  var maxNumValidation = mkValidation(max, emptyOk(numberValidator()))
  var minMaxValidation = mkValidation(combine([min, max]), orderValidator())
    .ValidWhileInvalid(minNumValidation)
    .ValidWhileInvalid(maxNumValidation)

  minNumValidation.Subscribe(toggleEffect($('.min-not-number-error')))
  minNumValidation.Subscribe(toggleClassEffect($('#target-min'), 'invalid'))
  maxNumValidation.Subscribe(toggleEffect($('.max-not-number-error')))
  maxNumValidation.Subscribe(toggleClassEffect($('#target-max'), 'invalid'))
  minMaxValidation.Subscribe(toggleEffect($('.minmax-error')))

  var emailValidation = mkValidation(email, emptyOk(emailValidator()))
  emailValidation.Subscribe(toggleEffect($('.email-format-error')))
  var marketingValidation = emailValidation.ValidWhileEqual(marketing, "")
  var emailRequired = mkValidation(email, requiredValidator()).ValidWhileEqual(marketing, "")

  var requiredValidation = required([uname, pwd, pwd2])

  var all = combine([unameValidation, unamePwdValidation, pwdValidation, minNumValidation,
                     maxNumValidation, minMaxValidation, marketingValidation, 
                     requiredValidation, emailRequired, uniqueValidation.validation])
  all.Subscribe(disableEffect($('#create-button')))
})


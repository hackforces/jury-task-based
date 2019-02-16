var HOST = "/api/"
var CONTEST =  2
var TASK = 0

function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g
    return text.replace(urlRegex, function(url) {
        return '<a target="_blank" href="' + url + '">' + url.substring(url.lastIndexOf('/')+1) + '</a>'
    })
}

function timestamp() {
  return parseInt(Math.trunc(new Date().getTime() / 1000), 10)
}

function formToJSON(form) {
  let unindexed_array = form.serializeArray()
  let indexed_array = {}
  $.map(unindexed_array, function(n, i){
    indexed_array[n['name']] = n['value']
  })
  return indexed_array
}

function filter(e) {
  var regex = new RegExp('\\b\\w*' + e + '\\w*\\b')
  $('.task').hide().filter(function () {
      return regex.test($(this).data('tags'))
  }).show()
}

getUrlParameter = (sParam) => {
  var sPageURL = window.location.search.substring(1),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

  for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
          return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
      }
  }
}

function renderTaskStatus(task) {
  let t = timestamp()
  let _t = parseInt(task.last_seen, 10)
  let code = ""
  let out = ""
  if (task.task_flags === (task.task_flags | 32) || t - _t > 600) {
    out = "Задача недоступна, проверена %s"
    code = "red"
  } else if (task.task_flags === (task.task_flags | 128) || t - _t > 300) {
    out = "Задача болеет, проверена %s"
    code = "yellow"
  } else {//if (task.task_flags === (task.task_flags | 64) || t - _t > 150) {
    out = "Задача исправна, проверена %s"
    code = "green"
  }
  return [code, sprintf(out, moment.unix(_t).fromNow())]
}

/* for rating showing */
function checkTask() {
  if(!Cookies.get('ctf'))
    checkAuth()
  else {
    $('#task-flag').prop("disabled", true)
    $('#task-submission').prop("disabled", true)
    $.ajax({
      type: "POST",
      dataType: "json",
      crossDomain: true,
      data: {
          task_guid: TASK,
          contest_guid: CONTEST,
          flag: $("#task-flag").val()
        },
      url: HOST + "task.check"
    })
    .done( data => {
      $('#task-flag').css({"color": "#257227"}).val(data.message)
      checkProfile()
      $(".task[data-guid=" + TASK + "]").addClass("solved")
      setTimeout( () => {$('#modal-container-41074').modal('hide')}, 2000)
    })
    .fail( err => {
      if(err.status == 401)
      {
        Cookies.remove('ctf', {domain: '.olymp.hackforces.com'})
        checkAuth()
      }
      if(err.status < 500)
      {
        $('#task-flag').css({"color": "#9b111e"}).val(JSON.parse(err.responseText).message)
      }
    })
    .always( () => {
      setTimeout(renderTaskInput, 2000)
    })
  }
}

function renderTask(task) {
  [a, b] = renderTaskStatus(task)
  let el = $(sprintf(`
    <div class="col-md-4 task" data-tags="%s" data-guid="%s">
      <div class="card text-white bg-primary mb-3" style="max-width: 18rem;">
        <div class="card-header">
          <span data-toggle="tooltip" data-placement="top" title="Стоимость"><i style='color: #ffd700;' class="fas fa-coins"></i> %s </span>
          <span class='float-right led-%s' last-seen=%s data-toggle="tooltip" data-placement="top" title="%s"><i class="fas fa-power-off"></i></span>
        </div>
        <div class="card-body"><h5 class="card-title">%s</h5></div>
      </div>
    </div>
  `, task.tags, task.guid, task.points, a, task.last_seen, b, task.title)).hide()
  if (task.solved == true)
    el.addClass("solved")
  el.appendTo($("#tasks-list")).show('slow')
}

function renderTags(tasks) {
  let tags = []
  tasks.map(el => { if(el.tags) tags.push(...el.tags.split(" ")) })
  tags = [...new Set(tags)]
  if (tags.length === 0)
    return
  tags.unshift('')
  $.jStorage.set("tags", tags)
  for (i of tags) {
    k = i === '' ? 'all' : i
    $(sprintf(
      `<button data-tags="%s" type="button" class="btn shadow-none btn-info"> # %s</button>`,i, k))
    .hide()
    .appendTo("#tags-div")
    .show('fast')
  }
}

function loadTasks(method = 0) {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "contest.detail",
    data: {guid: CONTEST}
  })
  .done( data => {
    $.jStorage.set("contest", data)
    if(data.tasks.length == 0)
      $("#tasks-div").html("<div class='container'><h3 class='display-2 text-center'>Задания недоступны</h3></div>")
    if (method == 0) {
      renderTags(data.tasks)
      $.each(data.tasks, ( index, value ) => {renderTask(value)})
      $(function () { $('span[data-toggle="tooltip"]').tooltip() })
    } else {
      $.each(data.tasks, ( index, value ) => {
        [a, b] = renderTaskStatus(value)
        $('.task[data-guid=' + value.guid + ']')
        .addClass(value.solved == true ? "solved" : "")
        let stat = $('.task[data-guid=' + value.guid + '] .card .card-header .float-right')
        stat.attr('last-seen', value.last_seen)
        .attr('data-original-title', b)
        .removeClass("led-red led-yellow led-green").addClass("led-"+a)
      })
    }
  })
  .fail( err => {
    if(err.status == 401)
    {
      Cookies.remove('ctf', {domain: '.olymp.hackforces.com'})
      checkAuth()
    }
  })
}
function checkProfile() {
  let t = `<div class="d-inline m-2 p-0 text-white">%s</div>`
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "user.getStat",
    data: {contest: CONTEST}
  })
  .done( data => {
    $("#profile-div").hide().html("")
    $("#profile-div").append(sprintf(t, data.username)).animate('slow')
    $("#profile-div").append(sprintf(t, "TOKEN: " + Cookies.get('ctf'))).animate('slow')
    $("#profile-div").show()
  })
  .fail( err => {
    if(err.status == 401)
    {
      Cookies.remove('ctf', {domain: '.olymp.hackforces.com'})
      checkAuth()
    }
  })
}
function checkAuth() {
  if(Cookies.get('ctf')) {
    $("#login-div").hide()
    $("#reset-div").hide()
    $('#registration').show()
    $('#tasks-div').show()
    $('#rules-div').hide()
    loadTasks(0)
    checkProfile()
  }
  else {
    $('#registration').hide()
    $('#tasks-div').hide()
    $('#profile-div').hide()
    $('#login-div').show()
    $("#reset-div").show()
    $('#rules-div').show()
  }
}
function Auth(user, pass) {
  $.ajax({
    type: "POST",
    dataType: "json",
    crossDomain: true,
    data: {username: user, password: pass},
    url: HOST + "user.getToken"
  })
  .done( (data, textStatus, xhr) => {
      if (xhr.status === 200) {
        Cookies.set('ctf', data.token, { expires: 7, domain: '.olymp.hackforces.com', secure: true })
        checkAuth()
      }
  })
  .fail( err => {
    alert("Auth failed: " + err.responseJSON.message)
  })
}

function sendToken() {
  $.ajax({
    type: "POST",
    dataType: "json",
    crossDomain: true,
    data: {email: $("#reset-email").val()},
    url: HOST + "user.sendToken"
  })
  .done( (data, textStatus, xhr) => {
    alert("Письмо на адрес " + $("#reset-email").val() + " было успешно отправлено! Проверьте почту (папку СПАМ тоже) - отправитель no-reply@hackforces.com")
    $("#resetPass").modal('hide')
  })
  .fail( err => {
    alert("Ошибка отправки письма: " + err.responseJSON.message)
  })
}

function renderTaskInput() {
    $("#task-flag").val("").attr('style', '')
    $("#task-submission").prop("disabled", false)
    $("#task-flag").prop("disabled", false)
}

$("#login-form").on("submit", (event) => {
  event.preventDefault()
  $(this).serialize()
  Auth($("#username").val(), $("#password").val())
})
$("#checkTask").on("submit", (event) => {
  event.preventDefault()
  checkTask()
})
$(".solved_task").click(function(e) {
  e.preventDefault()
})
$("#tags-div").on('click', 'button', (event) => {
  filter(event.currentTarget.dataset.tags)
  $("button").removeClass('active')
  $(event.currentTarget).addClass('active')
})
$("#tasks-list").on('click', '.task', (event) => {
  event.preventDefault()
  if($(event.currentTarget).hasClass("solved"))
    return
  else {
    $("#modal-container-41074").modal('show')
    let task = $.jStorage.get("contest").tasks.filter((t) => {return t.guid == event.currentTarget.dataset.guid})[0]
    $("#task-title").html(task.title)
    $("#task-desc").html(urlify(task.description))
    $("#task-tags").html("<b>Тэги:</b> " + task.tags.split(" ").map(e => '<span class="badge badge-pill badge-secondary">' + e + '</span>').join(" "))
    TASK = task.guid
    renderTaskInput()
  }
})
if (getUrlParameter('reset')) {
  Cookies.set('ctf', getUrlParameter('reset'), { expires: 7, domain: '.olymp.hackforces.com', secure: true })
}
$( document ).ready( () => {
  $.jStorage.flush()
  checkAuth()
  setInterval(() => {
    if(!Cookies.get('ctf'))
      checkAuth()
    else
      loadTasks(1)
  }, 10000)
})
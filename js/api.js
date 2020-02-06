var HOST = "/api/"
var CONTEST =  '9d5eda30-c2ec-4cd2-82d2-b2fba356b0cb'
var TASK = 0
var converter = new showdown.Converter()
converter.setOption('simplifiedAutoLink', true)
moment.updateLocale('ru')

function urlify(text) {
    var urlRegex = /(https?:\/\/[^<\s]+)/g
    return text.replace(urlRegex, function(url) {
        let a = url.lastIndexOf('/')+1 === url.length ? url :url.substring(url.lastIndexOf('/')+1) 
        return '<a target="_blank" href="' + url + '">' + a + '</a>'
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

function checkBits(v, b) {
  return v === (v | b)
}

function renderTaskStatus(task) {
  let t = timestamp()
  let _t = parseInt(task.last_seen, 10)
  let code = ""
  let out = ""
  if (task.task_flags === (task.task_flags | 32) || t - _t > 600) {
    out = "Задача недоступна"
    code = "red"
  } else if (task.task_flags === (task.task_flags | 128) || t - _t > 300) {
    out = "Задача болеет"
    code = "yellow"
  } else {//if (task.task_flags === (task.task_flags | 64) || t - _t > 150) {
    out = "Задача исправна"
    code = "green"
  }
  return [code, out]
  // return [code, sprintf(out + ", проверена %s", moment.unix(_t).fromNow())]
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
        Cookies.remove('ctf', {domain: `.${window.location.hostname}`})
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
    if(data.tasks.length == 0) {
      $("#tasks-div").hide()
      // $("#tasks-div").html("<div class='container'><h3 class='display-2 text-center'>Задания недоступны</h3></div>")
      checkInTeam()
      $("#teams-div").show()
    }

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
      Cookies.remove('ctf', {domain: `.${window.location.hostname}`})
      checkAuth()
    }
  })
}
function loadAnnounces(method = 0) {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "contest.announces",
    data: {guid: CONTEST}
  })
  .done( data => {
    if(data.length == 0) {
      $("#announces").hide()
    }
    let template = `
      <div class="col-md-12" id="%s">
      <div class="card text-white bg-primary announce">
        <div class="card-header">%s</div>
        <div class="card-body">
          <h5 class="card-title">%s</h5>
          <p class="card-text">%s</p>
        </div>
        <div class="card-footer"><i>%s</i></div>
      </div>
    </div>
    `
    let announces
    if ($.jStorage.get("announces") === null) {
      announces = data
    } else if (data.length > $.jStorage.get("announces").length) {
      announces = data.slice(0, data.length - $.jStorage.get("announces").length)
    } else {
      announces = []
    }
    $.jStorage.set("announces", data)
    for (let a of announces) {
      $("#announces").prepend(sprintf(template, a.guid, moment(new Date(new Date(a.date))).fromNow(), a.title, a.message, a.author))
    }
    for (let a of data) {
      $(`#${a.guid} .card .card-header`).text(moment(new Date(new Date(a.date))).fromNow())
    }
  })
  .fail( err => {
    if(err.status == 401)
    {
      Cookies.remove('ctf', {domain: `.${window.location.hostname}`})
      checkAuth()
    }
  })
}
function checkProfile() {
  let t = `<div class="d-inline m-2 p-0 text-white">%s </div>`
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "user.getStat",
    data: {contest: CONTEST}
  })
  .done( data => {
    $("#profile-div").hide().html("")
    setTimeout( () => {
      let time_status
      if ($.jStorage.get("contest").contest.date_start > new Date().getTime()) {
        time_status = `Начало: ${moment(new Date(new Date($.jStorage.get("contest").contest.date_start*1000))).fromNow()}`
      } else if (new Date($.jStorage.get("contest").mystatus.timestamp).getTime() + $.jStorage.get('contest').contest.timelimit * 1000 < new Date().getTime() )
      {
        time_status = 'Вы закончили'
      } else {
        time_status = `Конец: ${moment(new Date(new Date($.jStorage.get("contest").mystatus.timestamp).getTime() + $.jStorage.get('contest').contest.timelimit * 1000 )).fromNow()}`
      }
      $("#profile-div").append(sprintf(t, data.username)) //.animate('slow')
      // $("#profile-div").append(sprintf(t, `TOKEN: ${Cookies.get('ctf')}`))
      $("#profile-div").append(sprintf(t, "Team: " +$.jStorage.get("contest").mystatus.name))
      // $("#profile-div").append(sprintf(t, time_status))
      // $("#profile-div").append(sprintf(t, "PTS: " +$.jStorage.get("contest").mystatus.points))
      // $("#profile-div").append(sprintf(t, "Points: " +$.jStorage.get("contest").t.points))
      let solved = $.jStorage.get("contest").tasks.filter((t) => {return t.solved == true}).length
      let total = $.jStorage.get("contest").tasks.length
      // $("#profile-div").append(sprintf(t, "Points: " + data.points))
      $("#profile-div").append(sprintf(t, "Tasks: " + solved + "/" + total))
      // $("#profile-div").append(sprintf(t, "Tries: " + data.attempts))
      // $("#profile-div").append(sprintf(t, "Position: " + data.position))
      $("#profile-div").show()
    }, 1000)
  })
  .fail( err => {
    if(err.status == 401)
    {
      Cookies.remove('ctf', {domain: `.${window.location.hostname}`})
      checkAuth()
    }
  })
}
function checkAuth() {
  if(Cookies.get('ctf')) {
    $("#login-div").hide()
    $("#reset-div").hide()
    $('#rules-div').hide()
    $("#tags-div").show()
    $('#registration').show()
    $('#tasks-div').show()
    $('#profile-div').show()
    $('#announces-div').show()
    loadTasks(0)
    loadAnnounces(0)
    checkProfile()
  }
  else {
    $('#registration').hide()
    $('#tasks-div').hide()
    $('#profile-div').hide()
    $("#tags-div").hide()
    $('#login-div').show()
    $("#reset-div").show()
    $('#rules-div').show()
    $('#announces-div').hide()
  }
}
function Auth(user, pass) {
  $.ajax({
    type: "POST",
    dataType: "json",
    crossDomain: true,
    data: {email: user, password: pass},
    url: HOST + "user.getToken"
  })
  .done( (data, textStatus, xhr) => {
      if (xhr.status === 200 ) {
        Cookies.set('ctf', data.token, { expires: 7, domain: `.${window.location.hostname}`, secure: true, samesite: 'strict' }) // здесь было true
        $("#profile-div").html('')
        checkAuth()
        // Join()
      }
  })
  .fail( err => {
    console.log(err)
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
function teamMembers(team) {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "team.detail?guid=" + team
  })
  .done( (data, _textStatus, _xhr) => {
    let members = ""
    for (i of data.members)
      members += sprintf("<p><b>%s</b> (%s)</p>", i.username, i.email)
    $("#team-info-div").append("<p>Члены команды:</p>" + members)

  })
  .fail( err => {
    checkAuth()
    alert("fail: " + err.responseJSON.message)
  })
}
function checkInTeam() {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "contest.detail",
    data: {guid: CONTEST},
  })
  .done( (data, _textStatus, _xhr) => {
    if (data.hasOwnProperty('mystatus') && Object.keys(data.mystatus).length > 0 && data.mystatus.hasOwnProperty('guid')) {
      
      $.ajax({
        type: "GET",
        dataType: "json",
        crossDomain: true,
        url: HOST + "team.detail?guid=" + data.mystatus.guid,
      })
      .done( (data, _textStatus, _xhr) => {
        $("#team-info-div").show()
        $("#team-info-name").text(`${data.name} (${data.tag})`)
        $("#team-info-code").text(`${data.invite_code}`)
        let mydiv = "<button onclick='leaveTeam(\"%s\");' class='btn btn-info'>Покинуть команду</button></p"
        $("#team-info-leave").html(sprintf(mydiv, data.guid))
        let members = ""
        for (i of data.members)
          members += sprintf("<p><b>%s</b> (%s)</p>", i.username, i.email)
        $("#team-info-members").html(members)
        
      })
    } else {
      $("#team-info-div").hide()
    }
  })
  .fail( err => {
    checkAuth()
    alert("fail: " + err.responseJSON.message)
  })
}
function addTeam(team) {
  $.ajax({
    type: "POST",
    dataType: "json",
    crossDomain: true,
    data: {name: team.name, tag: team.tag, country: "RU", contest: CONTEST},
    url: HOST + "team.add"
  })
  .done( data => {
  //   console.log(data);
    if (data.status != true) {
      checkAuth()
    }
    else {
      checkInTeam()
    }
  })
  .fail( err => {
    alert("fail: " + err.responseJSON.message)
  })
}

function joinTeam(team) {
  $.ajax({
    type: "POST",
    dataType: "json",
    crossDomain: true,
    data: {contest: CONTEST, invite_code: team.teamCode},
    url: HOST + "team.join"
  })
  .done( data => {
    if (data.status != true) {
      checkAuth()
    }
    else {
      checkInTeam()
    }
  })
  .fail( err => {
    alert("fail: " + err.responseJSON.message)
  })
}

function leaveTeam(team) {
  $.ajax({
    type: "POST",
    dataType: "json",
    crossDomain: true,
    data: {team: team},
    url: HOST + "team.leave"
  })
  .done( data => {
    if (data.status != true) { checkAuth() }
    else { checkInTeam() }
  })
  .fail( err => {
    alert("fail: " + err.responseJSON.message)
  })
}

function getTeams() {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "contest.scoreboard",
    data: {guid: CONTEST}
  })
  .done( data => {
    $("#teams-list").hide().html("")
    for (let t of data.users)
    $("#teams-list").append($("<b></b>").text(t.username)).append("<br>")
    $("#teams-list").show() //.slideDown()
  })
  .fail( err => {
    if(err.status == 401)
    {
      Cookies.remove('ctf');
      checkAuth();
    }
  })
}

$("#login-form").on("submit", (event) => {
  event.preventDefault()
  $(this).serialize()
  Auth($("#username").val(), $("#password").val())
})

$("#team-add-form").on("submit", (event) => {
  event.preventDefault()
  addTeam(formToJSON($("#team-add-form")))
})

$("#team-join-form").on("submit", (event) => {
  event.preventDefault()
  joinTeam(formToJSON($("#team-join-form")))
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
  else
    $("#modal-container-41074").modal('show')
  let task = $.jStorage.get("contest").tasks.filter((t) => {return t.guid == event.currentTarget.dataset.guid})[0]
  task.tags = task.tags ? task.tags : "all"
  $("#task-title").html(task.title)
  $("#task-desc").html(converter.makeHtml(urlify(task.description)))
  // $("#task-desc").html(converter.makeHtml(task.description))
  $("#task-tags").html(task.tags.split(',').map((el) => `<h5><span class="badge badge-pill badge-secondary">${el}</span></h5>`).join(" "))
  TASK = task.guid
  renderTaskInput()
  // console.log(task.task_flags)
  if (checkBits(task.task_flags, 16)) {
    $('#task-flag').prop("disabled", true)
    $('#task-flag').val("Это автозачитываемый таск. Вам не нужно вводить флаги")
    $('#task-submission').prop("disabled", true)
  }
})
if (getUrlParameter('reset')) {
  Cookies.set('ctf', getUrlParameter('reset'), { expires: 7, domain: `.${window.location.hostname}`, secure: true, samesite: 'strict' }) 
  $.ajaxSetup({
    beforeSend: function (xhr)
    {
      xhr.setRequestHeader("Accept","application/vvv.website+json;version=1");
    }
  });
}
$( document ).ready( () => {
  $.jStorage.flush()
  checkAuth()
  setInterval(() => {
    if(!Cookies.get('ctf'))
      checkAuth()
    else
      checkInTeam()
      loadTasks(1)
      loadAnnounces(0)
  }, 10000)
})

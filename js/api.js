var HOST = "/api/"
var CONTEST = 2;
var TASK = 0;

function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return '<a target="_blank" href="' + url + '">' + url + '</a>';
    })
}

/* for task showing */
$(".solved_task").click(function(e) {
    e.preventDefault()
})


// $("#search").keyup(function() {
//   var selectSize = $(this).val();
//   filter(selectSize);
// });

$("#tags-div").on('click', 'button', (event) => {
  filter(event.currentTarget.dataset.tags)
})
function filter(e) {
  var regex = new RegExp('\\b\\w*' + e + '\\w*\\b');
  $('.task').hide().filter(function () {
      return regex.test($(this).data('tags'))
  }).show();
}

$("#tasks-list").on('click', '.task', (event) => {
  // $(event.target).html("")
  event.preventDefault()
  if($(event.currentTarget).hasClass("solved"))
    return
  else
    $("#modal-container-41074").modal('show')
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "task.detail",
    data: {guid: event.currentTarget.dataset.guid}
  })
  .done( data => {
    $("#task-title").html(data.title);
    $("#task-desc").html(urlify(data.description));
    $("#task-tags").html("Tags: " + data.tags);
    TASK = data.guid
    renderTaskInput();
    // if ( $('#task_form').css('display')=='none')
    // {
    //   $('#task_form').css({opacity: 0.0, display: "block"}).animate({opacity: 1.0}, 300);
    //   $('#tasks_form').css({opacity: 0.0, display: "none"});
    // }
  })
})

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
      url: HOST + "user.checkTask"
    })
    .done( data => {
      $('#task-flag').css({"color": "#257227"}).val(data.message)
      checkProfile()
      setTimeout( () => {$('#modal-container-41074').modal('hide')}, 2000)
    })
    .fail( err => {
      if(err.status == 401)
      {
        Cookies.remove('ctf');
        checkAuth();
      }
      if(err.status < 500)
      {
        $('#task-flag').css({"color": "#9b111e"}).val(JSON.parse(err.responseText).message)
      }
    })
    .always( () => {
      console.log("kek");
      
      setTimeout(renderTaskInput, 2000);
    })
  }
}

function renderTask(task) {
  //  data-toggle="modal" href="#modal-container-41074" 
  let el = $(sprintf(`
    <div class="col-md-4 task" data-tags="%s" data-guid="%s">
      <div class="card text-white bg-primary mb-3" style="max-width: 18rem;">
        <div class="card-header"><i class="fas fa-coins"></i> %s <span class='float-right'><i class="fas fa-power-off"></i></span></div>
        <div class="card-body"><h5 class="card-title">%s</h5></div>
      </div>
    </div>
  `, task.tags, task.guid, task.points, task.title)).hide()
  if (task.solved == true)
    el.addClass("solved")
  el.appendTo($("#tasks-list")).show('slow')
}

function renderTags(tasks) {
  let tags = []
  tasks.map(el => tags.push(...el.tags.split(" ")))
  tags = [...new Set(tags)]
  for (i of tags) {
    $(sprintf(
      `<button data-tags="%s" type="button" class="btn btn-info">
        #%s<span style="float: right;" class="badge badge-light">4</span>
      </button>`,
    i, i))
    .hide()
    .appendTo("#tags-div")
    .show('fast')
  }
}
function loadTasks() {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "contest.detail",
    data: {guid: CONTEST}
  })
  .done( data => {
    renderTags(data.tasks)
    $.each(data.tasks, ( index, value ) => {
        renderTask(value)
      // if(value.solved)
      //   $("div").find("[task_id="+value.guid+"]").removeClass('shadow_task').addClass('solved_task') //.css('display','none')
    })
  })
  .fail( err => {
    if(err.status == 401)
    {
      Cookies.remove('ctf');
      checkAuth();
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
    $("#profile-div").append(sprintf(t, "Points: " + data.points))
    $("#profile-div").append(sprintf(t, "Tasks: " + data.solved + "/" + data.tasks))
    $("#profile-div").append(sprintf(t, "Tries: " + data.attempts))
    $("#profile-div").append(sprintf(t, "Position: " + data.position))
    $("#profile-div").slideDown()
  })
  .fail( err => {
    if(err.status == 401)
    {
      Cookies.remove('ctf');
      checkAuth();
    }
  })
}

/* authorization */
function checkAuth() {
  if(Cookies.get('ctf')) {
    $("#login-div").hide()
    // $('#tasks-div').show()
    // $("#profile-div").show()
    loadTasks()
    // checkScore()
    checkProfile()
  }
  else {
    $("#profile-div").hide()
    $('#tasks-div').hide()
    $("#task-div").hide()
    $('#login-div').show()
  }
}

function Register(user, pass1, pass2, email) {
  $.ajax({
    type: "POST",
    dataType: "json",
    crossDomain: true,
    data: {email: email, password1: pass1, password2: pass2, username: user},
    url: HOST + "user.register"
  })
  .done( data => {
  //   console.log(data);
    if (data.status == true) {
      Auth(user, pass1)
      setTimeout(Join, 1000)
    }
  })
  .fail( err => {
    alert("fail: " + err.responseJSON.message)
  })
}
function Join() {
  $.ajax({
    type: "POST",
    dataType: "json",
    crossDomain: true,
    data: {contest_guid: 1},
    url: HOST + "user.joinContest"
  })
  .done( data => {
  //   console.log(data);
    if (data.status == true) {
      checkAuth()
    }
  })
  .fail( err => {
    alert("fail: " + err.responseJSON.message)
  })
}
function Auth(user, pass) {
  $.ajax({
    type: "POST",
    dataType: "json",
    crossDomain: true,
    data: {username: user, password: pass},
    url: HOST + "user.getToken"
  })
  .done( data => {
    if (data.status == true) {
      Cookies.set('ctf', data.token, { expires: 1 });
      checkAuth();
    }
  })
  .fail( err => {
    alert("fail: " + err.responseJSON.message)
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
  checkTask();
})

$( document ).ready( () => {
  checkAuth()
})

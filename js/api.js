var HOST = "/api/"
var CONTEST = 2;
var task = 0;

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


$("#search").keyup(function() {
  var selectSize = $(this).val();
  filter(selectSize);
});

$("#tags-div").on('click', 'button', (event) => {
  filter(event.currentTarget.dataset.tags)
})
function filter(e) {
  var regex = new RegExp('\\b\\w*' + e + '\\w*\\b');
  $('.task').hide().filter(function () {
      console.log(e);
      console.log($(this).data('tags'));
      return regex.test($(this).data('tags'))
  }).show();
}

$("#tasks-list").on('click', '.task', {}, (event) => {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "task.detail",
    data: {guid: event.currentTarget.dataset.guid},
    success: function(data) {
      $("#task-title").html(data.title);
      $("#task-desc").html(urlify(data.description));
      $("#task-tags").html("Tags: " + data.tags);
      task = data.guid
      renderTaskInput();
      if ( $('#task_form').css('display')=='none')
      {
        $('#task_form').css({opacity: 0.0, display: "block"}).animate({opacity: 1.0}, 300);
        $('#tasks_form').css({opacity: 0.0, display: "none"});
      }
    },
  })
})

/* for rating showing */
function checkTask() {
  if(!Cookies.get('ctf'))
  {
    checkAuth();
    // console.log("KEK");
  }
  else
  {
    $.ajax({
      type: "POST",
      dataType: "json",
      crossDomain: true,
      data: {
          guid: task,
          keyphrase: $("#keyphrase").val(), 
          contest_guid: CONTEST, 
          token: Cookies.get('ctf')
        },
      url: HOST + "user.checkTask",
      success: function(data) {
        $('#task-flag').css({"color": "#257227"}).html("You successfully passed this task!")
        setTimeout(function () {
           $("#task_form").css('display','none');
           $('#tasks_form').css({opacity: 0.0, display: "block"}).animate({opacity: 1.0}, 300);
	        }, 2000);
      },
      error: function(err) {
        console.log(err);
        // console.log(JSON.parse(err.responseText).status);
        if(err.status == 401)
        {
          Cookies.remove('ctf');
          checkAuth();
        }
        if(err.status < 500)
        {
          $('#task-flag').css({"color": "#9b111e"}).text(JSON.parse(err.responseText).message)
          setTimeout(function () {
            renderTaskInput()
        }, 2000);
        }
      }
    })
  }
};

function renderTask(task) {
  $(sprintf(`
    <div class="col-md-4 task" data-toggle="modal" href="#modal-container-41074" data-tags="%s" data-guid="%s">
      <div class="card text-white bg-primary mb-3" style="max-width: 18rem;">
        <div class="card-header">%s</div>
        <div class="card-body"><h5 class="card-title">%s</h5></div>
      </div>
    </div>
  `, task.tags, task.guid, task.title, task.title)).hide().appendTo($("#tasks-list")).show('slow')
}

function renderTags(tasks) {
  let tags = []
  tasks.map(el => tags.push(...el.tags.split(" ")))
  tags = [...new Set(tags)]
  for (i of tags) {
    $(sprintf(`<button data-tags="%s" type="button" class="btn btn-info">%s <span style="float: right;" class="badge badge-light">4</span></button>`,
    i, i)).hide().appendTo("#tags-div").show('fast')
  }
}
function loadTasks() {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "contest.detail",
    data: {guid: CONTEST, token: Cookies.get('ctf')},
    success: function(data) {
      renderTags(data.tasks)
      $.each(data.tasks, function( index, value ) {
          renderTask(value)
        // if(value.solved)
        //   $("div").find("[task_id="+value.guid+"]").removeClass('shadow_task').addClass('solved_task') //.css('display','none')
      })
    },
    error: function(err) {
      if(err.status == 401)
      {
        Cookies.remove('ctf');
        checkAuth();
      }
    }
  })
  }

function checkProfile() {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "user.getStat",
    data: {contest: CONTEST, token: Cookies.get('ctf')},
    success: function(data) {
        $("#profile").html(sprintf("<li><a target='_blank' href='/scoreboard'>Рейтинг</a></li><li>Привет, %s</li><li>Очков: %d</li><li>Попыток: %d</li><li>Прогресс: %d/%d</li>",
        data.username, data.points, data.attempts, data.solved, data.tasks))
    },
    error: function(err) {
      if(err.status == 401)
      {
        Cookies.remove('ctf');
        checkAuth();
      }
    }
  })
};

/* authorization */
function checkAuth() {
  if(Cookies.get('ctf')) {
    $("#login-div").hide()
    $('#tasks-div').show()
    $("#profile-div").show()
    loadTasks()
    // checkScore()
    checkProfile();
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
    url: HOST + "user.register",
    success: function(data) {
    //   console.log(data);
      if (data.status == true) {
        Auth(user, pass1)
        setTimeout(Join, 1000, Cookies.get('ctf'))
      }
    },
    error: function(err) {
      alert("ERROR: " + err.responseJSON.message)
    }
  })  
}

function Join(token) {
  $.ajax({
    type: "POST",
    dataType: "json",
    crossDomain: true,
    data: {token: token, contest_guid: 1},
    url: HOST + "user.joinContest",
    success: function(data) {
    //   console.log(data);
      if (data.status == true) {
        checkAuth()
      }
    },
    error: function(err) {
      alert("ERROR: " + err.responseJSON.message)
    }
  })  
}
function Auth(user, pass) {
  $.ajax({
    type: "POST",
    dataType: "json",
    crossDomain: true,
    data: {username: user, password: pass},
    url: HOST + "user.getToken",
    success: function(data) {
      if (data.status == true) {
        Cookies.set('ctf', data.token, { expires: 1 });
        checkAuth();
      }
    },
    error: function(err) {
      alert("ERROR: " + err.responseJSON.message)
    }
  })
}

function renderTaskInput() {
    $("#task-flag").html("").attr('style', '');
//   $("#task-flag").html("<input type='text' name='keyphrase' id='keyphrase' size='37' autocomplete=off><button id='btn' onclick='checkTask();'>ОТПРАВИТЬ</button>");
}

$("#login-form").on("submit", function(event) {
  event.preventDefault()
  $(this).serialize()
  Auth($("#username").val(), $("#password").val())
})

$("#checkTask").on("submit", function(event) {
  event.preventDefault()
  checkTask();
})

$( document ).ready(function() {
  checkAuth()
})

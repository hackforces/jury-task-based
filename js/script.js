var HOST = "https://api.hackforces.com/api/"
var contest = 12;
var curYPos = 0,
curXPos = 0,
curDown = false;
var x = 0, y = 0;
var isChrome = !!window.chrome && !!window.chrome.webstore;
var isFirefox = typeof InstallTrigger !== 'undefined';
// var converter = new showdown.Converter();

function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return '<a target="_blank" href="' + url + '">' + url + '</a>';
    })
    // or alternatively
    // return text.replace(urlRegex, '<a href="$1">$1</a>')
}

function handleMouse(e) {
  if(curDown === true && document.getElementById("task").style.visibility == "hidden") {
    //if(isFirefox)
      window.scrollTo(document.body.scrollLeft + (curXPos - e.clientX), document.body.scrollTop + (curYPos - e.clientY));
    //else
      // window.scrollTo(document.body.scrollLeft + (curXPos - e.pageX), document.body.scrollTop + (curYPos - e.pageY));
  }
}

document.onmousemove = handleMouse;
window.addEventListener('mousedown', function(e){ curDown = true; curYPos = e.pageY; curXPos = e.pageX; });
window.addEventListener('mouseup', function(e){ curDown = false; });
document.onmousedown = function() {
  if(document.getElementById("task").style.visibility != "hidden" && !$("#task").is(":hover")) {
    $('#task').css({opacity: 0.0, visibility: "hidden"});
  }
}
/* for task showing */
$(".point").click(function() {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "task.detail",
    data: {guid: $(this).attr("task_id")},
    success: function(data) {
      $("#task-title").text(data.title + " (" + data.points + ")");
      $("#task-desc").html(urlify(data.description));
      $("#task-author").html("Author: " + data.author);
      // console.log(data.tags.split(',').join(" #"))
      $("#task-tags").html("Tags: " + data.tags);
      $("#task").attr("task_id", data.guid);
      renderTaskInput();
      //$("#task-desc").html(converter.makeHtml(data.description));
      //$("#task-desc").val(data.description);
      if ( $('#task').css('visibility')=='hidden')
      $('#task').css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0}, 300);
    },
  });
});

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
      data: {guid: $("#task").attr("task_id"), keyphrase: $("#keyphrase").val(), contest_guid: contest, token: Cookies.get('ctf')},
      url: HOST + "user.checkTask",
      success: function(data) {
        $('#task-flag').css({"background-color": "#257227"}).html("You successfully passed this task!")
        setTimeout(function () {
	         $("#task" + $("#task").attr("task_id")).hide("slow");
           $("#task").css('visibility','hidden');
	        }, 2000);
        // $("#task").css('visibility','hidden');
      },
      error: function(err) {
        console.log(err);
        // console.log(JSON.parse(err.responseText).status);
        if(err.status == 401)
        {
          Cookies.remove('ctf');
          checkAuth();
        }
        if(err.status == 400 || err.status == 404)
        {
          $('#task-flag').css({"background-color": "#9b111e"}).text(JSON.parse(err.responseText).message)
          setTimeout(function () {
            renderTaskInput()
        }, 2000);
        }
      }
    })
  }
};

function checkCompletedTasks() {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "contest.detail",
    data: {guid: contest, token: Cookies.get('ctf')},
    success: function(data) {
      $.each(data.tasks, function( index, value ){
        if(value.solved)
          $("#task"+value.guid).css('visibility','hidden')
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

/* for rating showing */
function checkScore() {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "users.rating",
    data: {guid: contest},
    success: function(data) {
      $("#teams").empty()
      var content = "<table>\n"
      $.each(data, function( index, value ){
        if(index < 15)
          content += "<tr><td style='width:20px;'>" + (index+1) + ".</td><td style='width:240px;'>" + value.username + "</td><td style='width:40px;'>" + value.points + "</td></tr>\n";
      })
      content +="</table>\n"
      $("#teams").append(content)
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

function checkProfile() {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "user.getStat",
    data: {contest: contest, token: Cookies.get('ctf')},
    success: function(data) {
      $("#profile-usr").text("Profile (" + data.username + ")");
      $("#profile-pos").text("Position: " + data.position);
      $("#profile-pts").text("Points: " + data.points);
      $("#profile-att").text("Tries: " + data.attempts);
      $("#profile-slv").text("Progress: " + data.solved + " / " + data.tasks);
      // console.log(data);
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
    $('#content').css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0}, 300);
    $("#login").css('visibility','hidden');
    checkCompletedTasks()
    checkScore()
    checkProfile()
  }
  else {
    $('#task').css({opacity: 0.0, visibility: "hidden"})
    $("#content").css('visibility','hidden');
    $('#login').css({opacity: 0.0, visibility: "visible"}).animate({opacity: 1.0}, 300);
  }
}
function Auth(user, pass) {
  $.ajax({
    type: "POST",
    dataType: "json",
    crossDomain: true,
    data: {email: user, password: pass},
    url: HOST + "user.getToken",
    success: function(data) {
      //console.log(data);
      if (data.status == true)
        Cookies.set('ctf', data.token, { expires: 1 });
        checkAuth();
    },
    error: function(err) {
      alert("ERROR: " + err.responseJSON.message)
    }
  })
}

function renderTaskInput() {
  $("#task-flag").html("<input type='text' name='keyphrase' id='keyphrase' size='37' autocomplete=off><button id='btn' onclick='checkTask();'>ОТПРАВИТЬ</button>");
}

$("#login-form").on("submit", function(event) {
  event.preventDefault();
  Auth($("#username").val(), $("#password").val());
});
$("#checkTask").on("submit", function(event) {
  event.preventDefault();
  checkTask();
});
$( document ).ready(function() {
  checkAuth()
});

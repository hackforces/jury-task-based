var HOST = "https://api.hackforces.com/api/"
var contest = 13;

function checkScore() {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "users.rating",
    data: {guid: contest},
    success: function(data) {
      $("#teams").empty()
      var content = ""
      $.each(data, function( index, value ){
          content += "<tr><td style='width:70px;'>" + (index+1) + "</td><td>" + value.username + "</td><td style='width:200px;'>" + value.points + "</td></tr>\n";
      })
      $("#teams").append(content)
    },
  });
}

function checkContest() {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "contest.detail",
    data: {guid: contest},
    success: function(data) {
        $("#date_end")
        .countdown(new Date(parseInt(data.contest.date_end) * 1000), function(event) {
            $(this).text(event.strftime('%H:%M:%S'));
        }); 
        $("#date_start")
        .countdown(new Date(parseInt(data.contest.date_start) * 1000), {elapse:true}).on('update.countdown',
	    function(event) {
                $(this).text(event.strftime('%H:%M:%S'));
            }); 
    },
  });
}

setInterval(function() { checkScore() }, 45000);
checkScore();
checkContest();

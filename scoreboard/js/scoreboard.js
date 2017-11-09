var HOST = "https://api.hackforces.com/api/"
var contest = 11;

function checkScore() {
  $.ajax({
    type: "GET",
    dataType: "json",
    crossDomain: true,
    url: HOST + "users.rating",
    data: {guid: contest},
    success: function(data) {
      console.log(data);
      $("#teams").empty()
      var content = ""
      $.each(data, function( index, value ){
        if(index < 15)
          content += "<tr><td style='width:40px;'>" + (index+1) + ".</td><td>" + value.username + "</td><td style='width:200px;'>" + value.points + "</td></tr>\n";
      })
      $("#teams").append(content)
    },
  });
}

setInterval(function() { checkScore() }, 30000);
checkScore();

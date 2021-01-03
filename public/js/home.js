$( document ).ready(function() {
    var socket = io.connect("http://localhost:80");
    //global vars
    var curent_chat_user="";
    //responsiveness code
    if(window.innerWidth<600){
        a=$(".ch_area")
        pl=$(".peoples_list");
        $(".ch_area").remove();
        $(".back_arrow").css("display","none");

        $(".chat_people").on("click", function(){//click user handler
         $(".peoples_list").remove();
         $(".ch_list").append(a);
         $(".back_arrow").css("display","inline");
        }); 
        
        $(".back_arrow").on("click", function(){
            console.log(pl)
            $(".ch_list").append(pl);
            $(".ch_area").remove();
            $(".back_arrow").css("display","none");
            
            $(".chat_people").on("click", function(){// click user handler
             $(".peoples_list").remove();
             $(".ch_list").append(a);
             $(".back_arrow").css("display","inline");
            }); 
        }); 
    }
    //searc for user
    $(".search_bar").keypress(function(e){
        console.log();
        if(e.keyCode==13)
            $.ajax({//make ajax request
                type: "GET",
                url: "/get_users",
                dataType: 'json',
                data: {searchString: $(".search_bar").val()},
                success:(res)=>{
                    $(".peoples_list").html("");//delete previous list
                    for(i in res){
                        slot='<div class="chat_people"><img class="prof_pic" src="../imagini/background.jpg"><p class="name">'+res[i]+'</p><p class="last_message">Last message</p></div>';
                        $(".peoples_list").append(slot);
                    }
                }
            });
        //console.log(e.key+"\n"+e.keyCode);
    });

    $(document).on('click', '.chat_people',function(e){//on select people to chat
        //console.log($(this).children(".name").text());
        curent_chat_user=$(this).children(".name").text();
        $(".chat_people").css("background-color", "#00000059");
        $(this).css("background-color", "navajowhite");
        //redo ch_area
        //ajax req to get mesages
        $.ajax({//make ajax request
            type: "GET",
            url: "/get_messages",
            dataType: 'json',
            data: { to: curent_chat_user},
            success:(res)=>{
                $("div").remove(".r_message");
                $("div").remove(".l_message");
                //insert messages
                for (i in res){//res need to be sorted by time&date
                    if(res[i].from==curent_chat_user)
                        msg='<div class="r_message"><p class="msgr">'+res[i].msg+'</p></div>';
                    else
                        msg='<div class="l_message"><p class="msgl">'+res[i].msg+'</p></div>';
                    $(".ch_area").append(msg);
                }
                document.getElementsByClassName("ch_area")[0].scrollTo(0, document.getElementsByClassName("ch_area")[0].scrollHeight);
            }
        });
    });

    $(".send_bar").keypress(function(e){//on send message
        if(e.keyCode==13 && curent_chat_user.length>0){
            //TO SEND MESSAGE ON SOCKET
            socket.emit('chat message',$(".send_bar").val());
            $.ajax({//make ajax request
                type: "GET",
                url: "/send_message",
                dataType: 'json',
                data: {message: $(".send_bar").val(), to: curent_chat_user},
                success:(res)=>{
                    if(res!=1)
                        alert("eroare la trimiterea mesajului");
                }
            });
        }
    });
    //TO RECEIVE MESSAGE FROM SOCKET
    socket.on('chat message', function(msg){
        mm='<div class="l_message"><p class="msgl">'+msg+'</p></div>';
        $(".ch_area").append(mm);
        console.log(document.getElementsByClassName("ch_area")[0].scrollHeight);
        document.getElementsByClassName("ch_area")[0].scrollTo(0, document.getElementsByClassName("ch_area")[0].scrollHeight);
    });
});

/*$.notify(msg, {
              className:type,
              clickToHide: true,
              autoHide: false,
              showDuration: 150,
              globalPosition: 'top right'
            }); */

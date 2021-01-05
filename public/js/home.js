$( document ).ready(function() {
    function get_username(){
        var username="";
        $.ajax({//make ajax request
            type: "GET",
            'async':false,
            url: "/get_username",
            dataType: 'text',
            success:(res)=>{
                username=res
            }
        });
        return username;
    }

    function poulate_ch_list_at_startup(){
        //set username
       
        $.ajax({//make ajax request
            type: "GET",
            'async':false,
            url: "/get_recent_users",
            dataType: 'json',
            success:(res)=>{
                console.log(res);
                for(i in res){
                    $.ajax({
                        type: "GET",
                        'async':false,
                        url: "/get_last_message",
                        dataType: 'text',
                        data:{usr: res[i]},
                        success:(res1)=>{
                            slot='<div class="chat_people"><img class="prof_pic" src="../imagini/background.jpg"><p class="name">'+res[i]+'</p><p class="last_message">'+res1+'</p></div>';
                            $(".peoples_list").append(slot);
                        }
                    });
                    
                }
                first_chat=document.getElementsByClassName("chat_people")[0];
                if(first_chat!= null && window.innerWidth>600)
                    first_chat.click();
            }
        });
        if(window.innerWidth>600)
            $(".username").html(get_username());           

    }

    var socket = io.connect("http://localhost:80");//192.168.1.242
    //global vars
    var curent_chat_user="";
    var curent_user="";
    var socket_on=0;
    //responsiveness code
    if(window.innerWidth<600){
        r_area=$(".right_area");
        ch_list=$(".ch_list");
        r_area.css("display","none");
        $(".logout_button").html('<img src="../imagini/logout.svg">');
        $(".send_bar").before('<a href=".."> <img class="back_button" src="../imagini/back.svg"></a>');
        $(".send_bar").after('<img class="send_button" src="../imagini/send.svg">');
        //$(".back_arrow").css("display","none");

        $(document).on("click",".chat_people", function(){//click user handler
         ch_list.css("display","none");
         r_area.css("display","inline");
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
        if(e.keyCode==13)
            $.ajax({//make ajax request
                type: "GET",
                url: "/get_users",
                dataType: 'json',
                data: {searchString: $(".search_bar").val()},
                success:(res)=>{
                    $(".peoples_list").html("");//delete previous list
                    for(i in res){
                        $.ajax({
                            type: "GET",
                            'async':false,
                            url: "/get_last_message",
                            dataType: 'text',
                            data:{usr: res[i]},
                            success:(res1)=>{
                                slot='<div class="chat_people"><img class="prof_pic" src="../imagini/background.jpg"><p class="name">'+res[i]+'</p><p class="last_message">'+res1+'</p></div>';
                                $(".peoples_list").append(slot);
                            }
                        });
                    }
                }
            });
        //console.log(e.key+"\n"+e.keyCode);
    });
    function uploadFile() {
        var img = document.querySelector('[type=file]').files[0];
        var formData = new FormData();
        formData.append("filetoupload", img);
        //console.log(img);
        $.ajax({
           url: "/upload_profile_pic",
           type: "get",
           data: formData,
           processData: false,
           contentType: false,
           success: function(response) {
               console.log(response);
            //$(".rofile_image").attr(src,"path on server")
           },
           error: function(jqXHR, textStatus, errorMessage) {
               console.log(errorMessage); // Optional
           }
        });
    }
    //upload image
    $(document).on("click","#profile_image", function() {
        if(document.querySelector('[type=file]').files.length!=0){
            console.log(document.querySelector('[type=file]').files);
            uploadFile();
            $(".centered").remove();
            //pune img
        }else{
            $(".upp_image").click();
            $(".formm").append('<labe class="centered">Apply</label>');
            console.log(document.querySelector('[type=file]').files);
         }
    });
    $(document).on("click",".centered", function() {
        $("#profile_image").click();
    });

    $(document).on('click', '.chat_people',function(e){//on select people to chat
        //console.log($(this).children(".name").text());
        curent_chat_user=$(this).children(".name").text();
        curent_user=$(this);
        if(window.innerWidth<600){
            console.log(curent_chat_user);
            $(".username").html(curent_chat_user);
        }
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


    function send_message(){
        socket.emit('message',{"to": curent_chat_user, "from": get_username(), "msg": $(".send_bar").val()});
            var ch_area = document.getElementsByClassName("ch_area")[0];
            msg='<div class="l_message"><p class="msgl">'+$(".send_bar").val()+'</p></div>';
            $(".ch_area").append(msg);
            if(curent_user.length>0){
                curent_user.click();//tedraw left right messages wit div reload
                ch_area.scrollTo(0, ch_area.scrollHeight);
            }
            /*$.ajax({//make ajax request
                type: "GET",
                url: "/send_message",
                dataType: 'json',
                data: {message: $(".send_bar").val(), to: curent_chat_user},
                success:(res)=>{
                    if(res!=1)
                        alert("eroare la trimiterea mesajului");
                        $(".send_bar").val("");
                }
            });*/
    }

    //set profile picture
   /* $(document).on("click",".profile_image",()=>{

    })*/



    $(".send_bar").keypress(function(e){//on send message
        if(e.keyCode==13 && curent_chat_user.length>0){
            send_message();
            $(".send_bar").val("");
        }
    });
    $(document).on("click", ".send_button", function(){
        send_message();
        $(".send_bar").val("");
    });
    if(socket_on==0)//conect to server socket
        socket.emit("set_online",{username: get_username()});
    //TO RECEIVE MESSAGE FROM SOCKET
    socket.on('message', function(data){
        console.log('vine ceva pe socket');
        if(data.from==curent_chat_user){//just for safety
            var ch_area = document.getElementsByClassName("ch_area")[0];
            mm='<div class="r_message"><p class="msgr">'+data.msg+'</p></div>';
            $(".ch_area").append(mm);
            if(curent_user.length>0){
                curent_user.click();//tedraw left right messages wit div reload
                ch_area.scrollTo(0, ch_area.scrollHeight);
            }
        }//else 
        //    console.log("nu inserez");
        });
    poulate_ch_list_at_startup();
});

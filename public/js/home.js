$( document ).ready(function() {
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
            //make ajax request
            $.ajax({
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
        console.log(e.key+"\n"+e.keyCode);
    });
    $(document).on('click', '.chat_people',function(e){
        console.log($(this));
        //redo ch_area
        //ajax req to get mesages

        //l_message='<div class="l_message"><p class="msgl">'+msg+'</p></div>';
        //r_message='<div class="r_message"><p class="msgr">'+msg+'</p></div>';
    });
});
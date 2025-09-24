<script type="text/javascript" id="chanjs">function makenoreferermeta() {
  var meta= document.createElement('meta');
  meta.name='referrer';
  meta.content='no-referrer';
  return meta;
}

function insertintohead(element) {
  document.head.append(element);
}

//Add upvote support

function upvotes() {
  const thumbup=$('<button class="btn btn-sm btn-default" id="voteup" title="UpVote"><span class="glyphicon glyphicon-thumbs-up"></span></button>');
  var beenclicked=false;
  thumbup.css('margin-left','3px');
  thumbup.click(async ()=>{
    if(beenclicked) {
      thumbup.css('background','gray');
      setTimeout(()=>thumbup.css('background','unset'),121);
    }
    else {
      beenclicked=true;
      thumbup.css('background','green');
      thumbup.append(' (1)');
      const url=$('video')[0].currentSrc;
      const title=$('#currenttitle').text().split(': ').pop();
      const body=JSON.stringify({url,title});
      await fetch('https://p.gvid.tv/cytubeup',{method:'POST',body});
      thumbup.css('background','unset');
      //setTimeout(()=>thumbup.css('background','unset'),243);
    }
  });
  document.querySelector('#plcontrol').append(thumbup[0]);
  function resetupvote() {
    beenclicked=false;
    thumbup.html('<span class="glyphicon glyphicon-thumbs-up"></span>');
  }
  (new MutationObserver(resetupvote)).observe(document.querySelector('#ytapiplayer').parentElement,{childList:true});
}
function invitematrix() {
 if(Math.random()>1/5) return false;
 var text = '<a target="_blank" href="https://matrix.gvid.tv/s/porn">Try our reddit clone</a>';
 $('#leftcontrols').append(text);
 return true;
}

function disableaddtemporary() {
 document.querySelectorAll('.add-temp').forEach(i=>i.checked= false);
}

(()=>{ //Convert porntrex to trexsneed
 var elem = document.querySelector('#mediaurl');
 function translate() {
   elem.value = 'https://p.gvid.tv/trexsneed/'+elem.value+'.json'
 }
 function checkneedtranslate() {
  try {
   return (new URL(elem.value)).host.includes('porntrex');
  } catch(e) { return false; }
 }
 function handlechange() {
  if(checkneedtranslate()) translate();
 }
 'change input paste'.split(' ').forEach(i=>elem.addEventListener(i,handlechange));
})();

function main() {
  insertintohead(makenoreferermeta());
  upvotes();
  disableaddtemporary();
  if(invitematrix()) return;
}

setTimeout(main,200);
</script>

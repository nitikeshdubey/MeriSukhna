/* Original, quiet pentatonic instrumental generated locally; no audio downloads. */
(() => {
 const button=document.getElementById('musicToggle'),volume=document.getElementById('musicVolume');
 if(!button)return;
 let context,master,timer,playing=false,step=0,wanted=false,requestId=0;
 const notes=[261.63,329.63,392,440,392,329.63,293.66,261.63,329.63,392,523.25,440,392,329.63,293.66,261.63];
 function tone(frequency,when,duration,gain){const osc=context.createOscillator(),envelope=context.createGain();osc.type='sine';osc.frequency.value=frequency;envelope.gain.setValueAtTime(0,when);envelope.gain.linearRampToValueAtTime(gain,when+.25);envelope.gain.exponentialRampToValueAtTime(.0001,when+duration);osc.connect(envelope);envelope.connect(master);osc.start(when);osc.stop(when+duration+.05);osc.onended=()=>{osc.disconnect();envelope.disconnect();};}
 function tick(){if(!playing||context.state!=='running')return;const now=context.currentTime+.03;tone(notes[step%notes.length],now,3,.38);if(step%4===0){const chord=step%8===0?[130.81,196,261.63]:[146.83,220,293.66];chord.forEach(f=>tone(f,now,8,.12));}step++;}
 function paint(){button.textContent=playing?'Ⅱ Pause instrumental':'♫ Play soft instrumental';button.setAttribute('aria-pressed',String(playing));}
 async function start(){if(!document.documentElement.classList.contains('region-allowed'))return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){button.textContent='Audio unavailable';button.disabled=true;return;}const ticket=++requestId;wanted=true;if(!context){context=new Audio();master=context.createGain();master.gain.value=Number(volume.value)/100;master.connect(context.destination);}try{await context.resume();if(context.state!=='running'||!wanted||ticket!==requestId)return;clearInterval(timer);playing=true;master.gain.setTargetAtTime(Number(volume.value)/100,context.currentTime,.5);tick();timer=setInterval(tick,2400);paint();}catch{paint();}}
 function stop(){requestId++;wanted=false;playing=false;clearInterval(timer);if(context){master.gain.setTargetAtTime(0,context.currentTime,.2);setTimeout(()=>{if(!wanted)context.suspend();},500);}paint();}
 button.addEventListener('click',()=>{if(playing)stop();else start();});
 volume.addEventListener('input',()=>{if(master&&playing)master.gain.setTargetAtTime(Number(volume.value)/100,context.currentTime,.1);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)stop();});
 // Autoplay is attempted only after the same country check used by the page.
 let attempted=false;const tryAutoplay=()=>{if(!attempted&&document.documentElement.classList.contains('region-allowed')){attempted=true;observer.disconnect();start();}};
 const observer=new MutationObserver(tryAutoplay);observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});tryAutoplay();paint();
})();

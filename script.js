const KEY='rancho_amigos_lista_v2';let products=[];
try{products=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){}
const $=id=>document.getElementById(id);
function persist(){localStorage.setItem(KEY,JSON.stringify(products));draw()}
function beep(){try{const c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=780;g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.11,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.18);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.19);o.onended=()=>c.close()}catch(e){}}
function add(value){let n=value.trim().replace(/^[-•*☐□✓✔]+\s*/,'').replace(/^\d+[\s.)-]+/,'').trim();if(!n)return;if(!products.some(p=>p.name.toLowerCase()===n.toLowerCase()&&!p.done))products.push({id:Date.now()+Math.random(),name:n,done:false,qty:1});}
$('form').addEventListener('submit',e=>{
 e.preventDefault();
 const value=$('name').value.trim();
 if(!value)return;
 add(value);$('name').value='';persist();$('name').focus();
 if(typeof speakConfirmation==='function'){
   speakConfirmation('OK, item incluído');
   const status=document.getElementById('voiceStatus');
   if(status){status.textContent='✓ OK, item incluído na sua lista!';status.className='voice-status';}
 }
});
function draw(){
 $('items').innerHTML='';
 products.forEach(p=>{
  const li=document.createElement('li');li.className='item'+(p.done?' done':'');
  const mark=document.createElement('button');mark.className='mark';mark.type='button';mark.setAttribute('aria-label',p.done?'Marcar como não colocado na cesta':'Marcar como colocado na cesta');
  mark.onclick=()=>{p.done=!p.done;if(p.done)beep();persist()};
  const name=document.createElement('span');name.className='product';name.textContent=p.name;
  const state=document.createElement('span');state.className='state';state.textContent=p.done?'NA CESTA':'PENDENTE';
  const del=document.createElement('button');del.className='remove';del.type='button';del.textContent='×';del.setAttribute('aria-label','Excluir '+p.name);del.onclick=()=>{products=products.filter(x=>x.id!==p.id);persist()};
  const qty=document.createElement('div');qty.className='qty';
  const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.setAttribute('aria-label','Diminuir quantidade');
  const number=document.createElement('span');number.textContent=p.qty||1;
  const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label','Aumentar quantidade');
  minus.onclick=()=>{p.qty=Math.max(1,(p.qty||1)-1);persist()};
  plus.onclick=()=>{p.qty=(p.qty||1)+1;persist()};
  qty.append(minus,number,plus);
  li.append(mark,name,qty,state,del);$('items').append(li);
 });
 const done=products.filter(p=>p.done).reduce((s,p)=>s+(p.qty||1),0),total=products.reduce((s,p)=>s+(p.qty||1),0);
 $('counter').textContent=`${done} de ${total} unidades`;$('bar').style.width=(total?done/total*100:0)+'%';$('empty').style.display=total?'none':'block';
}
$('clear').onclick=()=>{products=products.filter(p=>!p.done);persist()};
$('photo').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 $('ocrStatus').textContent='Lendo a foto...';$('recognized').style.display='none';
 try{if(!window.Tesseract)throw Error('OCR indisponível');
 const result=await Tesseract.recognize(file,'por+eng',{logger:m=>{if(m.status==='recognizing text')$('ocrStatus').textContent='Reconhecendo texto: '+Math.round(m.progress*100)+'%'}});
 $('recognizedText').value=result.data.text;$('recognized').style.display='block';$('ocrStatus').textContent='Confira os produtos identificados e confirme.';
 }catch(err){$('ocrStatus').textContent='Não foi possível ler a imagem. Tente outra foto ou digite os produtos.'}
 e.target.value='';
};
$('import').onclick=()=>{const lines=$('recognizedText').value.split(/\n|[,;]/).map(s=>s.trim()).filter(Boolean);lines.forEach(add);persist();$('recognized').style.display='none';$('ocrStatus').textContent=lines.length+' produto(s) adicionados.'};
draw();


// Reconhecimento de voz (Chrome/Edge; requer permissão do microfone e, em geral, HTTPS ou localhost).
const voiceButton = document.getElementById('voiceBtn');
const voiceStatus = document.getElementById('voiceStatus');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let voiceReady = false;

function speakConfirmation(message){
  if(!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = 'pt-BR';
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

if(!SpeechRecognition){
  voiceButton.disabled = true;
  voiceButton.title = 'Reconhecimento de voz não disponível neste navegador';
  voiceStatus.textContent = 'Seu navegador não oferece reconhecimento de voz. Use Chrome ou Edge atualizado.';
  voiceStatus.classList.add('error');
}else{
  recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = true;

  voiceButton.addEventListener('click',()=>{
    try{
      voiceReady = true;
      voiceStatus.textContent = 'Estou ouvindo... diga o nome do produto.';
      voiceStatus.className = 'voice-status active';
      voiceButton.classList.add('listening');
      recognition.start();
    }catch(err){
      voiceStatus.textContent = 'O microfone já está ativo. Fale o produto ou tente novamente.';
    }
  });

  recognition.onresult = event=>{
    let finalText = '';
    let interimText = '';
    for(let i=event.resultIndex;i<event.results.length;i++){
      if(event.results[i].isFinal) finalText += event.results[i][0].transcript;
      else interimText += event.results[i][0].transcript;
    }
    const spoken = (finalText || interimText).trim();
    if(spoken) document.getElementById('name').value = spoken;
    if(finalText){
      voiceStatus.textContent = 'Reconheci: "'+finalText.trim()+'". Toque em Adicionar para incluir na lista.';
      voiceStatus.className = 'voice-status';
    }else if(interimText){
      voiceStatus.textContent = 'Entendi até agora: '+interimText;
    }
  };
  recognition.onerror = event=>{
    voiceButton.classList.remove('listening');
    const messages = {
      'not-allowed':'Permita o acesso ao microfone nas configurações do navegador.',
      'no-speech':'Não ouvi nada. Toque no microfone e tente novamente.',
      'audio-capture':'Não encontrei um microfone disponível neste dispositivo.'
    };
    voiceStatus.textContent = messages[event.error] || 'Não consegui reconhecer. Tente falar novamente.';
    voiceStatus.className = 'voice-status error';
  };
  recognition.onend = ()=>{
    voiceButton.classList.remove('listening');
  };
}

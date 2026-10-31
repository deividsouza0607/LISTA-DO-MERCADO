const KEY='rancho_amigos_lista_v2';let products=[];
try{products=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){}
const $=id=>document.getElementById(id);
function persist(){localStorage.setItem(KEY,JSON.stringify(products));draw()}
let sharedAudioContext=null;function beep(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!sharedAudioContext)sharedAudioContext=new AC();if(sharedAudioContext.state==='suspended')sharedAudioContext.resume();const c=sharedAudioContext,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=780;g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.10,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.18);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.19)}catch(e){}}
function add(value, quantity=1){
 let n=value.trim().replace(/^[-•*☐□✓✔]+\s*/,'').replace(/^\d+[\s.)-]+/,'').trim();
 if(!n)return;
 const existing=products.find(p=>p.name.toLowerCase()===n.toLowerCase()&&!p.done);
 let added;
 if(existing){ existing.qty=(existing.qty||1)+quantity; added=existing; }
 else { added={id:Date.now()+Math.random(),name:n,done:false,qty:quantity}; products.push(added); }
 // Mantém o ✓ verde após a inclusão até o usuário marcar o produto como colocado na cesta.
 added.justAdded=true;
 beep();
 return added;
}
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
  const li=document.createElement('li');li.className='item'+(p.done?' done':'')+(p.justAdded?' just-added':'');
  const mark=document.createElement('button');mark.className='mark';mark.type='button';mark.setAttribute('aria-label',p.done?'Marcar como não colocado na cesta':'Marcar como colocado na cesta');
  mark.onclick=()=>{p.done=!p.done;if(p.done){p.justAdded=false;beep()}persist()};
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

// Desmarca todos os produtos sem apagar nenhum item da lista.
$('uncheckAll').onclick=()=>{
 const marked=products.filter(p=>p.done).length;
 if(!products.length){
   $('voiceStatus').textContent='Sua lista está vazia. Adicione produtos para começar.';
   return;
 }
 if(!marked){
   $('voiceStatus').textContent='Todos os produtos já estão desmarcados.';
   return;
 }
 products.forEach(p=>{p.done=false;p.justAdded=false});
 persist();
 const message=`Pronto! Desmarquei ${marked} ${marked===1?'produto':'produtos'}. Sua lista foi mantida e todos estão pendentes.`;
 $('voiceStatus').textContent='↺ '+message;
 $('voiceStatus').className='voice-status active';
 if(typeof speakConfirmation==='function') speakConfirmation(message,listenAgain);
};

// Lista inicial de produtos básicos de supermercado.
const basicMarketList = [
 'Arroz','Feijão','Macarrão','Óleo de soja','Açúcar','Sal','Café','Farinha de trigo',
 'Molho de tomate','Leite','Manteiga ou margarina','Ovos','Pão','Queijo','Presunto',
 'Frango','Carne moída','Batata','Cebola','Alho','Tomate','Alface','Cenoura','Banana','Maçã',
 'Água','Suco','Biscoito','Detergente','Esponja','Sabão em pó','Amaciante',
 'Água sanitária','Papel higiênico','Papel toalha','Sabonete','Shampoo','Creme dental','Desodorante'
];
function addBasicMarketList(){
 let added=0, skipped=0;
 const existingNames=new Set(products.map(p=>normalizeText(p.name)));
 basicMarketList.forEach(name=>{
   if(existingNames.has(normalizeText(name))){skipped++;return;}
   products.push({id:Date.now()+Math.random(),name,done:false,qty:1,justAdded:true});
   existingNames.add(normalizeText(name)); added++;
 });
 if(added){beep();persist();}
 const message=added
   ? `Lista básica adicionada! ${added} produtos incluídos${skipped?` e ${skipped} que já estavam na sua lista foram ignorados`:''}.`
   : 'Os produtos da lista básica já estão na sua lista. Nenhum item duplicado foi adicionado.';
 const status=$('voiceStatus');
 if(status){status.textContent='✓ '+message;status.className='voice-status active';}
 if(typeof speakConfirmation==='function') speakConfirmation(message);
}
$('basicListBtn').addEventListener('click',addBasicMarketList);
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


// Inclusão por voz com confirmação falada antes de gravar na lista.
const voiceButton = document.getElementById('voiceBtn');
const voiceStatus = document.getElementById('voiceStatus');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let voiceMode = 'product';
let pendingVoiceItem = null;
let pendingDeleteId = null;
let restarting = false;

// Áudio otimizado para celulares (Android/iPhone): aguarda as vozes do sistema,
// libera a síntese no primeiro toque e evita iniciar o microfone enquanto Lucky fala.
let luckyVoice = null;
let luckySpeaking = false;
let speechUnlockRequested = false;
let speechWatchdog = null;
function chooseLuckyVoice(){
  if(!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices() || [];
  const ptBR = voices.filter(v => /^pt[-_]BR$/i.test(v.lang));
  const portuguese = ptBR.length ? ptBR : voices.filter(v => /^pt/i.test(v.lang));
  luckyVoice = portuguese.find(v => /natural|neural|google|francisca|luciana|antonio|microsoft/i.test(v.name)) || portuguese[0] || null;
}
if('speechSynthesis' in window){
  chooseLuckyVoice();
  window.speechSynthesis.onvoiceschanged = chooseLuckyVoice;
}
function unlockLuckyAudio(){
  if(speechUnlockRequested) return;
  speechUnlockRequested = true;
  if('speechSynthesis' in window){
    try{ window.speechSynthesis.resume(); }catch(e){}
    // Alguns navegadores móveis só carregam a lista de vozes após a primeira interação.
    chooseLuckyVoice();
    setTimeout(chooseLuckyVoice,250);
  }
}
function speakConfirmation(message, callback){
  if(!('speechSynthesis' in window)){
    voiceStatus.textContent = message + ' (áudio não disponível neste navegador)';
    if(callback) callback();
    return;
  }
  const synth = window.speechSynthesis;
  try{ synth.cancel(); }catch(e){}
  luckySpeaking = true;
  chooseLuckyVoice();
  const utterance = new SpeechSynthesisUtterance(String(message));
  utterance.lang = 'pt-BR';
  if(luckyVoice) utterance.voice = luckyVoice;
  utterance.rate = 0.92;
  utterance.pitch = 1.02;
  utterance.volume = 1;
  let finished = false;
  const finish = ()=>{
    if(finished) return;
    finished = true;
    clearTimeout(speechWatchdog);
    luckySpeaking = false;
    if(callback) setTimeout(callback,350);
  };
  utterance.onend = finish;
  utterance.onerror = finish;
  // Fallback para celulares em que o evento onend não é disparado.
  speechWatchdog = setTimeout(finish, Math.max(7000, String(message).length*115));
  try{
    synth.speak(utterance);
    synth.resume();
  }catch(e){ finish(); }
}
function listenAgain(){
  if(!recognition || !voiceSessionActive || luckySpeaking) return;
  try{ recognition.start(); }
  catch(e){ /* onend fará uma nova tentativa se o reconhecimento já estiver ocupado. */ }
}
function parseSpokenProduct(text){
  let value=normalizeText(text).replace(/[.,!?]/g,' ');
  let quantity=1;
  const numberWords={
    'um':1,'uma':1,'dois':2,'duas':2,'três':3,'tres':3,'quatro':4,
    'cinco':5,'seis':6,'sete':7,'oito':8,'nove':9,'dez':10,
    'onze':11,'doze':12,'meia dúzia':6,'meia duzia':6,'dúzia':12,'duzia':12
  };
  const dozen=value.match(/^(.*?)\s*(?:meia\s+duzia|uma\s+duzia|duzia)\s+(?:de\s+)?(.+)$/i);
  if(dozen){
    quantity=/meia/i.test(value)?6:12;
    value=(dozen[1]+' '+dozen[2]).trim();
  }
  const leadingWordQuantity=value.match(/^(um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze)\s+(?:(?:unidades?|pacotes?|caixas?)\s+(?:de\s+)?)?(.+)$/i);
  if(!dozen && leadingWordQuantity){
    const word=leadingWordQuantity[1];
    const quantities={'um':1,'uma':1,'dois':2,'duas':2,'tres':3,'quatro':4,'cinco':5,'seis':6,'sete':7,'oito':8,'nove':9,'dez':10,'onze':11,'doze':12};
    quantity=quantities[word];
    value=leadingWordQuantity[2].trim();
  }
  const patterns=[
    /(?:quantidade\s*)?(\d+)\s*(?:unidades?|itens?|pacotes?|caixas?)?\s*(?:de\s*)?(.*)/i,
    /(.*?)\s+(?:quantidade\s*)?(um|uma|dois|duas|três|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze)$/i
  ];
  let m=quantity===1?value.match(patterns[0]):null;
  if(m && m[2] && m[2].trim()){
    quantity=Math.max(1,Math.min(999,parseInt(m[1],10)));
    value=m[2].trim();
  }else if(quantity===1){
    m=value.match(patterns[1]);
    if(m && numberWords[m[2]]){
      quantity=numberWords[m[2]];
      value=m[1].trim();
    }else{
      const phrase=value.match(/^(.*?)\s+(?:quantidade\s+)?(\d+)$/i);
      if(phrase){value=phrase[1].trim();quantity=Math.max(1,Math.min(999,parseInt(phrase[2],10)));}
    }
  }
  value=value.replace(/^(?:lucky|luqui|por favor|quero|adicionar|colocar|incluir)\s+/i,'').trim();
  return {name:value,qty:quantity};
}

// Catálogo de referência: o Lucky aceita somente produtos típicos de supermercado.
const marketCatalog = `arroz feijao macarrao massa farinha farinha de trigo farinha de mandioca fuba acucar sal oleo azeite vinagre molho de tomate extrato de tomate ketchup mostarda maionese molho shoyu milho ervilha seleta de legumes lentilha grao de bico pipoca aveia granola cereal farinha lactea tapioca polvilho fermento gelatina pudim leite leite em po leite condensado creme de leite iogurte queijo requeijao manteiga margarina nata ovos pao pão de forma pao frances torrada biscoito bolacha bolacha recheada bolacha agua e sal wafer bolo mistura para bolo chocolate achocolatado cafe chá suco agua refrigerante agua com gas cerveja vinho`;
const marketCatalogExtra = `carne bovina carne moida frango peito de frango coxa sobrecoxa peixe linguica salsicha bacon presunto mortadela salame peito de peru hamburguer nuggets empanado congelado pizza lasanha batata palha batata mandioca aipim cebola alho tomate alface couve repolho cenoura beterraba abobrinha pepino pimentao brocolis couve flor chuchu abobora cheiro verde salsa cebolinha coentro banana maca pera laranja mamao melancia melao uva morango abacaxi manga limao frutas verduras legumes`;
const marketCatalogCleaning = `detergente sabao em po sabao liquido amaciante agua sanitaria desinfetante limpador multiuso alcool esponja palha de aco saco de lixo papel higienico papel toalha guardanapo papel aluminio filme plastico inseticida`;
const marketCatalogPersonal = `sabonete shampoo condicionador creme dental pasta de dente escova de dente fio dental desodorante absorvente fralda lenço umedecido lenco umedecido algodao cotonete creme hidratante papel`;
const marketCatalogPets = `racao cachorro racao gato areia higienica petisco`;
const marketTerms = (marketCatalog+' '+marketCatalogExtra+' '+marketCatalogCleaning+' '+marketCatalogPersonal+' '+marketCatalogPets).split(/\s+/).map(normalizeText).filter(term=>term.length>=3 && !['com','para','por','uma','uns','das','dos'].includes(term));
function normalizeText(value){return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
function isMarketProduct(name){
 const n=normalizeText(name);
 if(!n)return false;
 const aliases=['coca cola','pepsi','guarana','fanta','sprite','nescau','toddy','omo','ype','comfort','downy','dove','colgate','oral b','nespresso'];
 if(aliases.some(a=>n===normalizeText(a)||n.startsWith(normalizeText(a)+' ')))return true;
 // Compara palavras inteiras para evitar que nomes aleatórios sejam aceitos por conterem apenas pedaços de palavras.
 const words=n.split(' ').filter(Boolean);
 return words.some(word=>marketTerms.includes(word));
}
function speakListSummary(kind){
 const pending=products.filter(p=>!p.done), done=products.filter(p=>p.done);
 const totalUnits=products.reduce((sum,p)=>sum+(p.qty||1),0);
 const pendingUnits=pending.reduce((sum,p)=>sum+(p.qty||1),0);
 const doneUnits=done.reduce((sum,p)=>sum+(p.qty||1),0);
 let message='';
 if(kind==='count'){
   message=products.length===0?'Sua lista ainda está vazia.':`Você incluiu ${products.length} ${products.length===1?'produto':'produtos'}, somando ${totalUnits} ${totalUnits===1?'unidade':'unidades'}. ${pending.length} ${pending.length===1?'produto está':'produtos estão'} pendente(s) e ${done.length} ${done.length===1?'já foi':'já foram'} colocado(s) na cesta.`;
 }else if(kind==='pending'){
   if(!pending.length) message='Parabéns! Você já pegou todos os produtos da sua lista.';
   else message=`Ainda falta pegar ${pending.length} ${pending.length===1?'produto':'produtos'}, totalizando ${pendingUnits} ${pendingUnits===1?'unidade':'unidades'}: `+pending.map(p=>`${p.name}, quantidade ${p.qty||1}`).join('; ')+'.';
 }else{
   message=done.length?`Você já colocou na cesta: `+done.map(p=>`${p.name}, quantidade ${p.qty||1}`).join('; ')+`. São ${doneUnits} unidades.`:'Você ainda não marcou nenhum produto como colocado na cesta.';
 }
 voiceStatus.textContent=message;voiceStatus.className='voice-status active';speakConfirmation(message,listenAgain);
}

function handleVoiceResult(text){
  const heard=text.trim();
  if(!heard)return;
  const query=normalizeText(heard).replace(/^(lucky|luqui)\s+/,'').trim();
  const keepListening=(message)=>speakConfirmation(message,listenAgain);

  if(voiceMode==='product'){
    // Consultas sobre a lista: aceita diferentes formas naturais de perguntar.
    if(/\b(quantos|quantas)\b/.test(query) && /\b(itens?|produtos?|unidades?|compras?)\b/.test(query) && /(lista|incluid|adicion|tem|foram|existe|total)/.test(query)){
      speakListSummary('count');return;
    }
    if(/(o que|que|quais|quais sao).*(falta|faltam|pendente|pendentes|pegar|comprar)|(falta|faltam).*(pegar|comprar)/.test(query)){
      speakListSummary('pending');return;
    }
    if(/(o que|quais).*(ja peguei|ja coloquei|esta na cesta|estao na cesta)|(itens|produtos).*(na cesta|concluidos|marcados)/.test(query)){
      speakListSummary('done');return;
    }
    if(/\b(resumo|resumir|ler a lista|leia a lista|listar produtos)\b/.test(query)){
      speakListSummary('count');return;
    }
    // Saudação: ativa uma conversa encadeada com o Lucky.
    if(/\b(ola|oi|bom dia|boa tarde|boa noite)\b/.test(query) && /\b(lucky|luqui)\b/.test(normalizeText(heard))){
      const message='Olá! Qual a tarefa de hoje?';
      voiceStatus.textContent=message;voiceStatus.className='voice-status active';
      keepListening(message);return;
    }
    if(/(desmarcar tudo|desmarque tudo|desmarcar todos|zerar marcacoes|reiniciar marcacoes)/.test(query)){
      const count=products.filter(p=>p.done).length;
      products.forEach(p=>{p.done=false;p.justAdded=false});persist();
      const message=count?`Pronto! Desmarquei ${count} produtos. Sua lista continua salva.`:'Todos os produtos já estavam desmarcados.';
      voiceStatus.textContent=message;voiceStatus.className='voice-status active';keepListening(message);return;
    }
    if(/(lista basica|lista de mercado basica|lista inicial|adicionar lista basica|carregar lista basica)/.test(query)){
      addBasicMarketList();return;
    }
    const deleteMatch=heard.match(/^(?:lucky[, ]*)?(?:por favor\s+)?(?:excluir|exclua|remover|remova|apagar|apague|deletar|delete)\s+(?:o\s+|a\s+|os\s+|as\s+)?(.+)$/i);
    if(deleteMatch){
      const wanted=normalizeText(deleteMatch[1].replace(/[.,!?]$/,''));
      const found=products.find(p=>normalizeText(p.name)===wanted) || products.find(p=>normalizeText(p.name).includes(wanted));
      if(!found){
        const message=`Não encontrei ${deleteMatch[1]} na lista. Confira o nome e tente novamente.`;
        voiceStatus.textContent=message;voiceStatus.className='voice-status error';keepListening('Não encontrei esse produto. Tente novamente.');return;
      }
      pendingDeleteId=found.id;pendingVoiceItem=null;voiceMode='deleteConfirm';
      voiceStatus.textContent=`Confirme a exclusão de: ${found.name}.`;voiceStatus.className='voice-status active';
      keepListening(`Você quer excluir ${found.name} da lista? Diga confirmar ou cancelar.`);return;
    }
    const parsed=parseSpokenProduct(heard);
    if(!parsed.name){
      voiceStatus.textContent='Não identifiquei o produto. Diga, por exemplo, arroz quantidade dois.';
      voiceStatus.className='voice-status error';keepListening('Não identifiquei o produto. Pode repetir?');return;
    }
    if(!isMarketProduct(parsed.name)){
      voiceStatus.textContent='Esse item não parece ser um produto de supermercado. Tente um alimento, bebida, produto de limpeza ou higiene.';
      voiceStatus.className='voice-status error';keepListening('Esse item não está no catálogo de mercado. Tente outro produto.');return;
    }
    pendingVoiceItem=parsed;voiceMode='confirm';
    const confirmation=`Você quer incluir ${parsed.name}, quantidade ${parsed.qty}? Diga confirmar ou cancelar.`;
    voiceStatus.textContent=`Confirme por voz: ${parsed.name} — quantidade ${parsed.qty}.`;
    voiceStatus.className='voice-status active';keepListening(confirmation);return;
  }

  const answer=normalizeText(heard);
  if(voiceMode==='deleteConfirm'){
    if(/\b(confirmar|confirmo|sim|pode|isso|excluir)\b/.test(answer)){
      const target=products.find(p=>p.id===pendingDeleteId);
      if(target){products=products.filter(p=>p.id!==pendingDeleteId);persist();voiceStatus.textContent=`✓ ${target.name} excluído da lista.`;voiceStatus.className='voice-status active';}
      pendingDeleteId=null;voiceMode='product';keepListening('Produto excluído da lista.');
    }else if(/\b(cancelar|cancela|nao|negativo)\b/.test(answer)){
      pendingDeleteId=null;voiceMode='product';voiceStatus.textContent='Exclusão cancelada. O produto continua na lista.';voiceStatus.className='voice-status active';keepListening('Exclusão cancelada.');
    }else{
      voiceStatus.textContent='Não entendi. Diga confirmar ou cancelar.';keepListening('Por favor, diga confirmar ou cancelar.');
    }
    return;
  }
  if(/\b(confirmar|confirmo|sim|pode|adicionar|correto|isso)\b/.test(answer)){
    const item=pendingVoiceItem;
    if(item){
      add(item.name,item.qty);persist();$('name').value='';
      voiceStatus.textContent=`✓ ${item.name} (${item.qty}) incluído na lista!`;voiceStatus.className='voice-status active';
      pendingVoiceItem=null;voiceMode='product';keepListening('OK, item incluído. Qual é o próximo?');
    }
  }else if(/\b(cancelar|cancela|nao|negativo)\b/.test(answer)){
    pendingVoiceItem=null;voiceMode='product';$('name').value='';
    voiceStatus.textContent='Inclusão cancelada. Pode dizer outro produto.';voiceStatus.className='voice-status active';keepListening('Item cancelado. Qual é o próximo?');
  }else{
    voiceStatus.textContent='Não entendi. Diga confirmar ou cancelar.';keepListening('Por favor, diga confirmar ou cancelar.');
  }
}

let voiceSessionActive=false;
if(!SpeechRecognition){
  voiceButton.disabled=true;
  voiceButton.title='Reconhecimento de voz não disponível neste navegador';
  voiceStatus.textContent='Use Chrome ou Edge atualizado e permita o acesso ao microfone.';
  voiceStatus.classList.add('error');
}else if(!window.isSecureContext && location.hostname!=='localhost' && location.hostname!=='127.0.0.1'){
  voiceButton.disabled=true;
  voiceStatus.textContent='Para usar o microfone no celular, abra o aplicativo por um endereço HTTPS e permita o acesso ao microfone.';
  voiceStatus.classList.add('error');
}else{
  recognition=new SpeechRecognition();
  recognition.lang='pt-BR';
  recognition.continuous=false;
  recognition.interimResults=false;
  recognition.maxAlternatives=3;
  voiceButton.addEventListener('click',()=>{
    unlockLuckyAudio();
    if(voiceSessionActive){
      voiceSessionActive=false;
      try{recognition.stop()}catch(e){}
      voiceButton.classList.remove('listening');
      voiceStatus.textContent='Conversa com Lucky pausada. Toque no microfone para continuar.';
      voiceStatus.className='voice-status';
      return;
    }
    voiceSessionActive=true;
    voiceMode='product';pendingVoiceItem=null;pendingDeleteId=null;
    voiceStatus.textContent='Estou ouvindo. Diga um comando ou produto.';
    voiceStatus.className='voice-status active';
    // O toque libera o áudio do dispositivo; o reconhecimento começa imediatamente.
    listenAgain();
  });
  recognition.onstart=()=>{voiceButton.classList.add('listening');};
  recognition.onresult=event=>{
    const result=event.results[event.results.length-1];
    const spoken=result[0].transcript;
    handleVoiceResult(spoken);
  };
  recognition.onerror=event=>{
    voiceButton.classList.remove('listening');
    const messages={
      'not-allowed':'Permita o acesso ao microfone nas configurações do navegador.',
      'service-not-allowed':'O navegador bloqueou o reconhecimento de voz. Verifique as permissões.',
      'no-speech':'Não ouvi nada. Toque no microfone e tente novamente.',
      'audio-capture':'Não encontrei um microfone disponível.',
      'network':'Falha na conexão do reconhecimento de voz. Verifique a internet e tente novamente.'
    };
    voiceStatus.textContent=messages[event.error]||'Não consegui reconhecer. Tente novamente.';
    voiceStatus.className='voice-status error';
    if(['not-allowed','service-not-allowed','audio-capture'].includes(event.error)) voiceSessionActive=false;
  };
  recognition.onend=()=>{
    voiceButton.classList.remove('listening');
    // Reinicia apenas quando Lucky terminar de falar.
    if(voiceSessionActive && !luckySpeaking && !(window.speechSynthesis && window.speechSynthesis.speaking)){ 
      setTimeout(()=>{if(voiceSessionActive)listenAgain()},350);
    }
  };
}

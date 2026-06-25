/* ============================================================
   PANELS — Mamb-ul-Uloom Madrasa App
   Relies on globals from index.html: db, state, el, toast, waLink,
   CLASS_LABEL, CLASS_SHIFT, Header, NavBar, render, persistSession
   ============================================================ */

const MONTHS = ["ഏപ്രിൽ","മേയ്","ജൂൺ","ജൂലൈ","ഓഗസ്റ്റ്","സെപ്റ്റംബർ","ഒക്ടോബർ","നവംബർ","ഡിസംബർ","ജനുവരി","ഫെബ്രുവരി","മാർച്ച്"];
const EXAM_TYPES = [['quarter','പാദ വാർഷികം'],['half','അർധ വാർഷികം'],['annual','വാർഷികം']];
const todayISO = ()=> new Date().toISOString().slice(0,10);
const classList = Object.keys(CLASS_LABEL);

function fileToBase64(file){
  return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
}
function studentsByClass(cls){
  return Object.entries(state.data.students||{}).filter(([reg,s])=>s.cls===cls && !s.deleted).map(([reg,s])=>({reg,...s}));
}
function staffList(){ return Object.entries(state.data.staff||{}).filter(([id,s])=>!s.deleted).map(([id,s])=>({id,...s})); }

/* ============================================================
   SADHAR PANEL
   ============================================================ */
function SadharPanel(){
  const wrap = el('div','flex-1 flex flex-col min-h-screen pb-2');
  const content = el('div','flex-1 overflow-y-auto');
  wrap.appendChild(Header('സദർ പാനൽ','പൂർണ്ണ അഡ്മിൻ നിയന്ത്രണം','സദർ'));
  wrap.appendChild(content);

  const items = [
    {key:'home', icon:'🏠', label:'ഹോം'},
    {key:'shift', icon:'⏰', label:'ഷിഫ്റ്റ്'},
    {key:'staff', icon:'👥', label:'ജീവനക്കാർ'},
    {key:'attendance', icon:'✅', label:'ഹാജർ'},
    {key:'exam', icon:'📅', label:'പരീക്ഷ'},
    {key:'fee', icon:'💰', label:'ഫീസ്'},
    {key:'holiday', icon:'🏖️', label:'അവധി'},
    {key:'announce', icon:'📢', label:'അറിയിപ്പ്'},
    {key:'students', icon:'📚', label:'കുട്ടികൾ'},
    {key:'feecounter', icon:'🧾', label:'ഫീസ് കൗണ്ടർ'},
    {key:'backup', icon:'📋', label:'ബാക്കപ്പ്'},
  ];
  let active = 'home';
  const nav = NavBar(items.slice(0,5), active, sel);
  // primary 5 in bottom nav, rest accessible via "more" grid on home
  const navHolder = el('div'); navHolder.appendChild(nav);
  wrap.appendChild(navHolder);

  function sel(key){ active=key; paint(); }
  window.__panelRefresh = paint;

  function paint(){
    content.innerHTML='';
    navHolder.innerHTML=''; navHolder.appendChild(NavBar(items.slice(0,5), active, sel));
    const map = { home: sHome, shift: sShift, staff: sStaff, attendance: sAttendance, exam: sExam,
      fee: sFee, holiday: sHoliday, announce: sAnnounce, students: sStudents, feecounter: sFeeCounter, backup: sBackup };
    content.appendChild(map[active]());
  }

  function sHome(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    const totalStudents = Object.values(state.data.students||{}).filter(s=>!s.deleted).length;
    const totalStaff = staffList().length;
    const todayAtt = Object.keys(state.data.attendance||{}).filter(k=>k.startsWith(todayISO())).length;
    c.innerHTML = `
      <div class="grid grid-cols-3 gap-2 mb-5">
        <div class="arch-card bg-deep text-white p-3 text-center"><div class="text-2xl font-display">${totalStudents}</div><div class="text-[10px] text-gold">കുട്ടികൾ</div></div>
        <div class="arch-card bg-deep2 text-white p-3 text-center"><div class="text-2xl font-display">${totalStaff}</div><div class="text-[10px] text-gold">ജീവനക്കാർ</div></div>
        <div class="arch-card bg-rose text-white p-3 text-center"><div class="text-2xl font-display">${todayAtt}</div><div class="text-[10px] text-gold">ഇന്നത്തെ ഹാജർ</div></div>
      </div>
      <div class="text-sm font-medium text-deep/70 mb-2">കൂടുതൽ ഫീച്ചറുകൾ</div>
      <div id="moreGrid" class="grid grid-cols-3 gap-3"></div>
    `;
    const grid = c.querySelector('#moreGrid');
    items.slice(5).forEach(it=>{
      const b = el('button','arch-card bg-white border border-deep/10 py-4 flex flex-col items-center gap-1 text-[11px] font-medium text-deep hover:border-gold transition');
      b.innerHTML = `<span class="text-xl">${it.icon}</span>${it.label}`;
      b.onclick=()=>sel(it.key);
      grid.appendChild(b);
    });
    return c;
  }

  /* ---------- 1. Shift + Class linking ---------- */
  function sShift(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">⏰ ഷിഫ്റ്റ് + ക്ലാസ്സ് ലിങ്കിംഗ്</div>`;
    const shifts = state.data.shiftClassMapping?.shifts || {};
    [1,2,3].forEach(num=>{
      const sd = shifts[num] || {time:'', classes:[]};
      const box = el('div','arch-card bg-white border border-deep/10 p-4 mb-3');
      box.innerHTML = `
        <div class="font-medium text-deep mb-2">ഷിഫ്റ്റ് ${num}</div>
        <input type="text" value="${sd.time||''}" placeholder="സമയം (ഉദാ: 7:30 AM - 9:00 AM)" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 text-sm mb-3 timeInput"/>
        <div class="flex flex-wrap gap-2 clsWrap"></div>
      `;
      const clsWrap = box.querySelector('.clsWrap');
      classList.forEach(cls=>{
        const checked = (sd.classes||[]).includes(cls);
        const chip = el('button', `pill px-3 py-1.5 text-xs border-2 ${checked?'bg-deep text-white border-deep':'border-deep/15 text-deep/70'}`, `${CLASS_LABEL[cls]}-ാം`);
        chip.dataset.cls = cls; chip.dataset.on = checked?'1':'0';
        chip.onclick = ()=>{ const on = chip.dataset.on==='1'; chip.dataset.on = on?'0':'1';
          chip.className = `pill px-3 py-1.5 text-xs border-2 ${!on?'bg-deep text-white border-deep':'border-deep/15 text-deep/70'}`; };
        clsWrap.appendChild(chip);
      });
      const saveBtn = el('button','mt-3 w-full bg-gold text-deep font-medium rounded-lg py-2 text-sm','സേവ് ചെയ്യുക');
      saveBtn.onclick = async ()=>{
        const time = box.querySelector('.timeInput').value;
        const classes = [...clsWrap.querySelectorAll('button')].filter(b=>b.dataset.on==='1').map(b=>b.dataset.cls);
        await db.ref('shiftClassMapping/shifts/'+num).set({time, classes});
        toast('ഷിഫ്റ്റ് സേവ് ചെയ്തു');
      };
      box.appendChild(saveBtn);
      c.appendChild(box);
    });
    return c;
  }

  /* ---------- 2. Staff management ---------- */
  function sStaff(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="flex items-center justify-between mb-4">
        <div class="font-display text-xl text-deep">👥 ജീവനക്കാർ</div>
        <button id="addStaffBtn" class="bg-deep text-white text-xs px-3 py-2 rounded-lg">+ പുതിയത്</button>
      </div><div id="staffList" class="space-y-2"></div>`;
    const list = c.querySelector('#staffList');
    staffList().forEach(s=>{
      const row = el('div','arch-card bg-white border border-deep/10 p-3 flex items-center gap-3');
      row.innerHTML = `
        <div class="w-11 h-11 rounded-full bg-deep/10 overflow-hidden flex items-center justify-center text-deep/40">${s.photo?`<img src="${s.photo}" class="w-full h-full object-cover"/>`:'👤'}</div>
        <div class="flex-1">
          <div class="font-medium text-sm">${s.name}</div>
          <div class="text-[11px] text-deep/40">${s.role==='teacher'?'അധ്യാപകൻ':'മാനേജ്മെന്റ്'} ${s.position?'· '+positionLabel(s.position):''} ${s.classes?.length?'· ക്ലാസ്: '+s.classes.map(c=>CLASS_LABEL[c]).join(', '):''}</div>
        </div>
        <button class="text-rose text-xs delBtn">നീക്കം</button>`;
      row.querySelector('.delBtn').onclick = async ()=>{ if(confirm('നീക്കം ചെയ്യണോ?')){ await db.ref('staff/'+s.id+'/deleted').set(true); toast('നീക്കം ചെയ്തു'); paint(); } };
      list.appendChild(row);
    });
    c.querySelector('#addStaffBtn').onclick = ()=>openStaffModal();
    return c;
  }
  function positionLabel(p){ return {president:'പ്രസിഡൻ്റ്',general_secretary:'ജനറൽ സെക്രട്ടറി',joint_secretary:'ജോയിൻ സെക്രട്ടറി',madrasa_manager:'മദ്റസ മാനേജർ',other:'മറ്റ്'}[p]||p; }
  function openStaffModal(){
    const m = Modal('പുതിയ ജീവനക്കാരൻ');
    const body = m.body;
    body.innerHTML = `
      <input id="sName" placeholder="പേര്" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-2"/>
      <input id="sUser" placeholder="യൂസർനെയിം" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-2"/>
      <input id="sPass" placeholder="പാസ്‌വേർഡ്" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-2"/>
      <select id="sRole" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-2">
        <option value="teacher">അധ്യാപകൻ</option><option value="management">മാനേജ്മെന്റ്</option>
      </select>
      <div id="posWrap" class="mb-2 hidden">
        <select id="sPos" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2">
          <option value="president">പ്രസിഡൻ്റ്</option><option value="general_secretary">ജനറൽ സെക്രട്ടറി</option>
          <option value="joint_secretary">ജോയിൻ സെക്രട്ടറി</option><option value="madrasa_manager">മദ്റസ മാനേജർ</option>
          <option value="other">മറ്റ്</option>
        </select>
      </div>
      <div id="clsWrap2" class="flex flex-wrap gap-2 mb-2"></div>
      <input id="sPhoto" type="file" accept="image/*" class="w-full text-xs mb-3"/>
      <button id="sSave" class="w-full bg-deep text-white rounded-lg py-2.5 font-medium">സേവ് ചെയ്യുക</button>
    `;
    const clsWrap2 = body.querySelector('#clsWrap2');
    classList.forEach(cls=>{
      const chip = el('button', `pill px-3 py-1.5 text-xs border-2 border-deep/15 text-deep/70`, `${CLASS_LABEL[cls]}-ാം`);
      chip.dataset.cls=cls; chip.dataset.on='0';
      chip.onclick=()=>{ const on=chip.dataset.on==='1'; chip.dataset.on=on?'0':'1'; chip.className=`pill px-3 py-1.5 text-xs border-2 ${!on?'bg-deep text-white border-deep':'border-deep/15 text-deep/70'}`; };
      clsWrap2.appendChild(chip);
    });
    body.querySelector('#sRole').onchange = (e)=>{ body.querySelector('#posWrap').classList.toggle('hidden', e.target.value!=='management'); clsWrap2.classList.toggle('hidden', e.target.value!=='teacher'); };
    body.querySelector('#sSave').onclick = async ()=>{
      const name=body.querySelector('#sName').value.trim(), username=body.querySelector('#sUser').value.trim(), password=body.querySelector('#sPass').value.trim();
      const role=body.querySelector('#sRole').value, position = role==='management'?body.querySelector('#sPos').value:null;
      const classes = role==='teacher' ? [...clsWrap2.querySelectorAll('button')].filter(b=>b.dataset.on==='1').map(b=>b.dataset.cls) : [];
      if(!name||!username||!password){ toast('എല്ലാ വിവരങ്ങളും നൽകുക', false); return; }
      let photo=null; const f=body.querySelector('#sPhoto').files[0]; if(f) photo = await fileToBase64(f);
      const ref = db.ref('staff').push();
      await ref.set({name,username,password,role,position,classes,photo});
      toast('ജീവനക്കാരനെ ചേർത്തു'); m.close(); paint();
    };
  }

  /* ---------- 3. Sadhar direct attendance ---------- */
  function sAttendance(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">✅ ഹാജർ (നേരിട്ട്)</div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <select id="clsSel" class="border-2 border-deep/15 rounded-lg px-3 py-2 text-sm">${classList.map(cl=>`<option value="${cl}">${CLASS_LABEL[cl]}-ാം ക്ലാസ്</option>`).join('')}</select>
        <input id="dateSel" type="date" value="${todayISO()}" class="border-2 border-deep/15 rounded-lg px-3 py-2 text-sm"/>
      </div>
      <div id="attList" class="space-y-2"></div>`;
    function loadList(){
      const cls = c.querySelector('#clsSel').value, date = c.querySelector('#dateSel').value;
      const list = c.querySelector('#attList'); list.innerHTML='';
      studentsByClass(cls).forEach(s=>{
        const key = `${date}_${s.reg}`;
        const cur = state.data.attendance?.[key];
        const row = el('div','arch-card bg-white border border-deep/10 p-3 flex items-center gap-3');
        row.innerHTML = `<div class="flex-1"><div class="font-medium text-sm">${s.name}</div><div class="text-[11px] text-deep/40">Reg: ${s.reg}</div></div>
          <button class="pBtn pill px-3 py-1.5 text-xs border-2 ${cur==='present'?'bg-deep2 text-white border-deep2':'border-deep/15 text-deep/60'}">ഹാജർ</button>
          <button class="aBtn pill px-3 py-1.5 text-xs border-2 ${cur==='absent'?'bg-rose text-white border-rose':'border-deep/15 text-deep/60'}">ഇല്ല</button>
          ${cur==='absent'?`<a target="_blank" class="text-lg waBtn">💬</a>`:''}`;
        row.querySelector('.pBtn').onclick = ()=>markAtt(cls,date,s,'present',row);
        row.querySelector('.aBtn').onclick = ()=>markAtt(cls,date,s,'absent',row);
        const wa = row.querySelector('.waBtn'); if(wa) wa.href = waLink(s.phone, `അസ്സലാമു അലൈക്കും ${s.father||''} രക്ഷിതാവേ, ${date} തീയതിയിൽ ${s.name} (Reg: ${s.reg}) ഹാജരില്ല. (ഈ ക്ലാസിലെ അധ്യാപകൻ അവധിയാണ്) ദയവായി ശ്രദ്ധിക്കുക. - മമ്പഉൽ ഉലൂം മദ്റസ കൊറക്കോട്`);
        list.appendChild(row);
      });
    }
    async function markAtt(cls,date,s,status,row){
      await db.ref('attendance/'+`${date}_${s.reg}`).set(status);
      // mark teacher of this class absent automatically
      const teacher = staffList().find(t=>t.role==='teacher' && (t.classes||[]).includes(cls));
      if(teacher) await db.ref('staffAttendance/'+`${date}_${teacher.username}`).set('absent');
      toast('ഹാജർ രേഖപ്പെടുത്തി'); loadList();
    }
    c.querySelector('#clsSel').onchange = loadList;
    c.querySelector('#dateSel').onchange = loadList;
    setTimeout(loadList,0);
    return c;
  }

  /* ---------- 4. Exam timetable ---------- */
  function sExam(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">📅 പരീക്ഷാ ടൈംടേബിൾ</div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <select id="clsSel" class="border-2 border-deep/15 rounded-lg px-3 py-2 text-sm">${classList.map(cl=>`<option value="${cl}">${CLASS_LABEL[cl]}-ാം ക്ലാസ്</option>`).join('')}</select>
        <select id="examSel" class="border-2 border-deep/15 rounded-lg px-3 py-2 text-sm">${EXAM_TYPES.map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div id="rows" class="space-y-2 mb-3"></div>
      <button id="addRow" class="text-xs text-deep border-2 border-deep/15 rounded-lg px-3 py-2 mb-3">+ വിഷയം ചേർക്കുക</button>
      <button id="saveTt" class="w-full bg-deep text-white rounded-lg py-2.5 font-medium mb-3">സേവ് ചെയ്യുക</button>
      <button id="sendAlert" class="w-full bg-gold text-deep rounded-lg py-2.5 font-medium">📢 Send Tomorrow's Exam Alert</button>`;
    function currentKey(){ return [c.querySelector('#clsSel').value, c.querySelector('#examSel').value]; }
    function loadRows(){
      const [cls,exam] = currentKey();
      const rows = c.querySelector('#rows'); rows.innerHTML='';
      const list = state.data.examTimetables?.[cls]?.[exam] || [];
      list.forEach((r,i)=>addRowEl(r,i));
      if(!list.length) addRowEl({},0);
    }
    function addRowEl(r={}, idx){
      const rows = c.querySelector('#rows');
      const row = el('div','grid grid-cols-3 gap-2');
      row.innerHTML = `<input placeholder="വിഷയം" value="${r.subject||''}" class="subj border-2 border-deep/15 rounded-lg px-2 py-2 text-xs col-span-1"/>
        <input type="date" value="${r.date||''}" class="dt border-2 border-deep/15 rounded-lg px-2 py-2 text-xs"/>
        <input type="time" value="${r.time||''}" class="tm border-2 border-deep/15 rounded-lg px-2 py-2 text-xs"/>`;
      rows.appendChild(row);
    }
    c.querySelector('#addRow').onclick = ()=>addRowEl();
    c.querySelector('#clsSel').onchange = loadRows; c.querySelector('#examSel').onchange = loadRows;
    c.querySelector('#saveTt').onclick = async ()=>{
      const [cls,exam] = currentKey();
      const data = [...c.querySelectorAll('#rows > div')].map(r=>({subject:r.querySelector('.subj').value,date:r.querySelector('.dt').value,time:r.querySelector('.tm').value})).filter(r=>r.subject);
      await db.ref(`examTimetables/${cls}/${exam}`).set(data);
      toast('ടൈംടേബിൾ സേവ് ചെയ്തു');
    };
    c.querySelector('#sendAlert').onclick = ()=>{
      const [cls,exam] = currentKey();
      const list = state.data.examTimetables?.[cls]?.[exam] || [];
      const examLabel = EXAM_TYPES.find(e=>e[0]===exam)[1];
      const text = `📢 മമ്പഉൽ ഉലൂം മദ്റസ - ${CLASS_LABEL[cls]}-ാം ക്ലാസ് ${examLabel} പരീക്ഷ ടൈംടേബിൾ: ` + list.map(l=>`${l.subject} (${l.date} ${l.time})`).join(', ');
      const targets = studentsByClass(cls);
      if(!targets.length){ toast('ഈ ക്ലാസിൽ കുട്ടികളില്ല', false); return; }
      window.open(waLink(targets[0].phone, text), '_blank');
      toast('ആദ്യ രക്ഷിതാവിന് അയക്കാൻ WhatsApp തുറന്നു — ഓരോരുത്തർക്കും ഇതുപോലെ അയക്കാം');
    };
    setTimeout(loadRows,0);
    return c;
  }

  /* ---------- 5. Fee structure & QR ---------- */
  function sFee(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    const fq = state.data.feeQR || {};
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">💰 ഫീസ് ഘടന & QR</div>
      <label class="text-sm text-deep/70">പ്രതിമാസ ഫീസ് (₹)</label>
      <input id="monthlyFee" type="number" value="${fq.monthlyFee||''}" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-3"/>
      <label class="text-sm text-deep/70">Google Pay നമ്പർ</label>
      <input id="gpay" value="${fq.googlePay||''}" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-3"/>
      <label class="text-sm text-deep/70">QR കോഡ്</label>
      <input id="qrFile" type="file" accept="image/*" class="w-full text-xs mb-2"/>
      ${fq.qrBase64?`<img src="${fq.qrBase64}" class="w-32 h-32 object-contain border rounded-lg mb-3"/>`:''}
      <button id="saveFee" class="w-full bg-deep text-white rounded-lg py-2.5 font-medium">സേവ് ചെയ്യുക</button>`;
    c.querySelector('#saveFee').onclick = async ()=>{
      const monthlyFee = c.querySelector('#monthlyFee').value;
      const googlePay = c.querySelector('#gpay').value;
      let qrBase64 = fq.qrBase64;
      const f = c.querySelector('#qrFile').files[0]; if(f) qrBase64 = await fileToBase64(f);
      await db.ref('feeQR').set({monthlyFee,googlePay,qrBase64:qrBase64||null});
      toast('ഫീസ് വിവരങ്ങൾ സേവ് ചെയ്തു'); paint();
    };
    return c;
  }

  /* ---------- 6. Holiday board ---------- */
  function sHoliday(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">🏖️ അവധി പ്രഖ്യാപനം</div>
      <input id="hDate" type="date" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-2"/>
      <select id="hShift" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-2">
        <option value="all">എല്ലാ ഷിഫ്റ്റും</option><option value="1">ഷിഫ്റ്റ് 1</option><option value="2">ഷിഫ്റ്റ് 2</option><option value="3">ഷിഫ്റ്റ് 3</option>
      </select>
      <input id="hReason" placeholder="കാരണം" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-3"/>
      <button id="hAdd" class="w-full bg-deep text-white rounded-lg py-2.5 font-medium mb-5">അവധി പ്രഖ്യാപിക്കുക</button>
      <div class="text-sm font-medium text-deep/70 mb-2">നിലവിലെ അവധികൾ</div>
      <div id="hList" class="space-y-2"></div>`;
    c.querySelector('#hAdd').onclick = async ()=>{
      const date=c.querySelector('#hDate').value, shift=c.querySelector('#hShift').value, reason=c.querySelector('#hReason').value;
      if(!date||!reason){ toast('തീയതിയും കാരണവും നൽകുക', false); return; }
      const arr = state.data.holidays || [];
      arr.push({date,shift,reason});
      await db.ref('holidays').set(arr);
      toast('അവധി പ്രഖ്യാപിച്ചു'); paint();
    };
    const list = c.querySelector('#hList');
    (state.data.holidays||[]).forEach((h,i)=>{
      const row = el('div','arch-card bg-white border border-deep/10 p-3 flex items-center gap-3');
      row.innerHTML = `<div class="flex-1"><div class="font-medium text-sm">${h.date} ${h.shift!=='all'?'· ഷിഫ്റ്റ് '+h.shift:'· എല്ലാ ഷിഫ്റ്റും'}</div><div class="text-[11px] text-deep/40">${h.reason}</div></div>
        <button class="text-rose text-xs delH">നീക്കം</button>`;
      row.querySelector('.delH').onclick = async ()=>{ const arr=[...(state.data.holidays||[])]; arr.splice(i,1); await db.ref('holidays').set(arr); toast('നീക്കം ചെയ്തു'); paint(); };
      list.appendChild(row);
    });
    return c;
  }

  /* ---------- 7. Announcements ---------- */
  function sAnnounce(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">📢 പൊതു അറിയിപ്പുകൾ</div>
      <input id="aTitle" placeholder="തലക്കെട്ട്" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-2"/>
      <textarea id="aBody" placeholder="വിവരം" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-2" rows="3"></textarea>
      <select id="aTarget" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-2">
        <option value="all">എല്ലാവർക്കും</option><option value="1">ഷിഫ്റ്റ് 1</option><option value="2">ഷിഫ്റ്റ് 2</option><option value="3">ഷിഫ്റ്റ് 3</option>
      </select>
      <input id="aMedia" type="file" accept="image/*,video/*,audio/*" class="w-full text-xs mb-3"/>
      <button id="aSend" class="w-full bg-deep text-white rounded-lg py-2.5 font-medium mb-5">അയക്കുക</button>
      <div class="text-sm font-medium text-deep/70 mb-2">മുൻപ് അയച്ചവ</div>
      <div id="aList" class="space-y-2"></div>`;
    c.querySelector('#aSend').onclick = async ()=>{
      const title=c.querySelector('#aTitle').value, bodyTxt=c.querySelector('#aBody').value, target=c.querySelector('#aTarget').value;
      if(!title||!bodyTxt){ toast('തലക്കെട്ടും വിവരവും നൽകുക', false); return; }
      let media=null; const f=c.querySelector('#aMedia').files[0]; if(f) media=await fileToBase64(f);
      const arr = state.data.announcements || [];
      arr.unshift({id:Date.now(), title, body:bodyTxt, target, media, timestamp:Date.now()});
      await db.ref('announcements').set(arr);
      toast('അറിയിപ്പ് അയച്ചു'); paint();
    };
    const list = c.querySelector('#aList');
    (state.data.announcements||[]).slice(0,15).forEach(a=>{
      const row = el('div','arch-card bg-white border border-deep/10 p-3');
      row.innerHTML = `<div class="font-medium text-sm">${a.title}</div><div class="text-[11px] text-deep/50 mt-1">${a.body}</div><div class="text-[10px] text-deep/30 mt-1">${new Date(a.timestamp).toLocaleString('ml-IN')}</div>`;
      list.appendChild(row);
    });
    return c;
  }

  /* ---------- 8. Student editor ---------- */
  function sStudents(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">📚 കുട്ടികളുടെ വിവരങ്ങൾ</div>
      <select id="clsSel" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-4">${classList.map(cl=>`<option value="${cl}">${CLASS_LABEL[cl]}-ാം ക്ലാസ്</option>`).join('')}</select>
      <div id="stuList" class="space-y-2"></div>`;
    function loadList(){
      const cls = c.querySelector('#clsSel').value;
      const list = c.querySelector('#stuList'); list.innerHTML='';
      studentsByClass(cls).forEach(s=>{
        const row = el('div','arch-card bg-white border border-deep/10 p-3 flex items-center gap-3');
        row.innerHTML = `<div class="flex-1"><div class="font-medium text-sm">${s.name}</div><div class="text-[11px] text-deep/40">${s.father||''} · ${s.phone||''} · Reg ${s.reg}</div></div>
          <button class="text-deep text-xs editBtn border-2 border-deep/15 rounded-lg px-2 py-1">തിരുത്തുക</button>`;
        row.querySelector('.editBtn').onclick = ()=>editStudent(s);
        list.appendChild(row);
      });
    }
    c.querySelector('#clsSel').onchange = loadList; setTimeout(loadList,0);
    function editStudent(s){
      const m = Modal('കുട്ടിയുടെ വിവരം തിരുത്തുക');
      m.body.innerHTML = `
        <input id="eName" value="${s.name||''}" placeholder="പേര്" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-2"/>
        <input id="eFather" value="${s.father||''}" placeholder="രക്ഷിതാവ്" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-2"/>
        <input id="ePhone" value="${s.phone||''}" placeholder="ഫോൺ" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-3"/>
        <div class="flex gap-2">
          <button id="eSave" class="flex-1 bg-deep text-white rounded-lg py-2.5 font-medium">സേവ്</button>
          <button id="eDel" class="flex-1 bg-rose text-white rounded-lg py-2.5 font-medium">നീക്കം</button>
        </div>`;
      m.body.querySelector('#eSave').onclick = async ()=>{
        await db.ref('students/'+s.reg).update({name:m.body.querySelector('#eName').value, father:m.body.querySelector('#eFather').value, phone:m.body.querySelector('#ePhone').value});
        toast('സേവ് ചെയ്തു'); m.close(); paint();
      };
      m.body.querySelector('#eDel').onclick = async ()=>{ if(confirm('നീക്കം ചെയ്യണോ?')){ await db.ref('students/'+s.reg+'/deleted').set(true); toast('നീക്കം ചെയ്തു'); m.close(); paint(); } };
    }
    return c;
  }

  /* ---------- 9. Fee counter by class ---------- */
  function sFeeCounter(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">🧾 ഫീസ് കൗണ്ടർ</div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <select id="clsSel" class="border-2 border-deep/15 rounded-lg px-3 py-2 text-sm">${classList.map(cl=>`<option value="${cl}">${CLASS_LABEL[cl]}-ാം ക്ലാസ്</option>`).join('')}</select>
        <select id="moSel" class="border-2 border-deep/15 rounded-lg px-3 py-2 text-sm">${MONTHS.map(m=>`<option value="${m}">${m}</option>`).join('')}</select>
      </div>
      <div id="feeList" class="space-y-2"></div>`;
    function loadList(){
      const cls = c.querySelector('#clsSel').value, mo = c.querySelector('#moSel').value;
      const list = c.querySelector('#feeList'); list.innerHTML='';
      studentsByClass(cls).forEach(s=>{
        const key = `${s.reg}_${mo}`;
        const paid = !!state.data.fees?.[key];
        const row = el('div','arch-card bg-white border border-deep/10 p-3 flex items-center gap-3');
        row.innerHTML = `<div class="flex-1"><div class="font-medium text-sm">${s.name}</div><div class="text-[11px] text-deep/40">Reg ${s.reg}</div></div>
          <button class="toggleBtn pill px-3 py-1.5 text-xs border-2 ${paid?'bg-deep2 text-white border-deep2':'border-deep/15 text-deep/60'}">${paid?'അടച്ചു':'അടക്കാനുണ്ട്'}</button>
          ${paid?'<a target="_blank" class="text-lg waBtn">💬</a>':''}`;
        row.querySelector('.toggleBtn').onclick = async ()=>{ await db.ref(`fees/${key}`).set(!paid); toast('അപ്ഡേറ്റ് ചെയ്തു'); loadList(); };
        const wa = row.querySelector('.waBtn');
        if(wa){ const fee = state.data.feeQR?.monthlyFee||''; wa.href = waLink(s.phone, `അസ്സലാമു അലൈക്കും ${s.father||''} രക്ഷിതാവേ, ${s.name} (Reg: ${s.reg}) ${mo} മാസത്തെ മദ്റസ ഫീസ് അടച്ചു. തുക: ₹${fee}. - മമ്പഉൽ ഉലൂം മദ്റസ കൊറക്കോട്`); }
        list.appendChild(row);
      });
    }
    c.querySelector('#clsSel').onchange = loadList; c.querySelector('#moSel').onchange = loadList; setTimeout(loadList,0);
    return c;
  }

  /* ---------- 10. Backup & profile ---------- */
  function sBackup(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">📋 ബാക്കപ്പ് & പരാതികൾ</div>
      <button id="dlBtn" class="w-full bg-deep text-white rounded-lg py-2.5 font-medium mb-5">⬇️ JSON ബാക്കപ്പ് ഡൗൺലോഡ്</button>
      <div class="text-sm font-medium text-deep/70 mb-2">എല്ലാ പരാതികളും</div>
      <div id="compList" class="space-y-2"></div>`;
    c.querySelector('#dlBtn').onclick = ()=>{
      const blob = new Blob([JSON.stringify(state.data,null,2)], {type:'application/json'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `madrasa-backup-${todayISO()}.json`; a.click();
    };
    const list = c.querySelector('#compList');
    (state.data.complaints||[]).forEach(cp=>{
      const stu = state.data.students?.[cp.reg];
      const row = el('div','arch-card bg-white border border-deep/10 p-3');
      row.innerHTML = `<div class="font-medium text-sm">${stu?stu.name:cp.reg}</div><div class="text-[11px] text-deep/50 mt-1">${cp.complaint}</div><div class="text-[10px] text-deep/30">${cp.date||''}</div>`;
      list.appendChild(row);
    });
    if(!(state.data.complaints||[]).length) list.innerHTML = `<div class="text-center text-deep/40 text-sm py-6">പരാതികളൊന്നുമില്ല</div>`;
    return c;
  }

  paint();
  return wrap;
}

/* generic modal helper */
function Modal(title){
  const overlay = el('div','fixed inset-0 modal-bg z-[200] flex items-end sm:items-center justify-center');
  const box = el('div','bg-cream w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto');
  box.innerHTML = `<div class="flex items-center justify-between mb-4"><div class="font-display text-lg text-deep">${title}</div><button id="closeModal" class="text-deep/50 text-xl leading-none">×</button></div>`;
  const body = el('div'); box.appendChild(body);
  overlay.appendChild(box); document.body.appendChild(overlay);
  const close = ()=> overlay.remove();
  box.querySelector('#closeModal').onclick = close;
  overlay.onclick = (e)=>{ if(e.target===overlay) close(); };
  return {body, close};
}

/* ============================================================
   TEACHER PANEL
   ============================================================ */
function TeacherPanel(){
  const wrap = el('div','flex-1 flex flex-col min-h-screen');
  const content = el('div','flex-1 overflow-y-auto');
  wrap.appendChild(Header('അധ്യാപക പാനൽ', state.user?.name||'', 'അധ്യാപകൻ'));
  wrap.appendChild(content);
  const items = [
    {key:'classes', icon:'📋', label:'ക്ലാസുകൾ'},
    {key:'attendance', icon:'✅', label:'ഹാജർ'},
    {key:'fee', icon:'💰', label:'ഫീസ്'},
    {key:'complaint', icon:'📝', label:'പരാതി'},
    {key:'marks', icon:'📊', label:'മാർക്ക്'},
  ];
  let active='classes';
  const navHolder = el('div'); wrap.appendChild(navHolder);
  function sel(k){ active=k; paint(); }
  window.__panelRefresh = paint;
  const myClasses = state.user?.classes || [];

  function isHolidayToday(){
    const myShift = myClasses.length ? CLASS_SHIFT[myClasses[0]] : null;
    return (state.data.holidays||[]).find(h=> h.date===todayISO() && (h.shift==='all' || String(h.shift)===String(myShift)));
  }

  function paint(){
    content.innerHTML=''; navHolder.innerHTML=''; navHolder.appendChild(NavBar(items, active, sel));
    const hol = isHolidayToday();
    if(hol){
      const banner = el('div','m-4 arch-card bg-rose text-white p-5 text-center font-display text-lg');
      banner.textContent = `ഇന്ന് അവധിയാണ്! കാരണം: ${hol.reason}`;
      content.appendChild(banner);
      return;
    }
    const map = {classes:tClasses, attendance:tAttendance, fee:tFee, complaint:tComplaint, marks:tMarks};
    content.appendChild(map[active]());
  }

  function tClasses(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">📋 അനുവദിച്ച ക്ലാസുകൾ</div>`;
    if(!myClasses.length) c.innerHTML += `<div class="text-deep/40 text-sm text-center py-8">ക്ലാസുകൾ അനുവദിച്ചിട്ടില്ല</div>`;
    myClasses.forEach(cls=>{
      const box = el('div','arch-card bg-white border border-deep/10 p-4 mb-3');
      box.innerHTML = `<div class="font-medium text-deep mb-2">${CLASS_LABEL[cls]}-ാം ക്ലാസ്</div>`;
      const ul = el('div','space-y-1');
      studentsByClass(cls).forEach(s=> ul.appendChild(el('div','text-sm text-deep/70 flex justify-between border-b border-deep/5 py-1', `<span>${s.name}</span><span class="text-deep/30 text-xs">Reg ${s.reg}</span>`)));
      box.appendChild(ul); c.appendChild(box);
    });
    return c;
  }

  function tAttendance(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">✅ ഹാജർ രേഖപ്പെടുത്തൽ</div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <select id="clsSel" class="border-2 border-deep/15 rounded-lg px-3 py-2 text-sm">${myClasses.map(cl=>`<option value="${cl}">${CLASS_LABEL[cl]}-ാം ക്ലാസ്</option>`).join('')}</select>
        <input id="dateSel" type="date" value="${todayISO()}" class="border-2 border-deep/15 rounded-lg px-3 py-2 text-sm"/>
      </div>
      <div id="attList" class="space-y-2 mb-3"></div>
      <button id="submitAtt" class="w-full bg-deep text-white rounded-lg py-2.5 font-medium">ഹാജർ സബ്മിറ്റ് ചെയ്യുക</button>`;
    function loadList(){
      const cls = c.querySelector('#clsSel')?.value || myClasses[0], date = c.querySelector('#dateSel').value;
      const list = c.querySelector('#attList'); list.innerHTML='';
      studentsByClass(cls).forEach(s=>{
        const key=`${date}_${s.reg}`; const cur = state.data.attendance?.[key];
        const row = el('div','arch-card bg-white border border-deep/10 p-3 flex items-center gap-3');
        row.innerHTML = `<div class="flex-1"><div class="font-medium text-sm">${s.name}</div><div class="text-[11px] text-deep/40">Reg ${s.reg}</div></div>
          <button class="pBtn pill px-3 py-1.5 text-xs border-2 ${cur==='present'?'bg-deep2 text-white border-deep2':'border-deep/15 text-deep/60'}">ഹാജർ</button>
          <button class="aBtn pill px-3 py-1.5 text-xs border-2 ${cur==='absent'?'bg-rose text-white border-rose':'border-deep/15 text-deep/60'}">ഇല്ല</button>
          ${cur==='absent'?`<a target="_blank" class="text-lg waBtn">💬</a>`:''}`;
        row.querySelector('.pBtn').onclick = ()=>setStatus(date,s.reg,'present',row);
        row.querySelector('.aBtn').onclick = ()=>setStatus(date,s.reg,'absent',row);
        const wa = row.querySelector('.waBtn'); if(wa) wa.href = waLink(s.phone, `അസ്സലാമു അലൈക്കും ${s.father||''} രക്ഷിതാവേ, ${date} തീയതിയിൽ ${s.name} (Reg: ${s.reg}) ഹാജരില്ല. ദയവായി ശ്രദ്ധിക്കുക. - ${state.user.name}, മമ്പഉൽ ഉലൂം മദ്റസ കൊറക്കോട്`);
        list.appendChild(row);
      });
    }
    async function setStatus(date,reg,status,row){ await db.ref('attendance/'+`${date}_${reg}`).set(status); loadList(); }
    c.querySelector('#clsSel')?.addEventListener('change', loadList);
    c.querySelector('#dateSel').onchange = loadList;
    c.querySelector('#submitAtt').onclick = async ()=>{
      const date = c.querySelector('#dateSel').value;
      await db.ref('staffAttendance/'+`${date}_${state.user.username}`).set('present');
      toast('ഹാജർ സബ്മിറ്റ് ചെയ്തു — നിങ്ങൾ Present ആയി'); loadList();
    };
    setTimeout(loadList,0);
    return c;
  }

  function tFee(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">💰 ഫീസ് അപ്ഡേറ്റ്</div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <select id="clsSel" class="border-2 border-deep/15 rounded-lg px-3 py-2 text-sm">${myClasses.map(cl=>`<option value="${cl}">${CLASS_LABEL[cl]}-ാം ക്ലാസ്</option>`).join('')}</select>
        <select id="moSel" class="border-2 border-deep/15 rounded-lg px-3 py-2 text-sm">${MONTHS.map(m=>`<option value="${m}">${m}</option>`).join('')}</select>
      </div>
      <div id="feeList" class="space-y-2"></div>`;
    function loadList(){
      const cls=c.querySelector('#clsSel').value, mo=c.querySelector('#moSel').value;
      const list = c.querySelector('#feeList'); list.innerHTML='';
      studentsByClass(cls).forEach(s=>{
        const key=`${s.reg}_${mo}`; const paid = !!state.data.fees?.[key];
        const row = el('div','arch-card bg-white border border-deep/10 p-3 flex items-center gap-3');
        row.innerHTML = `<div class="flex-1"><div class="font-medium text-sm">${s.name}</div><div class="text-[11px] text-deep/40">Reg ${s.reg}</div></div>
          <button class="toggleBtn pill px-3 py-1.5 text-xs border-2 ${paid?'bg-deep2 text-white border-deep2':'border-deep/15 text-deep/60'}">${paid?'അടച്ചു':'അടക്കാനുണ്ട്'}</button>
          <a target="_blank" class="text-lg waBtn">💬</a>`;
        row.querySelector('.toggleBtn').onclick = async ()=>{ await db.ref(`fees/${key}`).set(!paid); loadList(); };
        const fee = state.data.feeQR?.monthlyFee||'';
        row.querySelector('.waBtn').href = waLink(s.phone, `അസ്സലാമു അലൈക്കും ${s.father||''} രക്ഷിതാവേ, ${s.name} (Reg: ${s.reg}) ${mo} മാസത്തെ മദ്റസ ഫീസ് അടച്ചു. തുക: ₹${fee}. - ${state.user.name}, മമ്പഉൽ ഉലൂം മദ്റസ കൊറക്കോട്`);
        list.appendChild(row);
      });
    }
    c.querySelector('#clsSel').onchange = loadList; c.querySelector('#moSel').onchange = loadList; setTimeout(loadList,0);
    return c;
  }

  function tComplaint(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">📝 പരാതി / നിർദ്ദേശം</div><div id="cList" class="space-y-2"></div>`;
    const list = c.querySelector('#cList');
    const myComplaints = (state.data.complaints||[]).filter(cp=> myClasses.includes(state.data.students?.[cp.reg]?.cls));
    if(!myComplaints.length) list.innerHTML = `<div class="text-center text-deep/40 text-sm py-8">പരാതികളൊന്നുമില്ല</div>`;
    myComplaints.forEach(cp=>{
      const stu = state.data.students?.[cp.reg];
      const row = el('div','arch-card bg-white border border-deep/10 p-3');
      row.innerHTML = `<div class="font-medium text-sm">${stu?.name||cp.reg}</div><div class="text-[11px] text-deep/60 mt-1">${cp.complaint}</div>
        <a target="_blank" class="text-xs text-deep underline mt-2 inline-block">💬 രക്ഷിതാവിന് മറുപടി അയക്കുക</a>`;
      row.querySelector('a').href = waLink(stu?.phone, `അസ്സലാമു അലൈക്കും, നിങ്ങളുടെ പരാതിക്ക് മറുപടി: ... - ${state.user.name}`);
      list.appendChild(row);
    });
    return c;
  }

  function tMarks(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">📊 മാർക്ക് രേഖപ്പെടുത്തൽ</div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <select id="clsSel" class="border-2 border-deep/15 rounded-lg px-3 py-2 text-sm">${myClasses.map(cl=>`<option value="${cl}">${CLASS_LABEL[cl]}-ാം ക്ലാസ്</option>`).join('')}</select>
        <select id="examSel" class="border-2 border-deep/15 rounded-lg px-3 py-2 text-sm">${EXAM_TYPES.map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <input id="subjInput" placeholder="വിഷയം" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-3"/>
      <div id="markList" class="space-y-2 mb-3"></div>
      <button id="saveMarks" class="w-full bg-deep text-white rounded-lg py-2.5 font-medium">മാർക്ക് സേവ് ചെയ്യുക</button>`;
    function loadList(){
      const cls=c.querySelector('#clsSel').value;
      const list = c.querySelector('#markList'); list.innerHTML='';
      studentsByClass(cls).forEach(s=>{
        const row = el('div','flex items-center gap-3');
        row.innerHTML = `<div class="flex-1 text-sm">${s.name}</div><input type="number" data-reg="${s.reg}" class="markInput w-20 border-2 border-deep/15 rounded-lg px-2 py-1.5 text-sm"/>`;
        list.appendChild(row);
      });
    }
    c.querySelector('#clsSel').onchange = loadList; setTimeout(loadList,0);
    c.querySelector('#saveMarks').onclick = async ()=>{
      const cls=c.querySelector('#clsSel').value, exam=c.querySelector('#examSel').value, subject=c.querySelector('#subjInput').value;
      if(!subject){ toast('വിഷയം നൽകുക', false); return; }
      const inputs = [...c.querySelectorAll('.markInput')];
      for(const inp of inputs){
        if(inp.value==='') continue;
        const reg = inp.dataset.reg;
        const arr = state.data.marks?.[reg] || [];
        arr.push({subject, marks:Number(inp.value), examType:exam, teacher:state.user.name, date:todayISO()});
        await db.ref('marks/'+reg).set(arr);
      }
      toast('മാർക്ക് സേവ് ചെയ്തു');
    };
    return c;
  }

  paint();
  return wrap;
}

/* ============================================================
   MANAGEMENT PANEL (view only)
   ============================================================ */
function ManagementPanel(){
  const wrap = el('div','flex-1 flex flex-col min-h-screen');
  const content = el('div','flex-1 overflow-y-auto');
  wrap.appendChild(Header('മാനേജ്മെന്റ് പാനൽ','View Only','മാനേജ്മെന്റ്'));
  wrap.appendChild(content);
  const items = [
    {key:'dash', icon:'📊', label:'ഡാഷ്ബോർഡ്'},
    {key:'staffatt', icon:'👨‍🏫', label:'സ്റ്റാഫ്'},
    {key:'defaulters', icon:'📋', label:'കുടിശ്ശിക'},
    {key:'feereport', icon:'💰', label:'ഫീസ്'},
    {key:'attsummary', icon:'📈', label:'ഹാജർ'},
  ];
  let active='dash';
  const navHolder = el('div'); wrap.appendChild(navHolder);
  function sel(k){ active=k; paint(); }
  window.__panelRefresh = paint;

  function paint(){
    content.innerHTML=''; navHolder.innerHTML=''; navHolder.appendChild(NavBar(items, active, sel));
    const map = {dash:mDash, staffatt:mStaffAtt, defaulters:mDefaulters, feereport:mFeeReport, attsummary:mAttSummary};
    content.appendChild(map[active]());
  }

  function mDash(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    const totalStudents = Object.values(state.data.students||{}).filter(s=>!s.deleted).length;
    const teachers = staffList().filter(s=>s.role==='teacher').length;
    const mgmt = staffList().filter(s=>s.role==='management').length;
    const todayPresent = Object.entries(state.data.attendance||{}).filter(([k,v])=>k.startsWith(todayISO())&&v==='present').length;
    const todayAbsent = Object.entries(state.data.attendance||{}).filter(([k,v])=>k.startsWith(todayISO())&&v==='absent').length;
    const feesCollected = Object.values(state.data.fees||{}).filter(Boolean).length;
    c.innerHTML = `
      <div class="font-display text-xl text-deep mb-4">📊 നിരീക്ഷണ ഡാഷ്ബോർഡ്</div>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div class="arch-card bg-deep text-white p-4 text-center"><div class="text-2xl font-display">${totalStudents}</div><div class="text-[11px] text-gold">ആകെ കുട്ടികൾ</div></div>
        <div class="arch-card bg-deep2 text-white p-4 text-center"><div class="text-2xl font-display">${teachers}</div><div class="text-[11px] text-gold">അധ്യാപകർ</div></div>
        <div class="arch-card bg-gold text-deep p-4 text-center"><div class="text-2xl font-display">${mgmt}</div><div class="text-[11px]">മാനേജ്മെന്റ്</div></div>
        <div class="arch-card bg-white border border-deep/10 p-4 text-center"><div class="text-2xl font-display text-deep">${feesCollected}</div><div class="text-[11px] text-deep/50">ഫീസ് രേഖകൾ</div></div>
      </div>
      <div class="arch-card bg-white border border-deep/10 p-4">
        <div class="font-medium text-sm text-deep mb-2">ഇന്നത്തെ ഹാജർ</div>
        <div class="flex gap-4 text-sm"><span class="text-deep2 font-medium">✓ ${todayPresent} ഹാജർ</span><span class="text-rose font-medium">✕ ${todayAbsent} ഇല്ല</span></div>
      </div>`;
    return c;
  }

  function mStaffAtt(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">👨‍🏫 സ്റ്റാഫ് ഹാജർ ട്രാക്കർ</div><div id="list" class="space-y-2"></div>`;
    const list = c.querySelector('#list');
    staffList().filter(s=>s.role==='teacher').forEach(s=>{
      const key = `${todayISO()}_${s.username}`;
      const status = state.data.staffAttendance?.[key] || 'അറിയിച്ചിട്ടില്ല';
      const row = el('div','arch-card bg-white border border-deep/10 p-3 flex items-center gap-3');
      row.innerHTML = `<div class="w-10 h-10 rounded-full bg-deep/10 overflow-hidden flex items-center justify-center text-deep/40">${s.photo?`<img src="${s.photo}" class="w-full h-full object-cover"/>`:'👤'}</div>
        <div class="flex-1"><div class="font-medium text-sm">${s.name}</div><div class="text-[11px] text-deep/40">${(s.classes||[]).map(c=>CLASS_LABEL[c]).join(', ')}</div></div>
        <span class="pill px-3 py-1 text-xs ${status==='present'?'bg-deep2 text-white':status==='absent'?'bg-rose text-white':'bg-deep/10 text-deep/50'}">${status==='present'?'ഹാജർ':status==='absent'?'ഇല്ല':status}</span>`;
      list.appendChild(row);
    });
    return c;
  }

  function mDefaulters(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">📋 കുടിശ്ശികക്കാർ</div>
      <select id="moSel" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-4">${MONTHS.map(m=>`<option value="${m}">${m}</option>`).join('')}</select>
      <div id="list" class="space-y-2"></div>`;
    function load(){
      const mo = c.querySelector('#moSel').value;
      const list = c.querySelector('#list'); list.innerHTML='';
      const defaulters = Object.entries(state.data.students||{}).filter(([reg,s])=>!s.deleted && !state.data.fees?.[`${reg}_${mo}`]);
      if(!defaulters.length){ list.innerHTML = `<div class="text-center text-deep/40 text-sm py-6">കുടിശ്ശികയില്ല 🎉</div>`; return; }
      defaulters.forEach(([reg,s])=>{
        const row = el('div','arch-card bg-white border border-rose/30 p-3 flex items-center gap-3');
        row.innerHTML = `<div class="flex-1"><div class="font-medium text-sm">${s.name}</div><div class="text-[11px] text-deep/40">${CLASS_LABEL[s.cls]}-ാം ക്ലാസ് · Reg ${reg}</div></div>
          <a target="_blank" class="text-lg">💬</a>`;
        row.querySelector('a').href = waLink(s.phone, `അസ്സലാമു അലൈക്കും ${s.father||''} രക്ഷിതാവേ, ${s.name} (Reg: ${reg}) ന്റെ മദ്റസ ഫീസ് കുടിശ്ശികയുണ്ട്. ദയവായി അടക്കുക. - മമ്പഉൽ ഉലൂം മദ്റസ കൊറക്കോട്`);
        list.appendChild(row);
      });
    }
    c.querySelector('#moSel').onchange = load; setTimeout(load,0);
    return c;
  }

  function mFeeReport(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">💰 മാസ ഫീസ് റിപ്പോർട്ട്</div>
      <select id="moSel" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-4">${MONTHS.map(m=>`<option value="${m}">${m}</option>`).join('')}</select>
      <div id="list" class="space-y-2"></div>`;
    function load(){
      const mo = c.querySelector('#moSel').value;
      const list = c.querySelector('#list'); list.innerHTML='';
      classList.forEach(cls=>{
        const stu = studentsByClass(cls);
        const paid = stu.filter(s=>state.data.fees?.[`${s.reg}_${mo}`]).length;
        const row = el('div','arch-card bg-white border border-deep/10 p-3 flex items-center justify-between');
        row.innerHTML = `<div class="text-sm font-medium">${CLASS_LABEL[cls]}-ാം ക്ലാസ്</div><div class="text-sm"><span class="text-deep2 font-medium">${paid}</span> / ${stu.length} അടച്ചു</div>`;
        list.appendChild(row);
      });
    }
    c.querySelector('#moSel').onchange = load; setTimeout(load,0);
    return c;
  }

  function mAttSummary(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">📈 മാസ ഹാജർ സംഗ്രഹം</div>
      <select id="shiftSel" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-4">
        <option value="all">എല്ലാ ഷിഫ്റ്റും</option><option value="1">ഷിഫ്റ്റ് 1</option><option value="2">ഷിഫ്റ്റ് 2</option><option value="3">ഷിഫ്റ്റ് 3</option>
      </select>
      <div id="bars" class="space-y-2"></div>`;
    function load(){
      const shift = c.querySelector('#shiftSel').value;
      const counts = {}; // by date
      Object.entries(state.data.attendance||{}).forEach(([key,status])=>{
        const [date,reg] = key.split('_');
        if(!date.startsWith(new Date().toISOString().slice(0,7))) return;
        const stu = state.data.students?.[reg]; if(!stu) return;
        if(shift!=='all' && String(CLASS_SHIFT[stu.cls])!==shift) return;
        counts[date] = counts[date] || {p:0,a:0};
        if(status==='present') counts[date].p++; else counts[date].a++;
      });
      const bars = c.querySelector('#bars'); bars.innerHTML='';
      const days = Object.keys(counts).sort();
      if(!days.length){ bars.innerHTML = `<div class="text-center text-deep/40 text-sm py-6">ഈ മാസം ഹാജർ വിവരം ലഭ്യമല്ല</div>`; return; }
      const max = Math.max(...days.map(d=>counts[d].p+counts[d].a),1);
      days.forEach(d=>{
        const {p,a} = counts[d];
        const row = el('div','flex items-center gap-2 text-xs');
        row.innerHTML = `<div class="w-16 text-deep/50">${d.slice(8)}/${d.slice(5,7)}</div>
          <div class="flex-1 h-4 bg-deep/10 rounded-full overflow-hidden flex">
            <div style="width:${(p/max)*100}%" class="bg-deep2"></div>
            <div style="width:${(a/max)*100}%" class="bg-rose"></div>
          </div><div class="w-14 text-right text-deep/50">${p}P/${a}A</div>`;
        bars.appendChild(row);
      });
    }
    c.querySelector('#shiftSel').onchange = load; setTimeout(load,0);
    return c;
  }

  paint();
  return wrap;
}

/* ============================================================
   PARENT PANEL
   ============================================================ */
function ParentPanel(){
  const wrap = el('div','flex-1 flex flex-col min-h-screen');
  const content = el('div','flex-1 overflow-y-auto');
  const child = state.data.students?.[state.user.reg] || state.user;
  wrap.appendChild(Header('രക്ഷിതാവ് പാനൽ', child?.name||'', 'രക്ഷിതാവ്'));
  wrap.appendChild(content);
  const items = [
    {key:'home', icon:'📢', label:'അറിയിപ്പ്'},
    {key:'info', icon:'📋', label:'വിവരങ്ങൾ'},
    {key:'fees', icon:'💰', label:'ഫീസ്'},
    {key:'exam', icon:'📅', label:'പരീക്ഷ'},
    {key:'complaint', icon:'📝', label:'അഭിപ്രായം'},
  ];
  let active='home';
  const navHolder = el('div'); wrap.appendChild(navHolder);
  function sel(k){ active=k; paint(); }
  window.__panelRefresh = paint;

  // popup latest announcement once
  let shownPopup = sessionStorage.getItem('mu_announce_shown');

  function paint(){
    content.innerHTML=''; navHolder.innerHTML=''; navHolder.appendChild(NavBar(items, active, sel));
    const map = {home:pHome, info:pInfo, fees:pFees, exam:pExam, complaint:pComplaint};
    content.appendChild(map[active]());
    maybePopup();
  }

  function maybePopup(){
    if(shownPopup) return;
    const latest = (state.data.announcements||[])[0];
    if(!latest) return;
    shownPopup='1'; sessionStorage.setItem('mu_announce_shown','1');
    const m = Modal('📢 '+latest.title);
    m.body.innerHTML = `<p class="text-sm text-deep/70">${latest.body}</p>${latest.media?`<div class="mt-3">${latest.media.startsWith('data:image')?`<img src="${latest.media}" class="rounded-lg w-full"/>`:latest.media.startsWith('data:video')?`<video src="${latest.media}" controls class="rounded-lg w-full"></video>`:`<audio src="${latest.media}" controls class="w-full"></audio>`}</div>`:''}`;
  }

  function pHome(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">📢 തത്സമയ അറിയിപ്പുകൾ</div><div id="list" class="space-y-2"></div>`;
    const list = c.querySelector('#list');
    const myShift = CLASS_SHIFT[child?.cls];
    const relevant = (state.data.announcements||[]).filter(a=>a.target==='all'||String(a.target)===String(myShift));
    if(!relevant.length) list.innerHTML = `<div class="text-center text-deep/40 text-sm py-8">പുതിയ അറിയിപ്പുകളില്ല</div>`;
    relevant.slice(0,20).forEach(a=>{
      const row = el('div','arch-card bg-white border border-deep/10 p-3');
      row.innerHTML = `<div class="font-medium text-sm">${a.title}</div><div class="text-[12px] text-deep/60 mt-1">${a.body}</div><div class="text-[10px] text-deep/30 mt-1">${new Date(a.timestamp).toLocaleString('ml-IN')}</div>`;
      list.appendChild(row);
    });
    return c;
  }

  function pInfo(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">📋 കുട്ടിയുടെ വിവരങ്ങൾ</div>
      <div class="arch-card bg-white border border-deep/10 p-4 mb-4 flex items-center gap-3">
        <div class="w-16 h-16 rounded-full bg-deep/10 overflow-hidden flex items-center justify-center text-deep/40 text-2xl">${child?.photo?`<img src="${child.photo}" class="w-full h-full object-cover"/>`:'👤'}</div>
        <div><div class="font-medium">${child?.name||''}</div><div class="text-xs text-deep/50">${CLASS_LABEL[child?.cls]}-ാം ക്ലാസ് · ഷിഫ്റ്റ് ${CLASS_SHIFT[child?.cls]}</div><div class="text-xs text-deep/40">Reg: ${state.user.reg}</div></div>
      </div>
      <input id="photoFile" type="file" accept="image/*" class="w-full text-xs mb-3"/>
      <label class="text-sm text-deep/70">രക്ഷിതാവിന്റെ പേര്</label>
      <input id="fatherInput" value="${child?.father||''}" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-2"/>
      <label class="text-sm text-deep/70">ഫോൺ നമ്പർ</label>
      <input id="phoneInput" value="${child?.phone||''}" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-3"/>
      <button id="saveBtn" class="w-full bg-deep text-white rounded-lg py-2.5 font-medium">സേവ് ചെയ്യുക</button>`;
    c.querySelector('#saveBtn').onclick = async ()=>{
      const update = { father: c.querySelector('#fatherInput').value, phone: c.querySelector('#phoneInput').value };
      const f = c.querySelector('#photoFile').files[0]; if(f) update.photo = await fileToBase64(f);
      await db.ref('students/'+state.user.reg).update(update);
      toast('സേവ് ചെയ്തു');
    };
    return c;
  }

  function pFees(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    const fq = state.data.feeQR || {};
    const months = MONTHS;
    const paidCount = months.filter(m=>state.data.fees?.[`${state.user.reg}_${m}`]).length;
    const total = (Number(fq.monthlyFee)||0) * 12;
    const paidAmt = (Number(fq.monthlyFee)||0) * paidCount;
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">💰 ഫീസ് വിവരങ്ങൾ</div>
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="arch-card bg-deep text-white p-3 text-center"><div class="text-lg font-display">₹${total}</div><div class="text-[10px] text-gold">ആകെ</div></div>
        <div class="arch-card bg-deep2 text-white p-3 text-center"><div class="text-lg font-display">₹${paidAmt}</div><div class="text-[10px] text-gold">അടച്ചത്</div></div>
        <div class="arch-card bg-rose text-white p-3 text-center"><div class="text-lg font-display">₹${total-paidAmt}</div><div class="text-[10px] text-gold">ബാക്കി</div></div>
      </div>
      <div class="grid grid-cols-4 gap-2 mb-5">
        ${months.map(m=>`<div class="text-center text-[10px] p-2 rounded-lg ${state.data.fees?.[`${state.user.reg}_${m}`]?'bg-deep2 text-white':'bg-deep/5 text-deep/40'}">${m}</div>`).join('')}
      </div>
      ${fq.qrBase64?`<div class="arch-card bg-white border border-deep/10 p-4 text-center"><img src="${fq.qrBase64}" class="w-40 h-40 object-contain mx-auto mb-2"/><div class="text-sm text-deep/60">Google Pay: ${fq.googlePay||''}</div></div>`:''}`;
    return c;
  }

  function pExam(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">📅 പരീക്ഷ & മാർക്ക്</div>
      <select id="examSel" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-4">${EXAM_TYPES.map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
      <div class="text-sm font-medium text-deep/70 mb-2">ടൈംടേബിൾ</div>
      <div id="ttList" class="space-y-2 mb-5"></div>
      <div class="text-sm font-medium text-deep/70 mb-2">മാർക്ക്</div>
      <div id="markList" class="space-y-2"></div>`;
    function load(){
      const exam = c.querySelector('#examSel').value;
      const tt = state.data.examTimetables?.[child?.cls]?.[exam] || [];
      const ttList = c.querySelector('#ttList'); ttList.innerHTML = tt.length ? tt.map(t=>`<div class="arch-card bg-white border border-deep/10 p-3 flex justify-between text-sm"><span>${t.subject}</span><span class="text-deep/50">${t.date} ${t.time}</span></div>`).join('') : `<div class="text-center text-deep/40 text-sm py-4">ടൈംടേബിൾ ലഭ്യമല്ല</div>`;
      const marks = (state.data.marks?.[state.user.reg]||[]).filter(m=>m.examType===exam);
      const markList = c.querySelector('#markList'); markList.innerHTML = marks.length ? marks.map(m=>`<div class="arch-card bg-white border border-deep/10 p-3 flex justify-between text-sm"><span>${m.subject}</span><span class="font-medium text-deep">${m.marks}</span></div>`).join('') : `<div class="text-center text-deep/40 text-sm py-4">മാർക്ക് ലഭ്യമല്ല</div>`;
    }
    c.querySelector('#examSel').onchange = load; setTimeout(load,0);
    return c;
  }

  function pComplaint(){
    const c = el('div','px-5 py-5 max-w-md mx-auto');
    c.innerHTML = `<div class="font-display text-xl text-deep mb-4">📝 അഭിപ്രായ പെട്ടി</div>
      <textarea id="cBody" placeholder="നിങ്ങളുടെ അഭിപ്രായം / പരാതി എഴുതുക" rows="4" class="w-full border-2 border-deep/15 rounded-lg px-3 py-2 mb-3"></textarea>
      <button id="cSend" class="w-full bg-deep text-white rounded-lg py-2.5 font-medium mb-5">അയക്കുക</button>
      <div class="text-sm font-medium text-deep/70 mb-2">മുൻപ് അയച്ചവ</div>
      <div id="cList" class="space-y-2"></div>`;
    c.querySelector('#cSend').onclick = async ()=>{
      const txt = c.querySelector('#cBody').value.trim(); if(!txt) return;
      const arr = state.data.complaints || [];
      arr.unshift({id:Date.now(), reg:state.user.reg, complaint:txt, date:new Date().toLocaleDateString('ml-IN')});
      await db.ref('complaints').set(arr);
      toast('അയച്ചു'); paint();
    };
    const mine = (state.data.complaints||[]).filter(cp=>cp.reg===state.user.reg);
    const list = c.querySelector('#cList');
    if(!mine.length) list.innerHTML = `<div class="text-center text-deep/40 text-sm py-6">ഒന്നുമില്ല</div>`;
    mine.forEach(cp=> list.appendChild(el('div','arch-card bg-white border border-deep/10 p-3 text-sm', `${cp.complaint}<div class="text-[10px] text-deep/30 mt-1">${cp.date}</div>`)));
    return c;
  }

  paint();
  return wrap;
}

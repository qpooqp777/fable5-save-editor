// ═══════════════════════════════════════════════════════════════
// Fable 5 Save Editor v2 — Popup Script
// ═══════════════════════════════════════════════════════════════

const MAX_SLOTS = 8;
let saveData = null;
let slots = [];
let currentSlot = 0;

// ─── Sort state ───────────────────────────────────────────────
let invSort = 'default';
let invFilter = '';
let invCatFilter = '';

// ─── Data dictionaries ────────────────────────────────────────
const ITEM_CATS = {
  wpn:'⚔️武器', amr:'🛡️鎧甲', arm:'🛡️護甲', hlm:'🪖頭盔', shd:'🛡️盾牌',
  clk:'🧥披風', glv:'🧤手套', bot:'👢靴子', acc:'💍飾品', amu:'📿項鍊',
  blt:'🪢腰帶', rng:'💍戒指', bk:'📜卷軸', scroll:'📜卷軸', potion:'🧪藥水',
  panacea:'🧪萬靈藥', mat:'📦材料', item:'📦道具', quest:'📋任務', new:'❓新物'
};

const BUFF_NAMES = {
  haste:'⚡加速術', brave:'⚔️勇猛術', blue:'🔵藍藥', cautious:'🛡️謹慎術',
  elfcookie:'🍪精靈餅乾', poly:'🌀變身術', shield:'🛡️護盾術', taming:'🐾馴服',
  sk_resurrection:'✝️復活術', sk_charm:'💕魅惑術', sk_magic_shield:'🔮魔盾',
  sk_shield:'🛡️盾擊', sk_reveal:'👁️偵測', sk_ench_wpn:'✨附魔武器',
  sk_holy_wpn:'✝️聖武', sk_sunlight:'☀️陽光術', sk_load_up:'💪負重術',
  sk_shield2:'🛡️強盾', sk_haste_spell:'⚡加速咒', sk_summon:'🐾召喚',
  sk_greater_haste:'⚡強加速', sk_dex_up:'🏹敏增', sk_str_up:'💪力增',
  sk_holy_dash:'✝️聖衝', sk_bless_wpn:'✝️祝福武', sk_zombie:'💀殭屍',
  sk_fire_prison:'🔥火牢', sk_meditation:'🧘冥想', sk_holy_barrier:'✝️聖障',
  sk_berserk:'💢狂暴'
};

const STATUS_NAMES = {
  stun:'⚡暈眩', freeze:'❄️冰凍', stone:'🪨石化', poison:'☠️中毒',
  burn:'🔥燃燒', scald:'♨️燙傷', bleed:'🩸流血', sleep:'😴睡眠',
  silence:'🔇沉默', paralyze:'⚡麻痺', magicseal:'🔮魔封',
  armorBreak:'💔破甲', slowAtk:'🐢慢攻', cleave:'⚔️劈砍'
};

const DERIVED_DEFS = [
  {key:'meleeDmg',label:'近戰傷害'},{key:'meleeHit',label:'近戰命中'},
  {key:'meleeCrit',label:'近戰暴擊%'},{key:'meleeCritDmg',label:'近戰暴傷%'},
  {key:'rangedDmg',label:'遠程傷害'},{key:'rangedHit',label:'遠程命中'},
  {key:'rangedCrit',label:'遠程暴擊%'},{key:'rangedCritDmg',label:'遠程暴傷%'},
  {key:'magicDmg',label:'魔法傷害'},{key:'magicHit',label:'魔法命中'},
  {key:'magicCrit',label:'魔法暴擊%'},{key:'magicCritDmg',label:'魔法暴傷%'},
  {key:'extraDmg',label:'額外傷害'},{key:'extraHit',label:'額外命中'},
  {key:'extraMp',label:'額外MP'},{key:'mpReduce',label:'MP消耗減%'},
  {key:'ac',label:'護甲AC'},{key:'mr',label:'魔抗MR'},{key:'er',label:'躲閃ER%'},
  {key:'dr',label:'減傷DR%'},{key:'resFire',label:'火抗%'},
  {key:'resWater',label:'水抗%'},{key:'resEarth',label:'地抗%'},
  {key:'resWind',label:'風抗%'},{key:'magicDrNonEle',label:'非元素減傷%'},
  {key:'hpRegenMax',label:'HP最大回復'},{key:'hpR',label:'HP回復/回合'},
  {key:'mpR',label:'MP回復/回合'},{key:'aspd',label:'攻速ASPD'},
  {key:'spdMult',label:'速度倍率'},{key:'weightCur',label:'當前負重'},
  {key:'weightLimit',label:'最大負重'},{key:'immStone',label:'免疫石化',type:'bool'},
  {key:'immPoison',label:'免疫中毒',type:'bool'}
];

const EQ_SLOTS = [
  {key:'wpn',label:'⚔️ 武器'},{key:'helm',label:'🪖 頭盔'},{key:'armor',label:'🛡️ 鎧甲'},
  {key:'shield',label:'🛡️ 盾牌'},{key:'cloak',label:'🧥 披風'},{key:'tshirt',label:'👕 T卹'},
  {key:'gloves',label:'🧤 手套'},{key:'boots',label:'👢 靴子'},{key:'ring1',label:'💍 戒指1'},
  {key:'ring2',label:'💍 戒指2'},{key:'ring3',label:'💍 戒指3'},{key:'ring4',label:'💍 戒指4'},
  {key:'amulet',label:'📿 項鍊'},{key:'belt',label:'🪢 腰帶'},{key:'arrow',label:'🏹 箭矢'},
];

const SET_BONUSES = [
  {key:'_setRedLion5',label:'🦁 紅獅5件'},{key:'_setWhiteBird5',label:'🕊️ 白鳥5件'},
  {key:'_setIron3',label:'⚙️ 鐵3件'},{key:'_setIron5',label:'⚙️ 鐵5件'},
  {key:'_setBeauty5',label:'💎 美5件'},{key:'_setGale5',label:'🌪️ 疾風5件'},
  {key:'_setMoon5',label:'🌙 月5件'},{key:'_setApprentice5',label:'📖 學徒5件'},
  {key:'_setWitch5',label:'🧙 女巫5件'},{key:'_setShadow3',label:'🌑 暗影3件'},
  {key:'_setShadow5',label:'🌑 暗影5件'},
];

const AUTO_BUFF_KEYS = [
  {key:'setHaste',label:'加速術',buyKey:'setAutoBuyHaste'},
  {key:'setBrave',label:'勇猛術',buyKey:'setAutoBuyBrave'},
  {key:'setBlue',label:'藍藥',buyKey:'setAutoBuyBlue'},
  {key:'setCautious',label:'謹慎術',buyKey:'setAutoBuyCautious'},
  {key:'setElfcookie',label:'精靈餅乾',buyKey:'setAutoBuyElfcookie'},
  {key:'setPoly',label:'變身術',buyKey:'setAutoBuyPoly'},
  {key:'setMagicbarrier',label:'魔盾',buyKey:null},
  {key:'setTeleport',label:'傳送術',buyKey:'setAutoBuyTeleport'},
  {key:'setAutoBuyArrow',label:'自動買箭',buyKey:null},
];

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSlots(); renderSlots();
  if (slots.length > 0 && slots[currentSlot]) loadSlot(currentSlot);
  initTabs(); initActions(); initPresets(); initInvToolbar(); initDerivedGrid();
});

// ─── TABS ─────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
}

// ─── STORAGE ──────────────────────────────────────────────────
function loadSlots() { try { slots = JSON.parse(localStorage.getItem('f5_slots') || '[]'); } catch { slots = []; } }
function saveSlots() { localStorage.setItem('f5_slots', JSON.stringify(slots)); }
function loadSlot(i) {
  if (!slots[i]) return;
  saveData = JSON.parse(JSON.stringify(slots[i].data));
  currentSlot = i; renderSlots(); renderAll();
  showToast(`已載入存檔槽 ${i+1}`, 'success');
}
function extractMeta(d) { if (!d?.p) return ''; const p=d.p; return `${p.cls||'?'} Lv.${p.lv} | ${fmtNum(p.gold)}G | ${p.inv?.length||0}物`; }
function fmtNum(n) { if (n>=1e9) return (n/1e9).toFixed(1)+'B'; if (n>=1e6) return (n/1e6).toFixed(1)+'M'; if (n>=1e3) return (n/1e3).toFixed(1)+'K'; return n; }

// ─── SLOT RENDER ──────────────────────────────────────────────
function renderSlots() {
  const c = document.getElementById('slot-list'); c.innerHTML = '';
  for (let i = 0; i < MAX_SLOTS; i++) {
    const s = slots[i]; const card = document.createElement('div'); card.className = 'slot-card';
    if (s) {
      const date = new Date(s.updatedAt).toLocaleString('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
      card.innerHTML = `<div style="flex:1"><div class="slot-name">📦 存檔槽 ${i+1} ${i===currentSlot?'✅':''}</div><div class="slot-info">${s.meta||''}</div><div class="slot-meta">${date}</div></div><button class="btn btn-sm btn-secondary" data-action="load" data-idx="${i}">載入</button><button class="btn btn-sm btn-ghost" data-action="del" data-idx="${i}">🗑️</button>`;
    } else {
      card.innerHTML = `<div style="flex:1"><div class="slot-name" style="color:var(--text-muted)">📦 存檔槽 ${i+1} ${i===currentSlot?'✅':''}（空）</div></div>`;
    }
    c.appendChild(card);
  }
  c.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.idx);
      if (btn.dataset.action === 'load') loadSlot(i);
      if (btn.dataset.action === 'del' && slots[i]) { slots.splice(i,1); saveSlots(); renderSlots(); showToast('已刪除','success'); }
    });
  });
}

// ─── RENDER ALL ───────────────────────────────────────────────
function renderAll() {
  if (!saveData) return;
  const p = saveData.p, d = p.d;

  // Character
  setVal('f-cls', p.cls); setVal('f-name', p.name||''); setVal('f-avatar', p.avatar||'');
  setVal('f-lv', p.lv); setVal('f-exp', p.exp); setVal('f-gold', p.gold);
  setVal('f-hp', p.hp); setVal('f-mhp', p.mhp); setVal('f-mp', p.mp); setVal('f-mmp', p.mmp);
  setVal('f-dead', p.dead?'true':'false');

  // Poly
  if (p.poly) { setVal('f-poly-n', p.poly.n||''); setVal('f-poly-mgd', p.poly.mgd||0); setVal('f-poly-spd', p.poly.spd||0); setVal('f-poly-mpr', p.poly.mpr||0); setVal('f-poly-sp', p.poly.sp||0); }
  else { ['f-poly-n','f-poly-mgd','f-poly-spd','f-poly-mpr','f-poly-sp'].forEach(id=>setVal(id,'')); }

  // Blessings
  if (p.blessings) { setVal('f-bless-brave',p.blessings.brave||0); setVal('f-bless-support',p.blessings.support||0); setVal('f-bless-precise',p.blessings.precise||0); setVal('f-bless-blaze',p.blessings.blaze||0); }

  // Stats
  setVal('f-str',p.base.str); setVal('f-dex',p.base.dex); setVal('f-con',p.base.con);
  setVal('f-int',p.base.int); setVal('f-wis',p.base.wis); setVal('f-cha',p.base.cha);
  setVal('f-bonus',p.bonus);
  ['str','dex','con','int','wis','cha'].forEach(s => { setVal('f-alloc-'+s,p.alloc[s]); setVal('f-pan-'+s,p.panacea[s]); });
  setVal('f-pan-used',p.panaceaUsed);

  // Derived
  if (d) DERIVED_DEFS.forEach(({key,type}) => { const el=document.getElementById('f-d-'+key); if(el){ el.value = type==='bool'?(d[key]?'true':'false'):d[key]; }});

  // World
  const mc = p.lastMapByCat||{};
  setVal('f-map-village',mc.village||''); setVal('f-map-wild',mc.wild||''); setVal('f-map-dungeon',mc.dungeon||'');
  setVal('f-map-special',mc.special||''); setVal('f-map-tower',mc.tower||''); setVal('f-map-siege',mc.siege||'');
  setVal('f-map-castle',mc.castle||''); setVal('f-last-battle',p.lastBattleMap||'');

  setVal('f-siege-active',p.siege?.active?'true':'false'); setVal('f-siege-gate',p.siege?.gateKilled?'true':'false');
  setVal('f-siege-tower',p.siege?.towerKilled?'true':'false'); setVal('f-siege-gate-hp',p.siege?.gateHp||0);
  setVal('f-siege-tower-hp',p.siege?.towerHp||0); setVal('f-siege-kills',p.siege?.kills||0);
  setVal('f-siege-result',p.siege?.result||''); setVal('f-siege-city',p.siege?.city||'');
  setVal('f-siege-victory-city',p.siege?.victoryCity||'');

  setVal('f-blood-pledge',p.bloodPledge||''); setVal('f-sherine-world',p.sherineWorld?'true':'false');
  setVal('f-pride-beat',p.prideBeatJenis?'true':'false'); setVal('f-demon-temple',p.demonTempleOpen?'true':'false');
  setVal('f-flame-affinity',p.flameAffinity||0); setVal('f-trial-stage',p.trialStage||0);
  setVal('f-ismael-used',p.ismaelAccUsed?'true':'false');

  // Castle guard
  document.getElementById('castle-guard-info').textContent = p.castleGuard ? JSON.stringify(p.castleGuard) : '無資料';

  // Config
  if (p.config) {
    setVal('f-cfg-pot',p.config.setPot||''); setVal('f-cfg-pot-hp',p.config.setHpPot||70);
    setVal('f-cfg-auto-buy-pot',p.config.setAutoBuyPot?'true':'false');
    setVal('f-cfg-sel-atk',p.config.selAtkSkill||''); setVal('f-cfg-mp-atk',p.config.setMpAtk||50);
    setVal('f-cfg-sel-heal',p.config.selHealSkill||''); setVal('f-cfg-mp-heal',p.config.setMpHeal||50);
    setVal('f-cfg-sel-convert',p.config.selConvertSkill||''); setVal('f-cfg-hp-convert',p.config.setHpConvert||50);
  }
  if (p.pandoraMarket) { setVal('f-pandora-id',p.pandoraMarket.id||''); setVal('f-pandora-price',p.pandoraMarket.price||0); setVal('f-pandora-weight',p.pandoraMarket.weight||0); }

  // Summon
  if (p.summon) { setVal('f-summon-skid',p.summon.skId||''); setVal('f-summon-n',p.summon.n||''); setVal('f-summon-cd',p.summon.cd||0); }

  renderInventory(); renderEquipment(); renderSkills(); renderBuffs(); renderAllies();
  renderStatuses(); renderCds(); renderAutoBuffs(); renderSetBonuses(); renderJunkPrefs();
}

// ─── APPLY ALL FIELDS → saveData ──────────────────────────────
function applyAllFields() {
  if (!saveData) return;
  const p = saveData.p, d = p.d;
  p.cls=val('f-cls'); p.name=val('f-name')||null; p.avatar=val('f-avatar');
  p.lv=num('f-lv'); p.exp=num('f-exp'); p.gold=num('f-gold');
  p.hp=num('f-hp'); p.mhp=num('f-mhp'); p.mp=num('f-mp'); p.mmp=num('f-mmp');
  p.dead=bool('f-dead');

  if (val('f-poly-n')) { p.poly = p.poly||{}; p.poly.n=val('f-poly-n'); p.poly.mgd=num('f-poly-mgd'); p.poly.spd=num('f-poly-spd'); p.poly.mpr=num('f-poly-mpr'); p.poly.sp=num('f-poly-sp'); p.poly.c=p.poly.c||'text-yellow-400'; }
  if (p.blessings) { p.blessings.brave=num('f-bless-brave'); p.blessings.support=num('f-bless-support'); p.blessings.precise=num('f-bless-precise'); p.blessings.blaze=num('f-bless-blaze'); }

  p.base.str=num('f-str'); p.base.dex=num('f-dex'); p.base.con=num('f-con');
  p.base.int=num('f-int'); p.base.wis=num('f-wis'); p.base.cha=num('f-cha');
  p.bonus=num('f-bonus');
  ['str','dex','con','int','wis','cha'].forEach(s=>{p.alloc[s]=num('f-alloc-'+s);p.panacea[s]=num('f-pan-'+s);});
  p.panaceaUsed=num('f-pan-used');

  if (d) DERIVED_DEFS.forEach(({key,type})=>{ const el=document.getElementById('f-d-'+key); if(el) d[key]=type==='bool'?bool('f-d-'+key):num('f-d-'+key); });

  const mc=p.lastMapByCat=p.lastMapByCat||{};
  mc.village=val('f-map-village'); mc.wild=val('f-map-wild'); mc.dungeon=val('f-map-dungeon');
  mc.special=val('f-map-special'); mc.tower=val('f-map-tower'); mc.siege=val('f-map-siege'); mc.castle=val('f-map-castle');
  p.lastBattleMap=val('f-last-battle');

  if (p.siege) { p.siege.active=bool('f-siege-active'); p.siege.gateKilled=bool('f-siege-gate'); p.siege.towerKilled=bool('f-siege-tower'); p.siege.gateHp=num('f-siege-gate-hp'); p.siege.towerHp=num('f-siege-tower-hp'); p.siege.kills=num('f-siege-kills'); p.siege.result=val('f-siege-result')||null; p.siege.city=val('f-siege-city'); p.siege.victoryCity=val('f-siege-victory-city')||null; }

  p.bloodPledge=val('f-blood-pledge')||null; p.sherineWorld=bool('f-sherine-world');
  p.prideBeatJenis=bool('f-pride-beat'); p.demonTempleOpen=bool('f-demon-temple');
  p.flameAffinity=num('f-flame-affinity'); p.trialStage=num('f-trial-stage'); p.ismaelAccUsed=bool('f-ismael-used');

  if (p.config) { p.config.setPot=val('f-cfg-pot'); p.config.setHpPot=num('f-cfg-pot-hp'); p.config.setAutoBuyPot=bool('f-cfg-auto-buy-pot'); p.config.selAtkSkill=val('f-cfg-sel-atk'); p.config.setMpAtk=num('f-cfg-mp-atk'); p.config.selHealSkill=val('f-cfg-sel-heal'); p.config.setMpHeal=num('f-cfg-mp-heal'); p.config.selConvertSkill=val('f-cfg-sel-convert'); p.config.setHpConvert=num('f-cfg-hp-convert'); }
  if (p.pandoraMarket) { p.pandoraMarket.id=val('f-pandora-id'); p.pandoraMarket.price=num('f-pandora-price'); p.pandoraMarket.weight=num('f-pandora-weight'); }
  if (p.summon) { p.summon.skId=val('f-summon-skid'); p.summon.n=val('f-summon-n'); p.summon.cd=num('f-summon-cd'); }
}

// ─── INVENTORY ────────────────────────────────────────────────
function initInvToolbar() {
  document.getElementById('inv-search').addEventListener('input', renderInventory);
  document.getElementById('inv-cat-filter').addEventListener('change', function() { invCatFilter=this.value; renderInventory(); });
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); invSort=btn.dataset.sort; renderInventory();
    });
  });
}

function getFilteredInv() {
  const p = saveData?.p; if (!p) return [];
  let items = p.inv.map((item,idx) => ({...item, _idx:idx}));
  const search = document.getElementById('inv-search')?.value?.toLowerCase()||'';
  if (search) items = items.filter(i => i.id.toLowerCase().includes(search) || i.uid.toLowerCase().includes(search) || (String(i.attr)||'').toLowerCase().includes(search));
  if (invCatFilter) items = items.filter(i => i.id.startsWith(invCatFilter+'_'));
  switch(invSort) {
    case 'id': items.sort((a,b)=>a.id.localeCompare(b.id)); break;
    case 'cnt-desc': items.sort((a,b)=>b.cnt-a.cnt); break;
    case 'cnt-asc': items.sort((a,b)=>a.cnt-b.cnt); break;
    case 'en-desc': items.sort((a,b)=>b.en-a.en); break;
    case 'bless': items=items.filter(i=>i.bless); items.sort((a,b)=>a.id.localeCompare(b.id)); break;
    case 'anc': items=items.filter(i=>i.anc); items.sort((a,b)=>a.id.localeCompare(b.id)); break;
    case 'attr': items=items.filter(i=>i.attr&&i.attr!==false); items.sort((a,b)=>a.id.localeCompare(b.id)); break;
    case 'lock': items=items.filter(i=>i.lock); items.sort((a,b)=>a.id.localeCompare(b.id)); break;
  }
  return items;
}

function renderInventory() {
  const p = saveData?.p; if (!p) return;
  const filtered = getFilteredInv();
  document.getElementById('inv-show-count').textContent = filtered.length;
  document.getElementById('inv-total-count').textContent = p.inv.length;
  document.getElementById('inv-total-qty').textContent = p.inv.reduce((s,i)=>s+i.cnt,0).toLocaleString();

  const c = document.getElementById('inv-list'); c.innerHTML = '';
  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card' + (item.lock?' highlight':'');
    const prefix = item.id.split('_')[0];
    const catLabel = ITEM_CATS[prefix]||'';
    card.innerHTML = `
      <div class="item-card-header">
        <span class="item-card-id">${catLabel} ${item.id}</span>
        <span class="item-card-uid">${item.uid}</span>
        <button class="item-del" data-idx="${item._idx}" title="刪除">✕</button>
      </div>
      <div class="item-card-row">
        <input class="w-id" type="text" value="${item.id}" data-field="id" data-idx="${item._idx}" placeholder="ID">
        <input class="w-cnt" type="number" value="${item.cnt}" data-field="cnt" data-idx="${item._idx}" min="0" title="數量">
        <input class="w-en" type="number" value="${item.en}" data-field="en" data-idx="${item._idx}" min="0" title="強化">
        <input class="w-attr" type="text" value="${item.attr&&item.attr!==false?item.attr:''}" data-field="attr" data-idx="${item._idx}" placeholder="屬性" title="屬性(e.g. fire3)">
      </div>
      <div class="item-card-row" style="margin-top:2px">
        <span class="tag ${item.bless?'tag-bless':'tag-bless tag-off'}" data-field="bless" data-idx="${item._idx}">祝福</span>
        <span class="tag ${item.anc?'tag-anc':'tag-anc tag-off'}" data-field="anc" data-idx="${item._idx}">遠古</span>
        <span class="tag ${item.attr&&item.attr!==false?'tag-attr':'tag-attr tag-off'}" data-field="attr_toggle" data-idx="${item._idx}">屬性</span>
        <span class="tag ${item.seteff?'tag-set':'tag-set tag-off'}" data-field="seteff" data-idx="${item._idx}">套裝</span>
        <span class="tag ${item.lock?'tag-lock':'tag-lock tag-off'}" data-field="lock" data-idx="${item._idx}">🔒鎖</span>
        <span class="tag ${item.junk?'tag-junk':'tag-junk tag-off'}" data-field="junk" data-idx="${item._idx}">垃圾</span>
      </div>`;
    c.appendChild(card);
  });

  // Bind inputs
  c.querySelectorAll('input[data-field]').forEach(input => {
    input.addEventListener('change', () => {
      const idx=parseInt(input.dataset.idx), field=input.dataset.field, item=p.inv[idx];
      if (field==='cnt'||field==='en') item[field]=parseInt(input.value)||0;
      else if (field==='id') item.id=input.value;
      else if (field==='attr') item.attr=input.value||false;
    });
  });
  c.querySelectorAll('.tag[data-field]').forEach(tag => {
    tag.addEventListener('click', () => {
      const idx=parseInt(tag.dataset.idx), field=tag.dataset.field, item=p.inv[idx];
      if (field==='attr_toggle') { item.attr = item.attr&&item.attr!==false ? false : 'fire1'; }
      else { item[field]=!item[field]; }
      renderInventory();
    });
  });
  c.querySelectorAll('.item-del').forEach(btn => {
    btn.addEventListener('click', () => { p.inv.splice(parseInt(btn.dataset.idx),1); renderInventory(); });
  });
}

// ─── EQUIPMENT ────────────────────────────────────────────────
function renderEquipment() {
  const p=saveData?.p; if(!p)return;
  const c=document.getElementById('eq-grid'); c.innerHTML='';
  EQ_SLOTS.forEach(({key,label})=>{
    const item=p.eq?.[key]; const slot=document.createElement('div'); slot.className='eq-slot';
    let tagsHtml='';
    if(item){
      if(item.bless)tagsHtml+='<span class="tag tag-bless">祝福</span>';
      if(item.anc)tagsHtml+='<span class="tag tag-anc">遠古</span>';
      if(item.attr&&item.attr!==false)tagsHtml+=`<span class="tag tag-attr">${item.attr}</span>`;
      if(item.seteff)tagsHtml+='<span class="tag tag-set">套裝</span>';
      if(item.lock)tagsHtml+='<span class="tag tag-lock">🔒</span>';
    }
    slot.innerHTML=`
      <div class="eq-slot-name">${label}</div>
      ${item?`<div class="eq-slot-item">${item.id} +${item.en}</div>`:'<div class="eq-slot-empty">(空)</div>'}
      <div class="eq-slot-fields">
        <input type="text" data-eq="${key}" data-field="id" value="${item?.id||''}" placeholder="物品 ID">
        <input type="number" data-eq="${key}" data-field="en" value="${item?.en||0}" min="0" placeholder="強化">
        <input type="text" data-eq="${key}" data-field="attr" value="${item?.attr&&item.attr!==false?item.attr:''}" placeholder="屬性">
      </div>
      <div class="eq-slot-tags">${tagsHtml}</div>`;
    c.appendChild(slot);
  });
  c.querySelectorAll('input[data-eq]').forEach(input=>{
    input.addEventListener('change',()=>{
      const key=input.dataset.eq, field=input.dataset.field;
      if(!p.eq[key]) p.eq[key]={uid:randUid(),cnt:1,en:0,bless:false,anc:false,attr:false,seteff:false,lock:false,junk:false};
      if(field==='id'){if(input.value)p.eq[key].id=input.value;else p.eq[key]=null;}
      else if(field==='en')p.eq[key].en=parseInt(input.value)||0;
      else if(field==='attr')p.eq[key].attr=input.value||false;
      renderEquipment();
    });
  });
}

// ─── SKILLS ───────────────────────────────────────────────────
function renderSkills() {
  const p=saveData?.p; if(!p)return;
  const search=document.getElementById('skill-search')?.value?.toLowerCase()||'';
  const skills=(p.skills||[]).filter(s=>!search||s.toLowerCase().includes(search));
  document.getElementById('skill-count').textContent=p.skills?.length||0;
  const c=document.getElementById('skills-list'); c.innerHTML='';
  skills.forEach((sk,idx)=>{
    const realIdx=p.skills.indexOf(sk);
    const chip=document.createElement('div'); chip.className='skill-chip';
    chip.innerHTML=`<span class="skill-name">${sk}</span><span class="skill-del" data-idx="${realIdx}">✕</span>`;
    c.appendChild(chip);
  });
  c.querySelectorAll('.skill-del').forEach(btn=>{
    btn.addEventListener('click',()=>{p.skills.splice(parseInt(btn.dataset.idx),1);renderSkills();});
  });
}

// ─── BUFFS ────────────────────────────────────────────────────
function renderBuffs() {
  const p=saveData?.p; if(!p)return;
  const search=document.getElementById('buff-search')?.value?.toLowerCase()||'';
  const buffs=p.buffs||{};
  const entries=Object.entries(buffs).filter(([k])=>!search||k.toLowerCase().includes(search)||(BUFF_NAMES[k]||'').includes(search));
  const activeCount=Object.values(buffs).filter(v=>v>0).length;
  document.getElementById('buff-count').textContent=activeCount;
  const c=document.getElementById('buffs-list'); c.innerHTML='';
  entries.forEach(([key,val])=>{
    const row=document.createElement('div'); row.className='buff-row';
    const name=BUFF_NAMES[key]||key;
    row.innerHTML=`<span class="buff-name ${val>0?'buff-active':''}">${name}</span><input class="buff-val" type="number" value="${val}" min="0" data-buff="${key}">`;
    c.appendChild(row);
  });
  c.querySelectorAll('input[data-buff]').forEach(input=>{
    input.addEventListener('change',()=>{if(p.buffs)p.buffs[input.dataset.buff]=parseInt(input.value)||0;});
  });
}

// ─── ALLIES ───────────────────────────────────────────────────
function renderAllies() {
  const p=saveData?.p; if(!p)return;
  const c=document.getElementById('allies-list'); c.innerHTML='';
  (p.allies||[]).forEach((ally,idx)=>{
    const div=document.createElement('div'); div.className='item-card';
    div.innerHTML=`<div class="item-card-header"><span class="item-card-id">🤝 ${ally.name||'夥伴'+idx} (${ally.cls})</span><span class="item-card-uid">Lv.${ally.lv} HP:${Math.round(ally.hp)}/${Math.round(ally.mhp)}</span></div>`;
    c.appendChild(div);
  });
  if (!p.allies||p.allies.length===0) c.innerHTML='<div class="info-text">無夥伴</div>';
}

// ─── STATUSES ─────────────────────────────────────────────────
function renderStatuses() {
  const p=saveData?.p; if(!p||!p.statuses)return;
  const c=document.getElementById('statuses-grid'); c.innerHTML='';
  Object.entries(p.statuses).forEach(([key,val])=>{
    if(key.endsWith('Dmg')||key.endsWith('Tick'))return;
    const label=STATUS_NAMES[key]||key;
    c.innerHTML+=`<label>${label}</label><input type="number" id="f-status-${key}" value="${val}" min="0">`;
  });
}

function renderCds() {
  const p=saveData?.p; if(!p)return;
  const c=document.getElementById('cds-grid'); c.innerHTML='';
  if(p.cds) Object.entries(p.cds).forEach(([k,v])=>{
    c.innerHTML+=`<label>${k}</label><input type="number" id="f-cd-${k}" value="${v}" min="0">`;
  });
  c.innerHTML+=`<label>魔盾CD</label><input type="number" id="f-cd-magicshield" value="${p.magicShieldCd||0}" min="0">`;
  c.innerHTML+=`<label>復活卷軸CD</label><input type="number" id="f-cd-revive" value="${p.reviveScrollCd||0}" min="0">`;
  if(p.manualCd) Object.entries(p.manualCd).forEach(([k,v])=>{
    c.innerHTML+=`<label>手動CD:${k}</label><input type="number" id="f-cd-manual-${k}" value="${v}" min="0">`;
  });
}

// ─── AUTO BUFF CONFIG ─────────────────────────────────────────
function renderAutoBuffs() {
  const p=saveData?.p; if(!p||!p.config)return;
  const c=document.getElementById('auto-buff-grid'); c.innerHTML='';
  AUTO_BUFF_KEYS.forEach(({key,label,buyKey})=>{
    c.innerHTML+=`<label>${label}</label><select id="f-cfg-${key}"><option value="false" ${!p.config[key]?'selected':''}>關</option><option value="true" ${p.config[key]?'selected':''}>開</option></select>`;
    if(buyKey) c.innerHTML+=`<label>自動購買</label><select id="f-cfg-${buyKey}"><option value="false" ${!p.config[buyKey]?'selected':''}>關</option><option value="true" ${p.config[buyKey]?'selected':''}>開</option></select>`;
  });
}

// ─── SET BONUSES ──────────────────────────────────────────────
function renderSetBonuses() {
  const p=saveData?.p; if(!p)return;
  const c=document.getElementById('set-bonus-grid'); c.innerHTML='';
  SET_BONUSES.forEach(({key,label})=>{
    c.innerHTML+=`<label>${label}</label><select id="f-${key}"><option value="false" ${!p[key]?'selected':''}>否</option><option value="true" ${p[key]?'selected':''}>是</option></select>`;
  });
}

// ─── JUNK PREFS ───────────────────────────────────────────────
function renderJunkPrefs() {
  const p=saveData?.p; if(!p)return;
  const keys=Object.keys(p.junkPrefs||{});
  document.getElementById('junk-count').textContent=keys.length;
  const c=document.getElementById('junk-list'); c.innerHTML='';
  keys.slice(0,30).forEach(k=>{ c.innerHTML+=`<div>${k}: ${JSON.stringify(p.junkPrefs[k])}</div>`; });
  if(keys.length>30) c.innerHTML+=`<div>...及其他 ${keys.length-30} 項</div>`;
}

// ─── DERIVED GRID ─────────────────────────────────────────────
function initDerivedGrid() {
  const c=document.getElementById('derived-grid');
  DERIVED_DEFS.forEach(({key,label,type})=>{
    if(type==='bool') c.innerHTML+=`<label>${label}</label><select id="f-d-${key}"><option value="false">否</option><option value="true">是</option></select>`;
    else c.innerHTML+=`<label>${label}</label><input type="number" id="f-d-${key}" step="0.01">`;
  });
}

// ─── ACTIONS ──────────────────────────────────────────────────
function initActions() {
  // Save
  document.getElementById('btn-save').addEventListener('click',()=>{ applyAllFields(); saveCurrentSlot(); });
  document.getElementById('btn-load').addEventListener('click',()=>{ if(slots[currentSlot]){saveData=JSON.parse(JSON.stringify(slots[currentSlot].data));renderAll();showToast('已重載','success');} });
  document.getElementById('btn-reset').addEventListener('click',()=>{ if(slots[currentSlot]){saveData=JSON.parse(JSON.stringify(slots[currentSlot].data));renderAll();showToast('已重置','success');} });

  // File import
  document.getElementById('btn-import-file').addEventListener('click',()=>document.getElementById('file-import').click());
  document.getElementById('file-import').addEventListener('change',async e=>{
    const file=e.target.files[0]; if(!file)return;
    try { const text=await file.text(); const data=JSON.parse(text); if(!data.p)throw 0; saveData=data;
      slots[currentSlot]={name:file.name.replace('.json',''),data:JSON.parse(JSON.stringify(data)),meta:extractMeta(data),updatedAt:Date.now()};
      saveSlots();renderSlots();renderAll();showToast('已匯入：'+file.name,'success');
    } catch { showToast('JSON 格式錯誤','error'); } e.target.value='';
  });

  // File export
  document.getElementById('btn-export-file').addEventListener('click',()=>{
    applyAllFields(); if(!saveData){showToast('無資料','error');return;}
    const blob=new Blob([JSON.stringify(saveData,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='fable5_save.json';a.click();showToast('已匯出','success');
  });

  // Add item
  document.getElementById('btn-add-item').addEventListener('click',()=>{ if(!saveData){showToast('請先匯入','error');return;} saveData.p.inv.push({id:'new_item',uid:randUid(),cnt:1,en:0,bless:false,anc:false,attr:false,seteff:false,lock:false,junk:false}); renderInventory(); });
  document.getElementById('btn-del-junk').addEventListener('click',()=>{ if(!saveData)return; const before=saveData.p.inv.length; saveData.p.inv=saveData.p.inv.filter(i=>!i.junk); renderInventory(); showToast(`已刪除 ${before-saveData.p.inv.length} 件垃圾`,'success'); });
  document.getElementById('btn-unlock-all').addEventListener('click',()=>{ if(!saveData)return; saveData.p.inv.forEach(i=>i.lock=false); renderInventory(); showToast('已全部解鎖','success'); });

  // Add skill
  document.getElementById('btn-add-skill').addEventListener('click',()=>{
    if(!saveData){showToast('請先匯入','error');return;}
    const id=document.getElementById('new-skill-id').value.trim(); if(!id){showToast('請輸入ID','error');return;}
    if(!saveData.p.skills.includes(id)){saveData.p.skills.push(id);renderSkills();showToast('已新增：'+id,'success');}
    else showToast('技能已存在','error');
    document.getElementById('new-skill-id').value='';
  });

  // Clear poly
  document.getElementById('btn-clear-poly').addEventListener('click',()=>{ if(!saveData)return; saveData.p.poly=null; renderAll(); showToast('已清除變身','success'); });
  // Clear summon
  document.getElementById('btn-clear-summon').addEventListener('click',()=>{ if(!saveData)return; saveData.p.summon=null; renderAll(); showToast('已清除召喚獸','success'); });

  // JSON
  document.getElementById('btn-load-json').addEventListener('click',()=>{ if(saveData)document.getElementById('json-editor').value=JSON.stringify(saveData,null,2); });
  document.getElementById('btn-apply-json').addEventListener('click',()=>{
    try { const data=JSON.parse(document.getElementById('json-editor').value); if(!data.p)throw 0; saveData=data; renderAll(); showToast('JSON 已套用','success'); }
    catch(e){showToast('JSON 格式錯誤','error');}
  });
  document.getElementById('btn-format-json').addEventListener('click',()=>{
    try { const data=JSON.parse(document.getElementById('json-editor').value); document.getElementById('json-editor').value=JSON.stringify(data,null,2); showToast('已格式化','success'); }
    catch{showToast('JSON 無法解析','error');}
  });
  document.getElementById('btn-validate-json').addEventListener('click',()=>{
    try { JSON.parse(document.getElementById('json-editor').value); document.getElementById('json-status').innerHTML='<span style="color:var(--success)">✅ JSON 格式正確</span>'; }
    catch(e){ document.getElementById('json-status').innerHTML=`<span style="color:var(--danger)">❌ ${e.message}</span>`; }
  });

  // Skill / buff search
  document.getElementById('skill-search')?.addEventListener('input',renderSkills);
  document.getElementById('buff-search')?.addEventListener('input',renderBuffs);
}

function saveCurrentSlot() {
  if(!saveData){showToast('無資料','error');return;}
  applyAllFields();
  const name=slots[currentSlot]?.name||`存檔 ${currentSlot+1}`;
  slots[currentSlot]={name,data:JSON.parse(JSON.stringify(saveData)),meta:extractMeta(saveData),updatedAt:Date.now()};
  saveSlots();renderSlots();showToast(`已儲存至槽 ${currentSlot+1}`,'success');
}

// ─── PRESETS ──────────────────────────────────────────────────
function initPresets() {
  document.querySelectorAll('[data-preset]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(!saveData){showToast('請先匯入','error');return;}
      applyPreset(btn.dataset.preset); renderAll(); showToast('已套用：'+btn.textContent,'success');
    });
  });
}

function applyPreset(preset) {
  const p=saveData.p;
  switch(preset) {
    case 'max-gold': p.gold=999999999; break;
    case 'max-pots': { const pot=p.inv.find(i=>i.id==='potion_heal'); if(pot)pot.cnt=9999; } break;
    case 'max-level': p.lv=99999; p.exp=0; break;
    case 'max-stats': p.base.str=999;p.base.dex=999;p.base.con=999;p.base.int=999;p.base.wis=999;p.base.cha=999; break;
    case 'max-hpmp': p.mhp=99999;p.hp=99999;p.mmp=99999;p.mp=99999; break;
    case 'clear-buffs': Object.keys(p.buffs||{}).forEach(k=>p.buffs[k]=0); break;
    case 'reset-cd': if(p.cds)Object.keys(p.cds).forEach(k=>p.cds[k]=0); p.magicShieldCd=0;p.reviveScrollCd=0;p.manualCd={}; break;
    case 'clear-statuses': if(p.statuses)Object.keys(p.statuses).forEach(k=>p.statuses[k]=0); p.dead=false; break;
    case 'bless-all': if(p.blessings){const now=Date.now();p.blessings.brave=now;p.blessings.support=now;p.blessings.precise=now;p.blessings.blaze=now;} break;
    case 'unlock-inv': p.inv.forEach(i=>i.lock=false); break;
  }
}

// ─── HELPERS ──────────────────────────────────────────────────
function val(id){const el=document.getElementById(id);return el?el.value:'';}
function num(id){return parseInt(document.getElementById(id)?.value)||0;}
function bool(id){return document.getElementById(id)?.value==='true';}
function setVal(id,v){const el=document.getElementById(id);if(!el)return;if(el.tagName==='INPUT'&&el.type==='checkbox')el.checked=!!v;else el.value=v??'';}
function randUid(){return Math.random().toString(36).slice(2,11);}
function showToast(msg,type=''){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show'+(type?' '+type:'');clearTimeout(t._timer);t._timer=setTimeout(()=>t.className='toast',2500);}

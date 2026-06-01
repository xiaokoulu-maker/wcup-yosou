import { createClient } from '@supabase/supabase-js'
import React, { useState, useEffect, useCallback, useRef, useMemo, Component } from 'react'
import ReactDOM from 'react-dom/client'
import { LayoutGrid, Trophy, Users, MessageCircle, Calendar, Globe, ChevronRight, Zap, Medal, Target, Star, BarChart2, Clock, CheckCircle, XCircle, Flame } from 'lucide-react'
import { HoIcon, HoAvatar, HoScreenHeader } from './ds-components'
import { Icon as DsIcon } from './ds-icons'
import { Flag, TEAMS, Tabs as DsTabs, Stat as DsStat, Banner as DsBanner, PageHead as DsPageHead, SectionHead as DsSectionHead, MatchCard as DsMatchCard, useToast as useDsToast, BackRow as DsBackRow } from './ds-ui'

// true にすれば「ベスト11」ボタンが復活し、「ベスト16予想」ボタンが非表示になる
const SHOW_BEST11 = false;

class ErrorBoundary extends Component{
  constructor(props){super(props);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(error){return{hasError:true,error};}
  componentDidCatch(error,info){console.error("[ErrorBoundary]",error,info?.componentStack);}
  render(){
    if(this.state.hasError){
      return(
        <div style={{padding:24,fontFamily:"monospace",background:"#fff",minHeight:"100vh"}}>
          <div style={{color:"#E60033",fontWeight:900,fontSize:18,marginBottom:12}}>⚠️ Reactエラーが発生しました</div>
          <pre style={{background:"#f5f5f5",padding:12,borderRadius:8,fontSize:12,overflow:"auto",whiteSpace:"pre-wrap"}}>{String(this.state.error)}</pre>
          <button onClick={()=>this.setState({hasError:false,error:null})} style={{marginTop:12,padding:"8px 16px",background:"#005BAC",color:"#fff",border:"none",borderRadius:8,cursor:"pointer"}}>再試行</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function loadHtml2Canvas(){
  return new Promise((resolve,reject)=>{
    if(window.html2canvas) return resolve(window.html2canvas);
    const s=document.createElement("script");
    s.src="https://html2canvas.hertzen.com/dist/html2canvas.min.js";
    s.onload=()=>resolve(window.html2canvas);
    s.onerror=reject;
    document.body.appendChild(s);
  });
}

async function generateShareImage(cardJsx){
  const h2c=await loadHtml2Canvas();
  return new Promise((resolve,reject)=>{
    // document.body に直接コンテナを追加してレンダリング
    const container=document.createElement("div");
    container.style.cssText="position:fixed;left:-9999px;top:0;width:540px;height:960px;overflow:hidden;background:#0d1f3f";
    document.body.appendChild(container);
    const root=ReactDOM.createRoot(container);
    root.render(cardJsx);
    // React レンダリング完了を待ってから撮影
    setTimeout(()=>{
      h2c(container,{
        scale:1,
        backgroundColor:"#0d1f3f",
        width:540,
        height:960,
        useCORS:true,
        allowTaint:true,
        logging:false,
      }).then(c=>{
        c.toBlob(b=>{
          try{root.unmount();document.body.removeChild(container);}catch{}
          resolve(b);
        },"image/png");
      }).catch(err=>{
        try{root.unmount();document.body.removeChild(container);}catch{}
        reject(err);
      });
    },600);
  });
}
async function doShareImage(cardJsx,fileName,text){
  try{
    const blob=await generateShareImage(cardJsx);
    const file=new File([blob],fileName,{type:"image/png"});
    if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
      await navigator.share({files:[file],text,url:"https://xiaokoulu-maker.github.io/wcup-yosou/"});
    }else{
      const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download=fileName;a.click();URL.revokeObjectURL(u);
      alert("画像を保存しました。LINEやXに添付して共有してください！");
    }
  }catch(e){
    if(e?.name!=="AbortError") alert("シェア機能が使えませんでした。スクリーンショットで共有してください。");
  }
}

const SUPABASE_URL="https://evodfdwgcogviscdnveb.supabase.co";
const SUPABASE_ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2b2RmZHdnY29ndmlzY2RudmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1ODIwNTUsImV4cCI6MjA5NTE1ODA1NX0.nevoums6mBnp0bK8vmRqCIJI4rcr04nPnwBmQtt-9oU";
const db=createClient(SUPABASE_URL,SUPABASE_ANON);
// ═══════════════════════════════
// アクセス解析・行動ログ
// ═══════════════════════════════
async function trackEvent(eventName, meta={}){
  if(!db) return;
  try{
    await db.from("events").insert({
      event_name: eventName,
      tournament_id: meta.tournamentId||null,
      participant_id: meta.participantId||null,
      page: meta.page||window.location.hash||"/",
      metadata: meta,
    });
  }catch(e){
    console.warn("[analytics] failed:", eventName, e?.message);
  }
}

function dbToApp(d){return{id:d.id,name:d.name,creatorName:d.creator_name,maxParticipants:d.max_participants,adminPasscode:d.admin_passcode,participants:d.participants||[],results:d.results||null,plan:d.plan||"free",deadline:d.deadline||null,predictionSettings:d.prediction_settings||null,allowLateJoin:d.allow_late_join!==false,createdAt:d.created_at};}
async function loadT(id){if(!db) return null;try{const{data,error}=await db.from("tournaments").select("*").eq("id",id).single();if(error||!data)return null;return dbToApp(data);}catch{return null;}}
async function saveT(t){if(!db) return;try{await db.from("tournaments").upsert({id:t.id,name:t.name,creator_name:t.creatorName,max_participants:t.maxParticipants,admin_passcode:t.adminPasscode,participants:t.participants,results:t.results,plan:t.plan||"free",deadline:t.deadline||null,prediction_settings:t.predictionSettings||null,allow_late_join:t.allowLateJoin!==false},{onConflict:"id"});}catch(e){console.error(e);}}
function subscribeToTournament(id,onUpdate){if(!db) return ()=>{};const ch=db.channel("t-"+id).on("postgres_changes",{event:"UPDATE",schema:"public",table:"tournaments",filter:`id=eq.${id}`},p=>{if(p.new)onUpdate(dbToApp(p.new));}).subscribe();return()=>db.removeChannel(ch);}

// チャット: メッセージ取得
async function fetchMessages(tournamentId,limit=50){
  if(!db) return [];
  try{
    let q=db.from("messages").select("*").order("created_at",{ascending:true}).limit(limit);
    if(tournamentId) q=q.eq("tournament_id",tournamentId);
    else q=q.is("tournament_id",null);
    const{data,error}=await q;
    return error?[]:(data||[]);
  }catch{return[];}
}
// チャット: メッセージ送信
async function sendMessage(tournamentId,nickname,icon,body,opts={}){
  if(!db) return false;
  try{
    const row={nickname,icon,body,...opts};
    if(tournamentId) row.tournament_id=tournamentId;
    const{error}=await db.from("messages").insert(row);
    return !error;
  }catch{return false;}
}
// チャット: リアルタイム購読（UPDATE も監視）
function subscribeToChat(tournamentId,onNew,onUpdate){
  if(!db) return ()=>{};
  const chName="chat-"+(tournamentId||"global");
  let ch=db.channel(chName).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"},p=>{
    if(!p.new)return;
    const msg=p.new;
    const isGlobal=!tournamentId&&!msg.tournament_id;
    const isTournament=tournamentId&&msg.tournament_id===tournamentId;
    if(isGlobal||isTournament) onNew(msg);
  });
  if(onUpdate){ch=ch.on("postgres_changes",{event:"UPDATE",schema:"public",table:"messages"},p=>{
    if(!p.new)return;
    const msg=p.new;
    const isGlobal=!tournamentId&&!msg.tournament_id;
    const isTournament=tournamentId&&msg.tournament_id===tournamentId;
    if(isGlobal||isTournament) onUpdate(msg);
  });}
  ch.subscribe();
  return()=>db.removeChannel(ch);
}
// チャット: リアクション切り替え
function getChatUserId(){let uid=localStorage.getItem("chat_uid");if(!uid){uid=Math.random().toString(36).slice(2,14);try{localStorage.setItem("chat_uid",uid);}catch{}}return uid;}
async function toggleReaction(messageId,emoji){
  if(!db)return false;
  const uid=getChatUserId();
  try{
    const{data}=await db.from("messages").select("reactions").eq("id",messageId).single();
    const prev=data?.reactions||{};
    const users=prev[emoji]||[];
    const next={...prev,[emoji]:users.includes(uid)?users.filter(u=>u!==uid):[...users,uid]};
    const{error}=await db.from("messages").update({reactions:next}).eq("id",messageId);
    return !error;
  }catch{return false;}
}
// チャット: システムメッセージ投稿
async function postSystemMessage(tournamentId,body){
  if(!db)return false;
  try{
    const row={nickname:"system",icon:"⚽",body,type:"system"};
    if(tournamentId)row.tournament_id=tournamentId;
    const{error}=await db.from("messages").insert(row);
    return !error;
  }catch{return false;}
}
// チャット未読管理
function getChatLastSeen(tid){try{return localStorage.getItem(`wcup_lastSeenChat_${tid}`)||null;}catch{return null;}}
function setChatLastSeen(tid){try{localStorage.setItem(`wcup_lastSeenChat_${tid}`,new Date().toISOString());localStorage.removeItem(`wcup_chatNewMsg_${tid}`);}catch{}}
function hasChatNewMsg(tid){try{return localStorage.getItem(`wcup_chatNewMsg_${tid}`)==="1";}catch{return false;}}
function markChatNewMsg(tid){try{localStorage.setItem(`wcup_chatNewMsg_${tid}`,"1");}catch{}}

// 全体匿名集計: participants の winner / japanResult / japanMvp のみ集約
async function fetchGlobalStats(){
  if(!db) return null;
  try{
    const{data,error}=await db.from("tournaments").select("participants");
    if(error||!data||data.length===0) return null;
    const all=data.flatMap(t=>t.participants||[]).filter(p=>p.predictions);
    if(all.length===0) return null;
    const total=all.length;
    const champMap={};
    all.forEach(p=>{if(p.predictions.winner){const k=p.predictions.winner;champMap[k]=(champMap[k]||0)+1;}});
    const champRank=Object.entries(champMap).sort((a,b)=>b[1]-a[1]);
    const japMap={};
    all.forEach(p=>{if(p.predictions.japanResult){const k=p.predictions.japanResult;japMap[k]=(japMap[k]||0)+1;}});
    const japRank=Object.entries(japMap).sort((a,b)=>b[1]-a[1]);
    const playerMap={};
    all.forEach(p=>{if(p.predictions.japanMvp){const k=p.predictions.japanMvp.trim();if(k)playerMap[k]=(playerMap[k]||0)+1;}});
    const playerRank=Object.entries(playerMap).sort((a,b)=>b[1]-a[1]);
    return{total,champRank,japRank,playerRank};
  }catch(e){console.warn("[globalStats]",e.message);return null;}
}

// ── spec-14: 全国 Crowd Pick ─────────────────────────────────
const CHAMP_CACHE_KEY="wcup_globalChampVotes";
const CHAMP_CACHE_TTL=5*60*1000;
async function fetchGlobalChampionVotes(){
  if(!db) return null;
  try{
    const{data,error}=await db.from("tournaments").select("participants");
    if(error||!data||data.length===0) return null;
    const all=data.flatMap(t=>t.participants||[]).filter(p=>p.predictions?.winner);
    if(all.length===0) return null;
    const counts={};let total=0;
    all.forEach(p=>{const c=p.predictions.winner;if(c){counts[c]=(counts[c]||0)+1;total++;}});
    const rankings=Object.entries(counts)
      .map(([country,count])=>({country,count,percent:total>0?Math.round(count/total*1000)/10:0}))
      .sort((a,b)=>b.count-a.count);
    return{total,rankings};
  }catch(e){console.warn("[champVotes]",e.message);return null;}
}
async function loadGlobalChampionVotes(force=false){
  try{
    if(!force){
      const cached=localStorage.getItem(CHAMP_CACHE_KEY);
      if(cached){const p=JSON.parse(cached);if(Date.now()-p.cachedAt<CHAMP_CACHE_TTL)return p.data;}
    }
    const fresh=await fetchGlobalChampionVotes();
    if(fresh)try{localStorage.setItem(CHAMP_CACHE_KEY,JSON.stringify({data:fresh,cachedAt:Date.now()}));}catch{}
    return fresh;
  }catch{return null;}
}

const SCORER_CACHE_KEY="wcup_globalJapanScorerVotes";
const SCORER_CACHE_TTL=5*60*1000;
async function fetchGlobalJapanScorerVotes(matchId){
  if(!matchId||!db) return null;
  try{
    const{data,error}=await db.from("tournaments").select("participants");
    if(error||!data||data.length===0) return null;
    const all=data.flatMap(t=>t.participants||[]);
    const counts={};let total=0;
    all.forEach(p=>{const sid=p.matchPredictions?.[matchId]?.japanScorer;if(sid&&sid!=="none"){counts[sid]=(counts[sid]||0)+1;total++;}});
    if(total===0) return null;
    const rankings=Object.entries(counts)
      .map(([playerId,count])=>{
        const player=JAPAN_SQUAD.find(p=>p.id===playerId);
        return{playerId,playerName:player?.name||"不明",playerNumber:player?.number,playerPos:player?.pos,count,percent:total>0?Math.round(count/total*1000)/10:0};
      })
      .sort((a,b)=>b.count-a.count);
    return{total,matchId,rankings};
  }catch(e){console.warn("[scorerVotes]",e.message);return null;}
}
async function loadGlobalJapanScorerVotes(matchId,force=false){
  if(!matchId) return null;
  try{
    if(!force){
      const cached=localStorage.getItem(SCORER_CACHE_KEY);
      if(cached){const p=JSON.parse(cached);if(p.matchId===matchId&&Date.now()-p.cachedAt<SCORER_CACHE_TTL)return p.data;}
    }
    const fresh=await fetchGlobalJapanScorerVotes(matchId);
    if(fresh)try{localStorage.setItem(SCORER_CACHE_KEY,JSON.stringify({data:fresh,matchId,cachedAt:Date.now()}));}catch{}
    return fresh;
  }catch{return null;}
}

// ── spec-11: 全国ランキング ──────────────────────────────────
const GLOBAL_RANK_CACHE_KEY="wcup_globalRankCache";
const GLOBAL_RANK_CACHE_AT="wcup_globalRankCacheAt";
const GLOBAL_RANK_TTL=5*60*1000; // 5分

async function fetchGlobalRanking(force=false){
  if(!force){
    try{
      const cached=localStorage.getItem(GLOBAL_RANK_CACHE_KEY);
      const at=parseInt(localStorage.getItem(GLOBAL_RANK_CACHE_AT)||"0");
      if(cached&&Date.now()-at<GLOBAL_RANK_TTL) return JSON.parse(cached);
    }catch{}
  }
  if(!db) return null;
  try{
    const{data,error}=await db.from("tournaments").select("participants");
    if(error||!data) return null;
    const all=data.flatMap(t=>t.participants||[])
      .filter(p=>(p.totalMatchPoints||0)>0)
      .sort((a,b)=>(b.totalMatchPoints||0)-(a.totalMatchPoints||0));
    const total=all.length;
    const list=all.slice(0,200).map((p,i)=>({
      rank:i+1,id:p.id,nickname:p.nickname||"名無し",icon:p.icon||"⚽",points:p.totalMatchPoints||0
    }));
    const result={list,total,fetchedAt:Date.now()};
    try{localStorage.setItem(GLOBAL_RANK_CACHE_KEY,JSON.stringify(result));localStorage.setItem(GLOBAL_RANK_CACHE_AT,String(Date.now()));}catch{}
    return result;
  }catch(e){console.warn("[globalRanking]",e.message);return null;}
}


// ══════════════════════════════════════
// カウントダウン定数（後から修正可）
// ══════════════════════════════════════
const WC_START_DATE      = "2026-06-11T00:00:00";  // W杯開幕日
const JAPAN_FIRST_MATCH  = "2026-06-15T00:00:00";  // 日本代表初戦（確定後に更新）
const JAPAN_NEXT_MATCH   = null;  // 日本の次戦（確定後: "2026-06-20T19:00:00" など）
const JAPAN_NEXT_OPPONENT= null;  // 次の対戦相手（確定後: "オランダ" など）
const KNOCKOUT_STARTED   = false; // 決勝T開始後にtrueに変更
// 日本代表候補選手データ
const JAPAN_PLAYERS=[
  {name:"三笘 薫",     pos:"FW",club:"ブライトン",      tags:["ドリブル","スピード"],note:"左サイドの突破が武器"},
  {name:"久保 建英",   pos:"MF",club:"レアル・ソシエダ",tags:["技術","創造性"],    note:"欧州トップリーグで活躍"},
  {name:"遠藤 航",     pos:"MF",club:"リバプール",      tags:["球際","守備"],      note:"中盤の要・キャプテン"},
  {name:"冨安 健洋",   pos:"DF",club:"アヤックス",      tags:["守備","高さ"],      note:"世界基準のCB・SB兼用"},
  {name:"上田 綺世",   pos:"FW",club:"フェイエノールト",tags:["ゴール","フィジカル"],note:"欧州で得点量産中"},
  {name:"鈴木 彩艶",   pos:"GK",club:"シント=トロイデン",tags:["反射","ビルドアップ"],note:"次世代GKの筆頭"},
  {name:"堂安 律",     pos:"MF",club:"フライブルク",    tags:["シュート","左足"],  note:"強烈なミドルシュートが武器"},
  {name:"伊東 純也",   pos:"FW",club:"スタッド・ランス",tags:["スピード","右サイド"],note:"圧倒的なスプリント力"},
  {name:"南野 拓実",   pos:"MF",club:"ASモナコ",        tags:["点取り屋","攻撃"],  note:"高い得点感覚を持つ万能型"},
  {name:"守田 英正",   pos:"MF",club:"スポルティング",  tags:["パス","インテンシティ"],note:"欧州でも通用する中盤"},
  {name:"鎌田 大地",   pos:"MF",club:"クリスタル・パレス",tags:["技術","展開力"],  note:"繊細なパスセンスが魅力"},
  {name:"田中 碧",     pos:"MF",club:"リーズ",          tags:["運動量","ハードワーク"],note:"走力と献身性が光る"},
  {name:"板倉 滉",     pos:"DF",club:"ボルシアMG",      tags:["空中戦","リーダーシップ"],note:"ドイツで実力証明済み"},
  {name:"町田 浩樹",   pos:"DF",club:"ユニオン・サンジロワーズ",tags:["高さ","強さ"],note:"ベルギーで欠かせない存在"},
  {name:"中村 敬斗",   pos:"FW",club:"スタッド・ランス",tags:["左足","突破"],      note:"強烈な左足シュートが魅力"},
  {name:"前田 大然",   pos:"FW",club:"セルティック",    tags:["スプリント","プレス"],note:"前線からの献身的なプレス"},
  {name:"旗手 怜央",   pos:"MF",club:"セルティック",    tags:["万能","運動量"],    note:"複数ポジションをこなす"},
  {name:"菅原 由勢",   pos:"DF",club:"サウサンプトン",  tags:["右SB","攻撃参加"],  note:"攻撃的な右サイドバック"},
  {name:"谷口 彰悟",   pos:"DF",club:"アル・ラヤン",    tags:["安定感","経験"],    note:"堅実な守備でチームを支える"},
  {name:"古橋 亨梧",   pos:"FW",club:"セルティック",    tags:["得点","スピード"],  note:"セルティックで得点量産"},
];

// ════════════════════════════════════
// W杯2026 決勝トーナメント表データ
// 後から実際の組み合わせに差し替え可能
// winner: null=未定, "home"/"away"=勝者
// ════════════════════════════════════
const BRACKET_DATA = {
  // ベスト32（16試合）- グループ1位/2位の組み合わせ
  r32: [
    {id:"r32_1", home:"グループA1位",away:"グループB2位",homeScore:null,awayScore:null,date:"7/1",winner:null},
    {id:"r32_2", home:"グループC1位",away:"グループD2位",homeScore:null,awayScore:null,date:"7/1",winner:null},
    {id:"r32_3", home:"グループE1位",away:"グループF2位",homeScore:null,awayScore:null,date:"7/2",winner:null},
    {id:"r32_4", home:"グループG1位",away:"グループH2位",homeScore:null,awayScore:null,date:"7/2",winner:null},
    {id:"r32_5", home:"グループI1位",away:"グループJ2位",homeScore:null,awayScore:null,date:"7/3",winner:null},
    {id:"r32_6", home:"グループK1位",away:"グループL2位",homeScore:null,awayScore:null,date:"7/3",winner:null},
    {id:"r32_7", home:"グループB1位",away:"グループA2位",homeScore:null,awayScore:null,date:"7/4",winner:null},
    {id:"r32_8", home:"グループD1位",away:"グループC2位",homeScore:null,awayScore:null,date:"7/4",winner:null},
    {id:"r32_9", home:"グループF1位",away:"グループE2位",homeScore:null,awayScore:null,date:"7/5",winner:null},
    {id:"r32_10",home:"グループH1位",away:"グループG2位",homeScore:null,awayScore:null,date:"7/5",winner:null},
    {id:"r32_11",home:"グループJ1位",away:"グループI2位",homeScore:null,awayScore:null,date:"7/6",winner:null},
    {id:"r32_12",home:"グループL1位",away:"グループK2位",homeScore:null,awayScore:null,date:"7/6",winner:null},
    {id:"r32_13",home:"3位通過A",   away:"3位通過B",   homeScore:null,awayScore:null,date:"7/7",winner:null},
    {id:"r32_14",home:"3位通過C",   away:"3位通過D",   homeScore:null,awayScore:null,date:"7/7",winner:null},
    {id:"r32_15",home:"3位通過E",   away:"3位通過F",   homeScore:null,awayScore:null,date:"7/8",winner:null},
    {id:"r32_16",home:"3位通過G",   away:"3位通過H",   homeScore:null,awayScore:null,date:"7/8",winner:null},
  ],
  // ベスト16（8試合）
  r16: [
    {id:"r16_1",home:"R32_1勝者",away:"R32_2勝者",homeScore:null,awayScore:null,date:"7/10",winner:null},
    {id:"r16_2",home:"R32_3勝者",away:"R32_4勝者",homeScore:null,awayScore:null,date:"7/10",winner:null},
    {id:"r16_3",home:"R32_5勝者",away:"R32_6勝者",homeScore:null,awayScore:null,date:"7/11",winner:null},
    {id:"r16_4",home:"R32_7勝者",away:"R32_8勝者",homeScore:null,awayScore:null,date:"7/11",winner:null},
    {id:"r16_5",home:"R32_9勝者",away:"R32_10勝者",homeScore:null,awayScore:null,date:"7/12",winner:null},
    {id:"r16_6",home:"R32_11勝者",away:"R32_12勝者",homeScore:null,awayScore:null,date:"7/12",winner:null},
    {id:"r16_7",home:"R32_13勝者",away:"R32_14勝者",homeScore:null,awayScore:null,date:"7/13",winner:null},
    {id:"r16_8",home:"R32_15勝者",away:"R32_16勝者",homeScore:null,awayScore:null,date:"7/13",winner:null},
  ],
  // 準々決勝（4試合）
  qf: [
    {id:"qf_1",home:"R16_1勝者",away:"R16_2勝者",homeScore:null,awayScore:null,date:"7/15",winner:null},
    {id:"qf_2",home:"R16_3勝者",away:"R16_4勝者",homeScore:null,awayScore:null,date:"7/15",winner:null},
    {id:"qf_3",home:"R16_5勝者",away:"R16_6勝者",homeScore:null,awayScore:null,date:"7/16",winner:null},
    {id:"qf_4",home:"R16_7勝者",away:"R16_8勝者",homeScore:null,awayScore:null,date:"7/16",winner:null},
  ],
  // 準決勝（2試合）
  sf: [
    {id:"sf_1",home:"QF1勝者",away:"QF2勝者",homeScore:null,awayScore:null,date:"7/18",winner:null},
    {id:"sf_2",home:"QF3勝者",away:"QF4勝者",homeScore:null,awayScore:null,date:"7/19",winner:null},
  ],
  // 3位決定戦
  third: {id:"3rd",home:"SF1敗者",away:"SF2敗者",homeScore:null,awayScore:null,date:"7/21",winner:null},
  // 決勝
  final: {id:"final",home:"SF1勝者",away:"SF2勝者",homeScore:null,awayScore:null,date:"7/22",winner:null},
};

// ESPNのAPIから試合データを取得してBRACKET_DATAを更新する関数（開幕後に使用）
async function fetchBracketFromESPN(){
  try{
    const r=await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=100");
    const d=await r.json();
    return d.events||[];
  }catch{return[];}
}

// ⚠️ 本番前: test_ URLを本番用Stripe Payment Link URLに差し替えてください
const STRIPE={
  // ⚠️ 本番公開前に test_ URLを本番用URLに差し替えること
  // mini: 廃止（無料5人化により不要）
  standard:{url:"https://buy.stripe.com/test_3cIfZh1w33qYbx1dF0e7m00",label:"スタンダード",people:10,price:500},
  premium: {url:"https://buy.stripe.com/test_00wfZha2z2mUfNhasOe7m01",label:"プレミアム",people:30,price:980},
  group:   {url:"https://buy.stripe.com/test_3cI00ja2zaTqcB57gCe7m02",label:"グループ",people:50,price:1480},
  support: {url:"",label:"開発者にコーヒーを奢る",price:100},  // ← Stripeで100円の商品を作成後にURLを入れる
};
// 無料プランは5人まで
const FREE_LIMIT=5;
function getPlanLimit(plan){
  if(plan==="standard") return STRIPE.standard.people;
  if(plan==="premium")  return STRIPE.premium.people;
  if(plan==="group")    return STRIPE.group.people;
  return FREE_LIMIT;
}
function getRequiredPlanByPeople(count){
  if(count<=FREE_LIMIT)              return {key:"free",    label:"無料",       price:0,                    people:FREE_LIMIT,          url:""};
  if(count<=STRIPE.standard.people)  return {key:"standard",...STRIPE.standard};
  if(count<=STRIPE.premium.people)   return {key:"premium", ...STRIPE.premium};
  return                                    {key:"group",   ...STRIPE.group};
}


const COUNTRIES=["日本","ブラジル","アルゼンチン","フランス","イングランド","スペイン","ドイツ","ポルトガル","オランダ","イタリア","クロアチア","ベルギー","その他"];
const JAPAN_RES=["グループステージ敗退","ベスト32","ベスト16","ベスト8","ベスト4","準優勝","優勝"];
const TOP_SCORER_CANDIDATES=[
  {name:"エムバペ",      country:"フランス"},
  {name:"ハーランド",    country:"ノルウェー"},
  {name:"ヴィニシウス",  country:"ブラジル"},
  {name:"ロドリゴ",      country:"ブラジル"},
  {name:"エンドリック",  country:"ブラジル"},
  {name:"ケイン",        country:"イングランド"},
  {name:"ベリンガム",    country:"イングランド"},
  {name:"ラウタロ",      country:"アルゼンチン"},
  {name:"アルバレス",    country:"アルゼンチン"},
  {name:"ムシアラ",      country:"ドイツ"},
  {name:"ハバーツ",      country:"ドイツ"},
  {name:"ヤマル",        country:"スペイン"},
  {name:"モラタ",        country:"スペイン"},
  {name:"ガクポ",        country:"オランダ"},
  {name:"ルカク",        country:"ベルギー"},
  {name:"デ・ブライネ",  country:"ベルギー"},
  {name:"C.ロナウド",    country:"ポルトガル"},
  {name:"グリーズマン",  country:"フランス"},
  {name:"上田 綺世",     country:"日本"},
  {name:"浅野 拓磨",     country:"日本"},
  {name:"プリシッチ",    country:"アメリカ"},
  {name:"その他",        country:""},
];
const ICONS=["⚽","🇯🇵","🦁","🐶","🐵","🐺","🦅","🔥","👑","🏆"];

const FIFA_RANK={
  "フランス":2,"スペイン":3,"アルゼンチン":1,"イングランド":5,"ポルトガル":6,
  "ブラジル":4,"オランダ":7,"モロッコ":13,"ベルギー":8,"ドイツ":14,
  "クロアチア":10,"イタリア":9,"コロンビア":11,"セネガル":16,"メキシコ":15,
  "アメリカ":11,"ウルグアイ":20,"日本":18,"スイス":17,"デンマーク":21,
  "イラン":22,"トルコ":23,"エクアドル":24,"オーストリア":25,"韓国":26,
  "ナイジェリア":27,"オーストラリア":28,"カナダ":29,"ノルウェー":30,
  "ウクライナ":23,"パナマ":33,"コートジボワール":34,"スコットランド":38,
  "チュニジア":40,"パラグアイ":42,"スウェーデン":44,"ガーナ":72,
  "ニュージーランド":90,"ハイチ":83,"キュラソー":85,"ヨルダン":87,
  "ボスニア":51,"カタール":60,"南アフリカ":61,"チェコ":37,"サウジアラビア":56,
  "カボベルデ":70,"イラク":65,"コンゴ":78,"ウズベキスタン":75
};

// W杯2026 グループ表（A〜L 12グループ・48チーム）
const WC_GROUPS=[
  {name:"A",teams:[{n:"アメリカ",f:"us"},{n:"ウルグアイ",f:"uy"},{n:"パナマ",f:"pa"},{n:"ボリビア",f:"bo"}]},
  {name:"B",teams:[{n:"アルゼンチン",f:"ar"},{n:"チリ",f:"cl"},{n:"ペルー",f:"pe"},{n:"カナダ",f:"ca"}]},
  {name:"C",teams:[{n:"メキシコ",f:"mx"},{n:"エクアドル",f:"ec"},{n:"ベネズエラ",f:"ve"},{n:"ジャマイカ",f:"jm"}]},
  {name:"D",teams:[{n:"ブラジル",f:"br"},{n:"パラグアイ",f:"py"},{n:"コスタリカ",f:"cr"},{n:"コロンビア",f:"co"}]},
  {name:"E",teams:[{n:"スペイン",f:"es"},{n:"トルコ",f:"tr"},{n:"モロッコ",f:"ma"},{n:"コートジボワール",f:"ci"}]},
  {name:"F",teams:[{n:"日本",f:"jp"},{n:"オランダ",f:"nl"},{n:"チュニジア",f:"tn"},{n:"スウェーデン",f:"se"}]},
  {name:"G",teams:[{n:"イングランド",f:"gb-eng"},{n:"フランス",f:"fr"},{n:"セネガル",f:"sn"},{n:"ジンバブエ",f:"zw"}]},
  {name:"H",teams:[{n:"ドイツ",f:"de"},{n:"ポルトガル",f:"pt"},{n:"スコットランド",f:"gb-sct"},{n:"ギニア",f:"gn"}]},
  {name:"I",teams:[{n:"イタリア",f:"it"},{n:"ベルギー",f:"be"},{n:"デンマーク",f:"dk"},{n:"オーストラリア",f:"au"}]},
  {name:"J",teams:[{n:"クロアチア",f:"hr"},{n:"ウクライナ",f:"ua"},{n:"チェコ",f:"cz"},{n:"ナイジェリア",f:"ng"}]},
  {name:"K",teams:[{n:"韓国",f:"kr"},{n:"サウジアラビア",f:"sa"},{n:"イラク",f:"iq"},{n:"ノルウェー",f:"no"}]},
  {name:"L",teams:[{n:"イラン",f:"ir"},{n:"ウズベキスタン",f:"uz"},{n:"カタール",f:"qa"},{n:"コンゴ",f:"cd"}]},
];

// ════════════════════════════════════════════════════
// 試合別予想 Phase A ― 採点定数・採点関数・試合マスタ
// ════════════════════════════════════════════════════
const SCORING={outcome:3,exact:2};

// ── spec-09: 日本代表得点者予想 ──────────────────────────────
const JAPAN_SQUAD=[
  {id:"mitoma",  name:"三笘 薫",   number:9,  pos:"MF"},
  {id:"kubo",    name:"久保建英",  number:20, pos:"MF"},
  {id:"ueda",    name:"上田綺世",  number:11, pos:"FW"},
  {id:"ito",     name:"伊東純也",  number:14, pos:"MF"},
  {id:"kamada",  name:"鎌田大地",  number:15, pos:"MF"},
  {id:"asano",   name:"浅野拓磨",  number:18, pos:"FW"},
  {id:"tanaka",  name:"田中 碧",   number:17, pos:"MF"},
  {id:"morita",  name:"守田英正",  number:6,  pos:"MF"},
  {id:"nishino", name:"中村敬斗",  number:21, pos:"FW"},
  {id:"nakamura",name:"前田大然",  number:16, pos:"FW"},
  {id:"maeda",   name:"古橋亨梧",  number:13, pos:"FW"},
  {id:"sugawara",name:"菅原由勢",  number:2,  pos:"DF"},
  {id:"none",    name:"誰も決めない",number:0,pos:"―"},
];
const SCORER_BONUS=5;

// ── spec-08: バッジ定義 ──────────────────────────────────────
const BADGES=[
  {id:"first_pred",icon:"🎯",name:"予想デビュー",desc:"初めての予想を入れた"},
  {id:"first_hit",icon:"✨",name:"ファースト的中",desc:"初めて予想を当てた"},
  {id:"predict_5",icon:"📝",name:"予想5試合",desc:"5試合分の予想を入れた"},
  {id:"predict_20",icon:"📚",name:"予想20試合",desc:"20試合分の予想を入れた"},
  {id:"predict_all_group",icon:"🌍",name:"グループ完全予想",desc:"全グループステージ72試合を予想"},
  {id:"streak_3",icon:"🔥",name:"3連的中",desc:"連続で3試合当てた"},
  {id:"streak_5",icon:"🔥🔥",name:"5連的中",desc:"連続で5試合当てた"},
  {id:"streak_10",icon:"🔥🔥🔥",name:"10連的中",desc:"連続で10試合当てた"},
  {id:"pts_10",icon:"⭐",name:"10pt達成",desc:"累計10ポイント獲得"},
  {id:"pts_50",icon:"🌟",name:"50pt達成",desc:"累計50ポイント獲得"},
  {id:"pts_100",icon:"💫",name:"100pt達成",desc:"累計100ポイント獲得"},
  {id:"rank_1st",icon:"👑",name:"1位獲得",desc:"ランキング1位になった"},
  {id:"rank_top3",icon:"🥉",name:"TOP3",desc:"ランキング3位以内に入った"},
  {id:"japan_hit",icon:"🇯🇵",name:"日本戦的中",desc:"日本戦の予想を当てた"},
  {id:"shared_card",icon:"📷",name:"予想シェア",desc:"予想カードをシェアした"},
  {id:"reaction_giver",icon:"👍",name:"反応職人",desc:"10回リアクションを送った"},
];

function updateStreak(participant,matchId,isHit){
  const s=participant.streak||{current:0,best:0};
  if(s.lastUpdatedMatchId===matchId) return s;
  const nc=isHit?s.current+1:0;
  return{current:nc,best:Math.max(s.best||0,nc),lastUpdatedMatchId:matchId};
}

function checkBadges(participant,ctx={}){
  const earned=new Set((participant.badges||[]).map(b=>b.id));
  const newly=[];
  const now=new Date().toISOString();
  const predCount=Object.keys(participant.matchPredictions||{}).length;
  const totalPts=participant.totalMatchPoints||0;
  const streak=participant.streak||{current:0,best:0};
  const reactionsGiven=parseInt(localStorage.getItem("wcup_reactionsGiven")||"0");
  function award(id){if(!earned.has(id)){newly.push({id,earnedAt:now});earned.add(id);}}
  if(predCount>=1) award("first_pred");
  if(predCount>=5) award("predict_5");
  if(predCount>=20) award("predict_20");
  if(predCount>=72) award("predict_all_group");
  if(ctx.isHit) award("first_hit");
  if(streak.current>=3) award("streak_3");
  if(streak.current>=5) award("streak_5");
  if(streak.current>=10) award("streak_10");
  if(totalPts>=10) award("pts_10");
  if(totalPts>=50) award("pts_50");
  if(totalPts>=100) award("pts_100");
  if(ctx.rank===1) award("rank_1st");
  if(ctx.rank&&ctx.rank<=3) award("rank_top3");
  if(ctx.isJapanMatch&&ctx.isHit) award("japan_hit");
  if(ctx.didShareCard) award("shared_card");
  if(reactionsGiven>=10) award("reaction_giver");
  return newly;
}

// ── spec-10: バーチャルコイン ────────────────────────────────
const COIN_INIT={balance:1000,totalEarned:1000,totalLost:0,transactions:[]};
function getCoins(p){return p?.coins||{...COIN_INIT};}
function calculateOdds(participants,matchId,pick){
  const counts={home:0,draw:0,away:0};
  (participants||[]).forEach(p=>{const pr=p.matchPredictions?.[matchId];if(pr?.pick)counts[pr.pick]++;});
  const total=counts.home+counts.draw+counts.away;
  if(total===0)return 2.0;
  const pop=counts[pick]/total;
  return Math.max(1.2,Math.min(5.0,parseFloat((1/(pop+0.1)).toFixed(2))));
}
function settleBet(participant,matchId,isHit){
  const pred=participant.matchPredictions?.[matchId];
  if(!pred||!pred.betAmount||pred.betAmount<=0)return participant;
  if(pred.payout!=null)return participant; // already settled
  const odds=pred.odds||2.0;
  const payout=isHit?Math.floor(pred.betAmount*odds):0;
  const c=getCoins(participant);
  return{...participant,
    coins:{...c,balance:c.balance+payout,
      totalEarned:c.totalEarned+payout,
      totalLost:isHit?c.totalLost:c.totalLost+pred.betAmount,
      transactions:[{matchId,type:isHit?"win":"lose",amount:isHit?payout:pred.betAmount,at:new Date().toISOString()},...(c.transactions||[])].slice(0,20)},
    matchPredictions:{...participant.matchPredictions,[matchId]:{...pred,payout}},
  };
}

function scoreMatch(prediction,match,extras={}){
  if(!prediction||match.status!=="finished")return null;
  if(match.homeScore===null||match.awayScore===null)return null;
  const actual=match.homeScore>match.awayScore?"home":match.homeScore<match.awayScore?"away":"draw";
  let pts=0;
  if(prediction.pick===actual){
    pts+=SCORING.outcome;
    if(prediction.homeScore!=null&&prediction.awayScore!=null&&
       prediction.homeScore===match.homeScore&&prediction.awayScore===match.awayScore)pts+=SCORING.exact;
  }
  // 日本得点者ボーナス
  if(prediction.japanScorer&&prediction.japanScorer!=="none"&&Array.isArray(extras.japanScorers)&&extras.japanScorers.includes(prediction.japanScorer)){
    pts+=SCORER_BONUS;
  }
  return pts;
}
const MATCHES=(()=>{
  const ms=[];
  const base=new Date(Date.UTC(2026,5,11)); // June 11, 2026 UTC
  const fmtKo=(d)=>{const r=new Date(base.getTime()+d*86400000);return r.toISOString().slice(0,10)+"T19:00:00+09:00";};
  // グループステージ: 12グループ × 6試合 = 72試合
  // 各グループ: MD1→gi%6日目, MD2→(gi%6)+7日目, MD3→(gi%6)+14日目（June 11〜June 30）
  WC_GROUPS.forEach((g,gi)=>{
    const [t0,t1,t2,t3]=g.teams.map(t=>t.n);
    const id=`g${g.name}`;
    const d1=gi%6,d2=(gi%6)+7,d3=(gi%6)+14;
    ms.push(
      {id:`${id}-1`,stage:"group",group:g.name,home:t0,away:t1,kickoff:fmtKo(d1),homeScore:null,awayScore:null,status:"scheduled"},
      {id:`${id}-2`,stage:"group",group:g.name,home:t2,away:t3,kickoff:fmtKo(d1),homeScore:null,awayScore:null,status:"scheduled"},
      {id:`${id}-3`,stage:"group",group:g.name,home:t0,away:t2,kickoff:fmtKo(d2),homeScore:null,awayScore:null,status:"scheduled"},
      {id:`${id}-4`,stage:"group",group:g.name,home:t1,away:t3,kickoff:fmtKo(d2),homeScore:null,awayScore:null,status:"scheduled"},
      {id:`${id}-5`,stage:"group",group:g.name,home:t0,away:t3,kickoff:fmtKo(d3),homeScore:null,awayScore:null,status:"scheduled"},
      {id:`${id}-6`,stage:"group",group:g.name,home:t1,away:t2,kickoff:fmtKo(d3),homeScore:null,awayScore:null,status:"scheduled"},
    );
  });
  // 決勝トーナメント（BRACKET_DATAから生成）
  const toKo=(dateStr)=>{const[mo,dy]=dateStr.split("/");return`2026-${mo.padStart(2,"0")}-${dy.padStart(2,"0")}T19:00:00+09:00`;};
  [
    ...BRACKET_DATA.r32.map(m=>({...m,stage:"r32"})),
    ...BRACKET_DATA.r16.map(m=>({...m,stage:"r16"})),
    ...BRACKET_DATA.qf.map(m=>({...m,stage:"qf"})),
    ...BRACKET_DATA.sf.map(m=>({...m,stage:"sf"})),
    {...BRACKET_DATA.third,stage:"third"},
    {...BRACKET_DATA.final,stage:"final"},
  ].forEach(m=>ms.push({id:m.id,stage:m.stage,home:m.home,away:m.away,kickoff:toKo(m.date),homeScore:null,awayScore:null,status:"scheduled"}));
  return ms;
})();

async function fetchMatches(dateStr){
  try{
    const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}&limit=50`);
    const d=await r.json();return d.events||[];
  }catch{return[];}
}
async function fetchMatchRange(){
  const dates=[];const start=new Date("2026-06-11");
  for(let i=0;i<32;i++){const d=new Date(start);d.setDate(start.getDate()+i);dates.push(d.toISOString().slice(0,10).replace(/-/g,""));}
  const all=await Promise.all(dates.map(d=>fetchMatches(d)));return all.flat();
}
async function fetchStandings(){
  try{
    const r=await fetch("https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings");
    const d=await r.json();return d.children||[];
  }catch{return[];}
}

// ── spec-07: ライブスコア自動反映 ──────────────────────────────

// ESPN イベント配列 → [{matchId, homeScore, awayScore}]
function parseEspnResults(events){
  const results=[];
  for(const ev of (events||[])){
    try{
      if(!ev?.status?.type?.completed) continue;
      const comp=ev.competitions?.[0];
      if(!comp?.competitors?.length) continue;
      const homeC=comp.competitors.find(c=>c.homeAway==="home");
      const awayC=comp.competitors.find(c=>c.homeAway==="away");
      if(!homeC||!awayC) continue;
      const homeJp=ESPN_TO_JP[homeC.team?.displayName];
      const awayJp=ESPN_TO_JP[awayC.team?.displayName];
      if(!homeJp||!awayJp){
        console.warn("[ESPN] unknown teams:",homeC.team?.displayName,"vs",awayC.team?.displayName);
        continue;
      }
      const match=MATCHES.find(m=>m.home===homeJp&&m.away===awayJp);
      if(!match){
        console.warn("[ESPN] no MATCHES entry for",homeJp,"vs",awayJp);
        continue;
      }
      const hs=Number(homeC.score);
      const as_=Number(awayC.score);
      if(isNaN(hs)||isNaN(as_)) continue;
      results.push({matchId:match.id,homeScore:hs,awayScore:as_});
    }catch(e){console.warn("[ESPN] parseEspnResults:",e);}
  }
  return results;
}

// レート制限付き ESPN 取得
// opts: { force:bool, update:fn }
// 戻り値: 反映件数 (>=0) | -1(失敗)
async function fetchAndApplyResults(tourn,opts={}){
  if(!tourn?.id) return 0;
  const lastFetch=parseInt(localStorage.getItem("wcup_lastApiFetch")||"0");
  const now=Date.now();
  if(!opts.force&&now-lastFetch<60_000) return 0;
  try{
    const res=await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard");
    if(!res.ok) throw new Error("status "+res.status);
    const data=await res.json();
    localStorage.setItem("wcup_lastApiFetch",String(now));
    const updates=parseEspnResults(data.events||[]);
    if(updates.length===0) return 0;
    return await applyMatchResults(tourn,updates,opts.update);
  }catch(err){
    console.warn("[ESPN] fetch failed (manual fallback):",err.message);
    return -1;
  }
}

// 取得結果を採点・保存・チャット投稿
// 手動入力済みの試合はスキップ
async function applyMatchResults(tourn,updates,updateFn){
  const fresh=await loadT(tourn.id);
  const cur=fresh||tourn;
  const existing=cur.results?.matchResults||{};
  const newResults={...existing};
  const toApply=[];
  for(const u of updates){
    if(newResults[u.matchId]) continue; // 既存は触らない
    newResults[u.matchId]={homeScore:u.homeScore,awayScore:u.awayScore,status:"finished",source:"espn-auto"};
    toApply.push(u);
  }
  if(toApply.length===0) return 0;
  // 全参加者を再採点
  const scored=cur.participants.map(p=>{
    const newPreds={...(p.matchPredictions||{})};
    for(const u of toApply){
      const pred=newPreds[u.matchId];
      if(!pred||pred.points!=null) continue;
      const actual=u.homeScore>u.awayScore?"home":u.homeScore<u.awayScore?"away":"draw";
      newPreds[u.matchId]={...pred,points:pred.pick===actual?SCORING.outcome:0};
    }
    const total=Object.values(newPreds).reduce((s,mp)=>s+(mp?.points||0),0);
    return{...p,matchPredictions:newPreds,totalMatchPoints:total};
  });
  // ストリーク + バッジ更新
  const sortedForRank=[...scored].sort((a,b)=>(b.totalMatchPoints||0)-(a.totalMatchPoints||0));
  const updatedParticipants=scored.map(p=>{
    try{
      let cur2=p;
      for(const u of toApply){
        const pred=(cur2.matchPredictions||{})[u.matchId];
        if(!pred||pred.points==null) continue;
        const isHit=pred.points>0;
        const match=MATCHES.find(m=>m.id===u.matchId);
        const isJapanMatch=!!(match&&(match.home==="日本"||match.away==="日本"));
        const ns=updateStreak(cur2,u.matchId,isHit);
        const rank=sortedForRank.findIndex(x=>x.id===p.id)+1;
        const withS={...cur2,streak:ns};
        const nb=checkBadges(withS,{isHit,isJapanMatch,rank});
        if(nb.length>0){
          cur2={...withS,badges:[...(cur2.badges||[]),...nb]};
          nb.forEach(badge=>{const bd=BADGES.find(b=>b.id===badge.id);if(bd)postSystemMessage(cur.id,`🏆 [${p.nickname}] さんが「${bd.icon} ${bd.name}」バッジを獲得！`).catch(()=>{});});
        }else{cur2={...cur2,streak:ns};}
        // コイン精算
        try{cur2=settleBet(cur2,u.matchId,isHit);}catch{}
      }
      return cur2;
    }catch{return p;}
  });
  const updatedTourn={...cur,participants:updatedParticipants,results:{...(cur.results||{}),matchResults:newResults}};
  if(updateFn) await updateFn(updatedTourn); else await saveT(updatedTourn);
  // チャットにシステム投稿（重複チェックはpostSystemMessage側で任意）
  for(const u of toApply){
    try{
      const match=MATCHES.find(m=>m.id===u.matchId);
      const hits=updatedParticipants.filter(p=>(p.matchPredictions?.[u.matchId]?.points||0)>0).map(p=>p.nickname);
      const misses=updatedParticipants.filter(p=>{const pp=p.matchPredictions?.[u.matchId];return pp&&pp.points===0;}).map(p=>p.nickname);
      const resultLine=`${match?.home||"?"} ${u.homeScore}-${u.awayScore} ${match?.away||"?"}`;
      const hitLine=hits.length>0?`🎯 的中した人: ${hits.join(", ")} (+${SCORING.outcome}pt)`:`🎯 的中者なし`;
      const missLine=misses.length>0?`😢 外した人: ${misses.join(", ")}`:"";
      const body=[`⚽ 試合結果が出ました！(${u.matchId})`,resultLine,hitLine,missLine].filter(Boolean).join("\n");
      if(db){
        const{data:dup}=await db.from("messages").select("id").eq("tournament_id",cur.id).eq("type","system").ilike("body",`%${u.matchId}%`).limit(1);
        if(!dup||dup.length===0) await postSystemMessage(cur.id,body);
      }
    }catch{}
  }
  return toApply.length;
}

const ESPN_TO_JP={"Japan":"日本","Brazil":"ブラジル","Argentina":"アルゼンチン","France":"フランス","England":"イングランド","Spain":"スペイン","Germany":"ドイツ","Portugal":"ポルトガル","Netherlands":"オランダ","Italy":"イタリア","Croatia":"クロアチア","Belgium":"ベルギー","United States":"アメリカ","Mexico":"メキシコ","Canada":"カナダ","Korea Republic":"韓国","Australia":"オーストラリア","Morocco":"モロッコ","Uruguay":"ウルグアイ","Colombia":"コロンビア","Senegal":"セネガル","Norway":"ノルウェー","Sweden":"スウェーデン","Ecuador":"エクアドル","Switzerland":"スイス","Denmark":"デンマーク","Ghana":"ガーナ","Panama":"パナマ","Paraguay":"パラグアイ","Austria":"オーストリア","Algeria":"アルジェリア","Jordan":"ヨルダン","Tunisia":"チュニジア","Egypt":"エジプト","Iran":"イラン","Saudi Arabia":"サウジアラビア","Scotland":"スコットランド","Turkey":"トルコ","Ivory Coast":"コートジボワール","Cote D'Ivoire":"コートジボワール","New Zealand":"ニュージーランド","Serbia":"セルビア","Qatar":"カタール","South Africa":"南アフリカ","Czechia":"チェコ","Bosnia and Herzegovina":"ボスニア","Haiti":"ハイチ","Curacao":"キュラソー","Congo DR":"コンゴ","Uzbekistan":"ウズベキスタン","Iraq":"イラク","Cape Verde":"カボベルデ","Cabo Verde":"カボベルデ"};

const LOGO_IMG="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/2wBDAQoKCg0MDRoPDxo3JR8lNzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzf/wAARCADIAMgDASIAAhEBAxEB/8QAHAAAAgIDAQEAAAAAAAAAAAAAAQIABgMFBwgE/8QARhAAAQMDAQUEBwQHBgUFAAAAAQACAwQFEQYHEiExQVFhcYETFCIyQpGhI2KxwRUWUlNygpIkM0Nj0eEXJTTC8FSTotLx/8QAGgEAAgMBAQAAAAAAAAAAAAAAAQIAAwQFBv/EACwRAAICAQMDAQcFAQAAAAAAAAABAhEDEiExBEFREyJhcZGhsfAyQoHR4cH/2gAMAwEAAhEDEQA/AKHnAUKiCiPPESlFKU6GQjisbk7khTodCFY3J3JHKxFiEKQlOUhTFqFKUolKURkDKUpilKI6BlAqIFEYhQUURCBBEoFQIEEUFAkQRQUCRRRRAhZ1MqZSlc9HIISlJRJS5ToKQDyWNyyOHDuWMp0x0I4rE4rK8cB3rGU6ZahCkKYlfZTWmuqofTshLKcc55nCOP8AqdgHyRc4xVydFkYuXCNeUpX2TQUsPB1WJndkDCW/1Ox9AvlfuZ9gOA7zlGMk+B3GuTGUCiUpThQCgigmGIgoVCoECCKCIQIIoKBIgigoEiiiiBCypSjlKVzUclEJQJQUViGC12DxGR1CyOpnboez2mHkezuKxsYXHm3zKsenKUyVAjeYnRv4PY6QDI/1VeXL6a1GnBi1vSV6amcI4zjmD+K+q0adrrsXOha2OBn95USndYwdePVdbqdEWunooayunAo42lxbnBfniBn/AE5rnup7rW3mdltt0Iiow7cgo4CC556ZDeZ7uX4rPDqsmR6YKve/zc2S6aGP2pb+5GunrLNZT6O1QMuVYOdZUtzG0/cZ18T9Vo6+urLlOJa2oknk5DeOcdwHIeAV1l0D+gLG+96tm9CB7MFuhePSTPPJrncmjqcZOAVvNjWjG1tR+styhHoI3n1KIjgXg8X8ejeQ78notmOEIe1y/L/PsI9c2o8LwaGz7I9TXJjJallPb43AEesPy/H8Lc48DhWmk2GwBoNdfZnO6iCnDR8ySuvqJnkkXLFFHLv+CFi3eNzuee3Mf/1XxVewukc0+p32oYegmp2vH0IXXlFNcvIdEfB54vGxrUtE1z6F9JcGDjuxP3H/ACdw+q51LHJDK+KVjmSMcWuY4YLSOBBHQr2YuP7bdDtngk1Na4sSxj+3RtHvt/eeI693HorIZXdMSWNVaOIKFdH0hpSz69sssVJILZqCiaN8N4w1DOjy3oehLevHHFUzUWnrppuvNFd6V0MvNjubJB2td1H/AIVcppuhHFrc1SCKiYAqCZBQIFFFFCAUUUUCWLKBKmUpXMRyyEpVCUCVYhkQHBV40Pa42xPvd2d6K3U2SN7/ABSPyz8zwVc0rZJtQXqGhiyGH25nj4GDmfHoO8hbjaBfYpqplltWGW2g9jDOT3jh5gcvHJWbqHLJJYYd+X4X9s29Olji8sv497N7Ualueq7pDQW+n9JHPvNbTE4DWA+849MDjnpyX3C/aV2eRyMtrBeL27LZahpAYw/s7/Qdzck9VStMUl9vcT7Rp2Exib/ragHdy3oHv6N+6OZ7enWtJbMLNY2snr2i41wwd+Vv2bD91n5nJ8FZiwwxcFyyTybnHtZ6hv8Aqb1avvED4aMFzaUMhcyLJxndJ948Bxyu37NtT2zUFggioImUs1HG2KWjB/usDAI7WnHA/Pit9erPQ3y2S264wNlppBjd5Fp6Fp6EdCvP17tN72Y6nhq6SUuiyTT1GPYnZ1Y8dvaPMLRtJUSnjdvc9IKLRaO1RQ6rtDK6iO7IPZngJy6F/Ye7sPULepC/kiimQplQhFX9bamtul7JLV3INl9IDHFTcMzuI93w7T0C+rVGoKDTNoluVykxGzgxjfelf0a0dp/3Xn6KG/7VtWukcdyNvvO4mKjizwA7T9XHu5PGN7vgWUq2RpNNV96tl1lvWnaaUOpsmQRQuljjY74Xfd8ezK6XR7RtN62t/wChtbUTKNz/AHKlhzG13RwdzjPjkdpXUNM6ft+mbVHbrXFuRt4veffld1c49T/+Kv6w2aWHUofM2IUFe7iKmnaAHH77eTvoe9M5xb3FUWkcG1ppWq0rcxBK9tRRzj0lJVs9ydnbw6jhkfkVX1dNTWnUOkKKSx3uH1q0TO3qaUEujZIOTo3c2O55aeYJ4dVSlfF2iqSpkQRUTAFURQUCRRRRQJvygUSlK5iOYhSlKYrPa6M3G50tG3P28rWEjoCeJ+WU+pRVssjFyaSL5bHt0ds6luLTu3W8HcgPVjMHB8hl3iWqv7P9Hz6uub4zIYaKnw6omAy7B5Nb944PhzWXaXdRW31tFCQKa3xiFjRyDuBd+Q8l1zZPZhaNG0r3sxPW/wBpk4ccO90f0gfMqrpk3D1HzLf+vob5QUsmjtEs1ntVDZaCOhtlOyCnj5NbzJ6knqe8r7glTBXmiiL4L7Z6C+2ua33SES08g49Cw9HA9CO1feqjtUvpsWjax8T92pqh6tDjmC7mfJu8VEB0lucBoL1W6WvdXNpu4vDQ58LZiwYmjBOCWnI7+5fbNtG1jKTvX2ob/AxjfwaqvjsQKvpGLW1wWA681bnP6w1//uD/AEWWLaNrGE5bfqk/xtY78WqslKU2lDKcvJuL/qW7anqaZ9/uD5WwjcaRGAI2k+04NGAT+OAF6a0lYrZp6yQUdnaDAWh5m5umJHvk9SV5MK9G7Fb6bvo2OllfvVFtd6u7J4lnNh+XD+VJkW2xdidvcvxSlEpSqS4+a4UNJc6OWjuFPHUU0rd18UgyHD/zqvOm0/QbtIVkdRSSOltdU8iEu96J3PccevDkeuD2L0llVzaJZRqDRtyog3enbGZoO0SM9oY8eI808JaWLKNo8sIKA5HiotRnAoigoEBUUKihDfFKSnKxlcxHNQpKsOhAxl7dVy+5SU8kxPlj8yq8Vt7PL6vZr3KPedCyIfzO4pM6vE4+dvnsaumpZU/G/wAtzUzTetVb56ku+1kL5COJ4nJx816stlRSVNupZrc9r6R8TTC5nIsxwXm3Qthi1JqKO2TvdHG+GVxe3m0hhwfnjgrfofUtZoS9zaZ1NmOiMnsSH3YXHk8H927n3c+1aVxSLsEmt33O2hOFjY4OaHNIIIyCDzThQ1hXCNvN5NXqCltMbsx0MW/IP8x/H6NA+a6zqPWNh020i6V8bZsZFPH7crv5Ry88BeZ9QXJ95vlfcpMg1U7pAD8IJ4DyGAmitynNKo0a9AooFWoyilAolApgoUroWw+9fo3WPqMjsQ3KIxYJ4ekb7TP+4ea56Vnt1ZLbrhS11OcS00zJWHvaQfyQatUWRdOz2ESkKr2mtcaf1MGtt1cxtSeJpZvYlHgD73llWByzmsBKSWeKmhknqJGxwxNL5HuOA1o4knuwiuMbR9V1WrbrHo/SmZ4nybk8rDwncOmf3bcZJ647BxKVgbo5Rc3U77lVuot71V07zDvDB3C47vDwwvmVk1/pxmlr+LZFK6UNpYpDIfjcW+0R2DIOAq7unc3umcLSnsZ2nYqCKCYgCoiVFCG9PJIU5SOXMRzkKV9kEm7Z65mfflh+m8V8ZRbJiCWP9otPyz/qmatfL7l2N07+P2LvsTx+uxzzFFLj5tXT9oGjqfVlt9jciuUAJppzyP3HfdP0PHtXI9ktUKbXlAHHAnZLD5lhI+oC9CNKtNuBJ46ZxXRe0Kr0f6exaopql8VLlsQABlhcP8PieLT0OeHhyFx15rDWlS+h0vRzUsB4EU3GTH35eAb5Y8Va9sOlYLpY5b1TRYr6Fm88tH97COYPe3mD3EL7tkGo6W8abbRNihgrKEBk0cTAwPHwyADtxx7we1EiUr0NlY07sYklcKnU1eQ5x3nU9Md5xP3pD+Q81U9qukotLX2P1CNzLdVR70AJLtxzcBzcnieh/mXpBVTaZpz9ZNK1METN6sp/t6btL2ji3zGR8lE9xpYlp2PMiBRX3WK1VF8vNJbKQfa1MgYDj3R1ce4DJ8lbZkS3NpDo6um0PPqgA+ijqAwR496Lk6TwDsD5lVkr11TWehp7GyzMhBoW0/q/oz8TMYOfFeW9V2ObTmoKy1T5Igf9m8/HGeLXeY+uUIysvnj0pNGnKtuzHS7dU6mjgqmF1BTtM1VgkZbya3I7T9AVUivSGyXTn6v6UiknZu1tfiomyOLQR7DfIcfElGTpExxtlV1LsWjJdPpqvMbhxbTVZyM/dkHEeY81paPWetdB1DKLUlJNVUg4NbVHJI/y5hnPgc+S7u4qm7UdRU1g0vM2WOGeprMw08ErA9pdji8tPAho4+OAkUm9mXOKW6KHrPafPqSkgs2lKarikrQGTuI+1JPD0TMHr1d+HFXbZvoiHSVAZakMku1Q0CeRvERt/dtPZ2nqe4BaPYvpWChs7NQ1UW9XVe8KcuH91FnGR3uwePZjtK6XlCTrZBim92cG28EfrrDjn+j4s/1PVDDP+VmTtqA0f0kq2bY6sVevq5oORTxxQeYYCfq4qu1UfodP0ORxnnlk8gGtH4FM3SivL/0St5M1aiiivKgKKFRQJvSkKcpCuYjnIQpSmKUqxDo+m0V7rXd6K4M96lnZL4gHJ+mV6kimZMxksLg6ORocwjq0jIPyXk9y7tsjvwuumW0Ur81NuIicCeJjPuH8W+Sc2dNL9pfnsjmifFM0PjkaWvaerSMEfJecaKsq9nuu5vR7zhRzuhlj/fQk8vNuCO/C9GMcuM7dLR6G7UN4ib7FXH6GUj9tnL5tP/xTIuzJ1qXY7XQVtPcKKCspJBLTzxiSN4+JpGQvpyuL7ENV+jkfpqtk9l5MlEXHkebmefvDzXZN5AeEtSs857XNN/oDVUssDN2jr8zw4HBrs+23yJz4OCuOwjTfooKjUVUz2pcwUuR8IPtuHiRjyKum0LSzdW2L1Nj2R1UUrZIJXcmnOHeRaT5gLe2yip7Xb6ago2blPTxtjjHcB+KN7CLHU7PrJXLNumm/XrRFfaZmZ6H2J8Di6Enn/K4/IldOMrBII99vpC0uDc8SAcE47OI+axVUMVXTS01SwSQzMLJGHk5pGCPkonTLJK1R5s2Z6c/WTVVPDMzeo6b+0VOeRa08G/zHA8Mr0s4qq6A0jFpC31UIkbLPUVDnulH7sEiNvy4nvJVmLkZO2LCOlAnmjghkmne2OKNpe97jgNaBkk+S826ou9VtA1rEyn3hDNM2looz8EZdjePeeLj/ALK+bbdV+r0rdOUUmJZ2iSsc0+7H8LP5uZ7gO1VzYhafW9SVF0kbmO3w+wf81+Wj5N3ymiqVgk7ek7hTQQ0dLDSUzd2CCNsUY7GtGB+CkkzIWPlmcGxsaXPcejQMk/JBzlRtrl+Fp0rJSRPxU3EmBoHMR83n5YH8yRK2O3SOH3iukvN7rK7BMlZUPkA/idwH4BbHWDG0tTRW5nKjpWsd/EeJWbQdr9evHrUwxT0TfSvJ5Z+H8z5LTXesNwulVVnlLIXN7m9PphLq19RpXEV9Xx9Ba04rff8A4fEoigtZQBRRRQJvSkKdyQrmo5yFKQpylKdDoxlbrRmoZNM36GvbvOgP2dTGPjjPPzHMd4WmKUhWIsjJp2j1TS1MNVTxVFNI2WGVgfG9p4OaeIIVf2l2sXjRdwjABlpm+tRE9Czifm3eC5xsv1sLRI2zXaXFBI77CVx4QPPQ/dJ+R48iV9u0rVdRfK9ultPb07HSBk5h4meTPuD7o6nkSOwIm71IyhZzGmqJqWoiqaaR0c0Lw+N7ebXA5BXpvRepIdT2CnuMe62b3KiMf4co5jwPMdxXDdVbPrvpuhirZTHVU5YPTvgBIgeeju7sdy8E+y/VP6uX8RVUm7b60iKfJ4Md8L/InB7iexEqxtwlUj0XvIb3fjxWLeVJ2s6kNk0y+mp5N2suGYY8Hi1nxu+Rx4uQNLdKygXHaG8bTWXuGRzrbTn1QNHx0+cOPiT7XkF3VkrZGNfG8PY4BzXN5OB4gheRV3bY5qP9J6fdaqh+aq24a3J4uhPu/I5b8kzRVjnbpnQ3OWp1LfafT1lqrnVYLYW+xHnjI8+60eJ+mVsN7JXBtrmqf03ev0bSSb1DQOLctPCSXk53gPdHn2oJWyyUtKspVyrqm6XCor62T0lRUSGSR3aT+XQdwXedk9rFr0VSyuA9NXuNU89x9lg/pGfNcn0foW56pjlqIXMpaNgIFTMDuvf0a0Die88h48FYtnupavSt3k0xqIOggMu6wyH/AKeQ9/7Du3lxB6lPLdUirHs7Z2GeaOGJ800jY4o2lz3uOA1o4klectbagl1ZqR9RC15gBENHFjjuZ4cO1xOfPHRWvarrdtcZLDaJc0zXYq5mnhK4fAD+yDzPU9w45Nm+lordQv1ZfsQwxRmSmEg91v7wjtPJo789ipy5VghrfPZeWWpPJLSj5L7C3R+i47WCP0jcM+mI6ft+QGGjxK5wtxqm+S6hvM1dICyM+xDGf8OMch49T3krUI9Jiljhc/1Pd/nuEzTUpVHhcAURKC1FIFESooE3juCQrI4JCuajnIxlKsiUhOmOjGUuE5Sp0xkIQrds11JbdN3eSS50oLZ2iNtW0EugHXh2Hrjjw8lUylITlkJOLtHqenqKetpWzQSRVFNMz2XNIex7T9CFybaBs0NOJbppqEug4umoW8XR9pj7W/d5jpkcqTpvVN301MX22o+xccvp5Pajf4joe8YK6rp/apZq8NjuYfbKnh7TsuiJ7nDiPMeahr1wyKmarSO1GgodMxU97NTLXUv2bBGzeMzAPZJceAI5HPYFUtQVF82h351bbbVVyQMYIoI2N3mxNHPLuDckkk/7K6aMstuver9RX2Slp6mjjq3RUjdwOjLjxL8cjwAx/ESuk7+GBg4NbyaOAHgEQqLkqbOFt2T6nNL6ZwoWy/8ApzUjf+eN3yyvgtLL/s/v0Nyr7VVRRMyyVrm4ZKw8wHjLewjvAXoIuSb5wQDwPMdD4hSw+klujml/2rW6o03OLOKmG5zD0bWys/ugeb94HBwOXeQq/s/2dS3n0VzvjXwW0+1HDkiSpH/azv5np2rf7TNPUFFWWi+wUVPFC2tjjrGMiDWSNLgQ4jl0IPiFttR7TrFbHSR0T3XKoBIDYOEY8Xnhjwyj8CNb+0XEer0VIGMbFTUtPHgNGGMjYPoAuG7U9TWrUFwgZa4GyGmy11dyMo/ZA6tHPJ8uHPWai1XfNW1DaeZzhC532dFTA7pPeObj3n6Ld2PS9usULbtq2WMbvGOlJ3hnvHxHuHDtVWXNDCrlz2XdjxTy7R48j7OtCMrt296ha2K1xD0jIpTuiYDjvOzyYPr4L5dpeuP1iqBb7YSy0wO4EDHp3Dk4jo0dB59mPj1lres1CPVIA6mtrTwhB9qXHIvI+g5DvVSSYcM5z9XNz2Xj/Rck4xWjH8/IFEUFtM4FEUEQgKiKiJDelI4LKQsZC5aZzUzGUpTlAp0WIxlKU5CUhOhkKQlITlKQnTGQpSkJlCmQw1LVVNHJ6SjqZoJB8UUhYfot/S691TSgBl4mkA6TNbJ+Iyq4QgiOptcMt/8AxO1VjHrdMe/1Vi+Sp2gaqqAQbtJGD+5jYz6gZVaWWOd0WCxkWR1dGHfjlT4DrJJ8szufdr5UAOfW3CboC50p/PC2sGlW0wEuornTW2McfQ74knPgxucea1Mt3uMkfojWzti/dsfuN+TcBfDjr2pHHJLa6+G7/P4HUoLerLcdT2yyxOg0vb8SOGHVlVxe7y/LgO5Vevrqq41BqK2d80p+J55DsA6DuCwlBHHghjdrny+STzSmqfHgCCZBXCCqIoIkAoigiEBURKiITflI4LKeSxkLkpnLRjISkJyEpViZYmIQlITlLhOmOmIUqcpcJ0xkIQgU5QwmTGEQwmKCZBFIQwmKCIRSEMJylRGAgmKVEIFEUEQgQRQKIQFBFREIpURKiISxEJCFFFyEcpCFKQoorEOhSlKiidDoQoEKKJ0MKQgoomQwClKiiYZAQUUTDAKCiiIQIKKIhAgooiEiBUUTBAlKiiIxFFFESH//2Q==";
const genId=()=>Math.random().toString(36).slice(2,10).toUpperCase();
function saveMyCreated(id){try{const l=JSON.parse(localStorage.getItem("wcup_created")||"[]");if(!l.includes(id)){l.unshift(id);localStorage.setItem("wcup_created",JSON.stringify(l.slice(0,10)));}}catch{}}
function saveMyJoined(id){try{const l=JSON.parse(localStorage.getItem("wcup_joined")||"[]");if(!l.includes(id)){l.unshift(id);localStorage.setItem("wcup_joined",JSON.stringify(l.slice(0,10)));}}catch{}}
function getMyCreated(){try{return JSON.parse(localStorage.getItem("wcup_created")||"[]");}catch{return[];}}
function getMyJoined(){try{return JSON.parse(localStorage.getItem("wcup_joined")||"[]");}catch{return[];}}
const DEFAULT_PRED_SETTINGS={winner:true,runnerUp:true,topScorer:true,japanResult:true,japanMvp:false,assistKing:false,tournamentMvp:false,best4:false,japanFirstMatchScore:false};
function getSettings(t){return t?.predictionSettings?{...DEFAULT_PRED_SETTINGS,...t.predictionSettings}:DEFAULT_PRED_SETTINGS;}
function calcPts(pred,res){
  if(!pred||!res?.winner)return 0;
  let p=0;
  if(pred.winner===res.winner)p+=20;
  if(pred.runnerUp===res.runnerUp)p+=15;
  if(pred.topScorer&&res.topScorer&&pred.topScorer.trim()===res.topScorer.trim())p+=15;
  if(pred.assistKing&&res.assistKing&&pred.assistKing.trim()===res.assistKing.trim())p+=10;
  if(pred.tournamentMvp&&res.tournamentMvp&&pred.tournamentMvp.trim()===res.tournamentMvp.trim())p+=10;
  if(pred.japanResult===res.japanResult)p+=10;
  if(pred.japanMvp&&res.japanMvp&&pred.japanMvp.trim()===res.japanMvp.trim())p+=8;
  if(pred.best4&&res.best4&&Array.isArray(pred.best4)&&Array.isArray(res.best4)){
    pred.best4.forEach(c=>{if(res.best4.includes(c))p+=5;});
  }
  if(pred.japanFirstMatchScore&&res.japanFirstMatchScore&&pred.japanFirstMatchScore.trim()===res.japanFirstMatchScore.trim())p+=10;
  if(pred.favoriteCountry===res.winner)p+=5;
  return p;
}
function rankMsg(rank,total){if(rank===1)return"現在首位。今だけはサッカー通を名乗っていいです。";if(rank===total&&total>1)return"予想というより祈りです。現実も少し見ましょう。";return"まだ巻き返せます。たぶん。";}
const AI_DATA=[];
function getAIPct(country){const d=AI_DATA.find(a=>a.country===country);if(d)return d.pct;const r=FIFA_RANK[country];if(r&&r<=10)return Math.max(1,8-r);if(r&&r<=20)return 1;return 0;}
function isDeadlinePassed(deadline){if(!deadline)return false;return new Date()>new Date(deadline);}
function fmtDeadline(deadline){if(!deadline)return null;return new Date(deadline).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"});}

const G={bg:"#0a1f4c",card:"#12244f",dark:"#0d2a5e",gold:"#F4B400",green:"#0e8a46",muted:"#8fa3c9",border:"rgba(255,255,255,0.1)",blue:"#60a5fa",navy:"#FFFFFF",red:"#E60033"};
const btnG={background:"linear-gradient(135deg,#E60033 0%,#AA0025 100%)",color:"#FFFFFF",fontWeight:800,borderRadius:16,padding:"16px 20px",fontSize:15,border:"none",cursor:"pointer",width:"100%",boxShadow:"0 8px 24px rgba(230,0,51,0.28)",letterSpacing:0.3};
const btnO={background:"rgba(255,255,255,0.05)",color:"#C9D6EC",fontWeight:700,borderRadius:16,padding:"14px 20px",fontSize:14,border:"1.5px solid rgba(255,255,255,0.15)",cursor:"pointer",width:"100%"};
const btnGr={background:"rgba(0,0,0,0.03)",color:"#5B6B7A",fontWeight:600,borderRadius:16,padding:"12px 20px",fontSize:13,border:"1px solid #D9E8FF",cursor:"pointer",width:"100%"};
const btnRed={background:"rgba(230,0,51,0.07)",color:"#E60033",fontWeight:600,borderRadius:10,padding:"6px 14px",fontSize:12,border:"1px solid rgba(230,0,51,0.25)",cursor:"pointer"};
const crd={background:"#12244f",borderRadius:18,padding:20,marginBottom:12,border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 4px 20px rgba(0,0,0,0.3)"};
const inp={background:"#FFFFFF",color:"#102A43",border:"1.5px solid #C9DDF5",borderRadius:12,padding:"13px 16px",fontSize:14,width:"100%",boxSizing:"border-box",outline:"none",transition:"border-color 0.2s,box-shadow 0.2s"};
const lbl={color:"#5B6B7A",fontSize:12,fontWeight:700,marginBottom:8,display:"block",letterSpacing:0.8,textTransform:"uppercase"};




/* ── ChatBox コンポーネント ── */
// ── spec-09: 次の日本戦バナー ────────────────────────────────
function NextJapanMatchBanner({nav}){
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const iv=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(iv);},[]);
  const next=useMemo(()=>{
    const n=Date.now();
    return MATCHES.filter(m=>(m.home==="日本"||m.away==="日本")&&new Date(m.kickoff).getTime()>n)
      .sort((a,b)=>new Date(a.kickoff)-new Date(b.kickoff))[0];
  },[]);
  if(!next) return(
    <div style={{margin:"12px 18px 0",background:"rgba(230,0,51,0.06)",border:"1px solid rgba(230,0,51,0.2)",borderRadius:14,padding:"12px 16px",textAlign:"center"}}>
      <span style={{fontSize:20}}>🇯🇵</span>
      <div style={{color:"#102A43",fontWeight:700,fontSize:13,marginTop:4}}>日本代表お疲れ様でした！</div>
    </div>
  );
  const ko=new Date(next.kickoff);
  const diff=ko.getTime()-now;
  const days=Math.floor(diff/86400000);
  const hours=Math.floor((diff%86400000)/3600000);
  const mins=Math.floor((diff%3600000)/60000);
  const opponent=next.home==="日本"?next.away:next.home;
  const koStr=ko.toLocaleString("ja-JP",{month:"numeric",day:"numeric",weekday:"short",hour:"2-digit",minute:"2-digit"});
  return(
    <div style={{margin:"12px 18px 0",background:"linear-gradient(135deg,rgba(230,0,51,0.08),rgba(255,255,255,0))",border:"1px solid rgba(230,0,51,0.25)",borderRadius:14,padding:"14px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontSize:18}}>🇯🇵</span>
        <span style={{color:"#E60033",fontWeight:800,fontSize:13}}>次の日本戦</span>
      </div>
      <div style={{color:"#102A43",fontWeight:700,fontSize:15,marginBottom:4}}>🇯🇵 日本 vs {opponent}</div>
      {diff>0?(
        <div style={{color:"#E60033",fontWeight:700,fontSize:13,marginBottom:4}}>
          あと {days>0?`${days}日 `:""}  {hours}時間 {mins}分
        </div>
      ):<div style={{color:"#16A34A",fontWeight:700,fontSize:13,marginBottom:4}}>⚽ キックオフ！</div>}
      <div style={{color:G.muted,fontSize:11,marginBottom:8}}>{koStr} キックオフ</div>
      {nav&&<button onClick={()=>nav("matches")} style={{background:"#E60033",color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>⚽ 日本戦を予想する →</button>}
    </div>
  );
}

// ── spec-D9: 紙吹雪オーバーレイ ──────────────────────────────
function ConfettiOverlay(){
  const pieces=useMemo(()=>Array.from({length:40},(_,i)=>({
    left:Math.random()*100,
    delay:Math.random()*2,
    duration:3+Math.random()*2,
    color:["#E60033","#F4B400","#FFFFFF","#0a1f4c"][Math.floor(Math.random()*4)],
    size:8+Math.random()*8,
  })),[]);
  return(
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {pieces.map((p,i)=>(
        <div key={i} className="absolute animate-wc-fall"
          style={{left:`${p.left}%`,top:"-20px",width:`${p.size}px`,height:`${p.size}px`,backgroundColor:p.color,animationDelay:`${p.delay}s`,animationDuration:`${p.duration}s`}}/>
      ))}
    </div>
  );
}

// ── spec-09: 日本戦結果演出モーダル（D9 侍ブルー強化）────────
function JapanCelebrationModal({data,onClose}){
  const{match,stored,myPts,japanWon,japanDrew}=data;
  const opponent=match.home==="日本"?match.away:match.home;
  const score=match.home==="日本"?`${stored.homeScore}-${stored.awayScore}`:`${stored.awayScore}-${stored.homeScore}`;
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5" style={{background:"rgba(6,21,51,0.95)",backdropFilter:"blur(4px)"}}>
      {japanWon&&<ConfettiOverlay/>}
      <div className={`relative w-full max-w-sm rounded-card-lg p-8 text-center shadow-hero animate-wc-pop-big ${japanWon?"bg-gradient-to-b from-navy-hero to-navy-base border-2 border-gold text-text-on-navy":"bg-navy-base border border-white/15 text-text-on-navy"}`}>
        <div className={`text-6xl mb-4 ${japanWon?"animate-wc-glow":""}`}>🇯🇵</div>
        {japanWon?(
          <>
            <div className="font-black text-gold mb-3" style={{fontSize:32}}>日本勝利！！</div>
            <div className="text-lg text-text-on-navy mb-5">
              🇯🇵 日本 <span className="text-2xl font-black">{score}</span> {opponent}
            </div>
            <div className="text-success text-sm font-bold mb-4">🎉 おめでとう！</div>
          </>
        ):(
          <>
            <div className="text-xl font-extrabold text-text-on-navy mb-3">{japanDrew?"惜しい引き分け…":"惜しかった…"}</div>
            <div className="text-base text-text-on-navy mb-4">
              🇯🇵 日本 <span className="text-xl font-black">{score}</span> {opponent}
            </div>
            <div className="text-text-on-navy-dim text-sm mb-4">次の試合に期待！</div>
          </>
        )}
        {myPts!=null&&(
          <div className="bg-white/5 border border-white/10 rounded-card p-4 mb-5">
            <div className="text-text-on-navy-dim text-xs mb-2">⚽ あなたの予想</div>
            <div className={`font-bold text-sm ${myPts>0?"text-success":"text-text-on-navy-dim"}`}>
              {myPts>0?`✅ +${myPts}pt 獲得！`:"0pt（予想外れ）"}
            </div>
          </div>
        )}
        <button onClick={onClose}
          className={`w-full font-bold rounded-card-lg py-3 border-0 cursor-pointer text-white active:scale-[.98] transition ${japanWon?"bg-hinomaru shadow-cta-red":"bg-white/10"}`}>
          閉じる
        </button>
      </div>
    </div>
  );
}

// ── spec-08: バッジ獲得モーダル ─────────────────────────────
function BadgeModal({badges,onClose}){
  const [idx,setIdx]=useState(0);
  const b=BADGES.find(bd=>bd.id===badges[idx]?.id);
  if(!b) return null;
  const isLast=idx>=badges.length-1;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000}}>
      <div style={{background:"#fff",borderRadius:24,padding:"32px 24px",textAlign:"center",maxWidth:300,width:"88%",animation:"trophyIn 0.4s ease-out",boxShadow:"0 8px 40px rgba(0,0,0,0.25)"}}>
        <div style={{fontSize:36,marginBottom:4}}>🎉</div>
        <div style={{color:G.gold,fontWeight:900,fontSize:17,marginBottom:16}}>バッジ獲得！</div>
        <div style={{fontSize:52,marginBottom:8,lineHeight:1}}>{b.icon}</div>
        <div style={{color:"#102A43",fontWeight:700,fontSize:16,marginBottom:4}}>{b.name}</div>
        <div style={{color:G.muted,fontSize:12,marginBottom:20,lineHeight:1.5}}>{b.desc}</div>
        {badges.length>1&&<div style={{color:G.muted,fontSize:11,marginBottom:10}}>{idx+1} / {badges.length}</div>}
        <button onClick={()=>{if(isLast)onClose();else setIdx(i=>i+1);}} style={{...btnG,width:"auto",padding:"12px 36px",fontSize:14}}>
          {isLast?"OK ✓":"次へ →"}
        </button>
      </div>
    </div>
  );
}

const REACTION_EMOJIS=["👍","😂","🤔","🔥"];

// mapの中から呼べるよう、React hooksを使わない純粋ファクトリ
function makeLongPress(onLongPress,ms=500){
  let timer=null;
  const start=()=>{timer=setTimeout(()=>onLongPress(),ms);};
  const cancel=()=>{if(timer){clearTimeout(timer);timer=null;}};
  return{
    onTouchStart:start,onTouchEnd:cancel,onTouchMove:cancel,
    onMouseDown:start,onMouseUp:cancel,onMouseLeave:cancel,
    onContextMenu:(e)=>{e.preventDefault();onLongPress();},
  };
}

function ChatBox({tournamentId=null,currentUser=null,title="チャット",maxHeight=320}){
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [nick,setNick]=useState(currentUser?.nickname||"");
  const [icon,setIcon]=useState(currentUser?.icon||"⚽");
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const [showSetup,setShowSetup]=useState(!currentUser&&!localStorage.getItem("chat_nick"));
  const [replyTo,setReplyTo]=useState(null);
  const [openMenuFor,setOpenMenuFor]=useState(null);
  const bottomRef=useRef(null);
  const reactionDebounce=useRef({});

  useEffect(()=>{
    if(!currentUser){
      const saved=localStorage.getItem("chat_nick");
      const savedIcon=localStorage.getItem("chat_icon");
      if(saved){setNick(saved);setShowSetup(false);}
      if(savedIcon) setIcon(savedIcon);
    }
  },[]);

  useEffect(()=>{
    if(tournamentId) setChatLastSeen(tournamentId);
    fetchMessages(tournamentId).then(msgs=>{setMessages(msgs);setLoading(false);});
    const unsub=subscribeToChat(
      tournamentId,
      (msg)=>setMessages(prev=>[...prev.slice(-99),msg]),
      (msg)=>setMessages(prev=>prev.map(m=>m.id===msg.id?msg:m))
    );
    return unsub;
  },[tournamentId]);

  useEffect(()=>{
    if(bottomRef.current) bottomRef.current.scrollIntoView({behavior:"smooth"});
  },[messages]);

  const handleSend=async()=>{
    const body=input.trim();
    if(!body||!nick.trim()) return;
    setSending(true);
    const opts={};
    if(replyTo) opts.reply_to=replyTo;
    const ok=await sendMessage(tournamentId,nick,icon,body,opts);
    if(ok){setInput("");setReplyTo(null);}
    setSending(false);
  };

  const handleReaction=async(msgId,emoji)=>{
    const key=`${msgId}_${emoji}`;
    const now=Date.now();
    if(reactionDebounce.current[key]&&now-reactionDebounce.current[key]<1000) return;
    reactionDebounce.current[key]=now;
    const uid=getChatUserId();
    setMessages(prev=>prev.map(m=>{
      if(m.id!==msgId) return m;
      const prev_r=m.reactions||{};
      const users=prev_r[emoji]||[];
      const next={...prev_r,[emoji]:users.includes(uid)?users.filter(u=>u!==uid):[...users,uid]};
      return {...m,reactions:next};
    }));
    try{const n=parseInt(localStorage.getItem("wcup_reactionsGiven")||"0")+1;localStorage.setItem("wcup_reactionsGiven",String(n));}catch{}
    await toggleReaction(msgId,emoji);
  };

  const saveNick=()=>{
    if(!nick.trim()) return;
    localStorage.setItem("chat_nick",nick);
    localStorage.setItem("chat_icon",icon);
    setShowSetup(false);
  };

  const fmtTime=(ts)=>{
    const d=new Date(ts);
    return d.toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"});
  };

  const uid=getChatUserId();

  // 重ねアバター用：最近のユニーク送信者（上位3人）
  const recentSenders=useMemo(()=>{
    const seen=new Set();
    return messages
      .filter(m=>m.nickname&&m.nickname!=="system"&&m.type!=="system")
      .slice().reverse()
      .filter(m=>{if(seen.has(m.nickname))return false;seen.add(m.nickname);return true;})
      .slice(0,3);
  },[messages]);

  // オンライン人数（直近30分以内の発言者数）
  const onlineCount=useMemo(()=>{
    const cutoff=Date.now()-30*60*1000;
    const seen=new Set();
    messages.forEach(m=>{
      if(m.nickname&&m.nickname!=="system"&&m.type!=="system"&&new Date(m.created_at).getTime()>cutoff)
        seen.add(m.nickname);
    });
    return Math.max(seen.size,1);
  },[messages]);

  // 日本戦クイック応援バー
  const CHEER_MSGS=["🔥 がんばれ日本！","⚽ ゴール！","😭 惜しい！","🙏 守れ！"];
  const lastCheerRef=useRef(0);
  const sendCheer=async(msg)=>{
    const now=Date.now();
    if(now-lastCheerRef.current<3000)return;
    lastCheerRef.current=now;
    if(!nick.trim())return;
    await sendMessage(tournamentId,nick,icon,msg,{type:"cheer"});
  };
  const isJapanMatchTime=useMemo(()=>{
    if(!tournamentId) return false;
    const now=Date.now();
    return MATCHES.some(m=>{
      if(m.home!=="日本"&&m.away!=="日本") return false;
      const ko=new Date(m.kickoff).getTime();
      return now>=ko-3600000&&now<=ko+7200000;
    });
  },[tournamentId]);

  // ESCキーでメニューを閉じる（早期 return より前に置く必要がある）
  useEffect(()=>{
    if(!openMenuFor) return;
    const handler=(e)=>{if(e.key==="Escape")setOpenMenuFor(null);};
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[openMenuFor]);

  if(showSetup) return(
    <div className="bg-navy-base rounded-card border border-white/10 p-5">
      <div className="text-white font-bold text-sm mb-4">💬 {title}に参加する</div>
      <div className="mb-3">
        <label className="text-text-on-navy-dim text-xs font-bold block mb-1">ニックネーム</label>
        <input className="bg-white/10 text-white placeholder-text-on-navy-weak rounded-full px-4 py-2 w-full text-sm outline-none border border-white/10 focus:border-hinomaru/50"
          placeholder="例: サッカー太郎" value={nick} onChange={e=>setNick(e.target.value)}/>
      </div>
      <div className="mb-4">
        <label className="text-text-on-navy-dim text-xs font-bold block mb-2">アイコン</label>
        <div className="grid grid-cols-4 gap-2">
          {ICONS.map(ic=><button key={ic} onClick={()=>setIcon(ic)}
            className={`text-2xl py-1.5 rounded-xl border-2 cursor-pointer bg-transparent${icon===ic?" border-hinomaru bg-hinomaru/10":" border-transparent"}`}>{ic}</button>)}
        </div>
      </div>
      <button onClick={saveNick} disabled={!nick.trim()}
        className="w-full bg-hinomaru text-white font-bold rounded-card-lg py-3 border-0 cursor-pointer shadow-cta-red disabled:opacity-50">
        参加する →
      </button>
    </div>
  );

  // リアクションチップ（件数>0のみ）
  const reactionChips=(reactions,msgId,isMine)=>{
    const chips=REACTION_EMOJIS.map(e=>{
      const users=reactions[e]||[];
      if(users.length===0) return null;
      const active=users.includes(uid);
      return(
        <button key={e} onClick={()=>msgId&&handleReaction(msgId,e)}
          className={`text-xs rounded-full px-2 py-0.5 font-${active?"bold":"normal"} cursor-pointer border transition-all${active?" bg-hinomaru/20 text-hinomaru border-hinomaru/40":" bg-white/10 text-text-on-navy-dim border-white/10"}`}>
          {e} {users.length}
        </button>
      );
    }).filter(Boolean);
    return chips.length>0?(
      <div className={`flex flex-wrap gap-1 mt-1${isMine?" justify-end":""}`}>{chips}</div>
    ):null;
  };

  // フローティングリアクションメニュー（spec-06b）
  const ReactionMenu=({msgId,isMe})=>{
    if(openMenuFor!==msgId) return null;
    return(
      <div className={`absolute z-50 bg-white rounded-full shadow-hero px-3 py-2 flex gap-2 animate-wc-pop${isMe?" right-0 bottom-[calc(100%+6px)]":" left-0 bottom-[calc(100%+6px)]"}`}>
        {REACTION_EMOJIS.map(e=>(
          <button key={e}
            onMouseDown={ev=>{ev.stopPropagation();ev.preventDefault();}}
            onClick={ev=>{ev.stopPropagation();msgId&&handleReaction(msgId,e);setOpenMenuFor(null);}}
            className="text-2xl bg-transparent border-0 cursor-pointer p-1 rounded-lg transition-transform active:scale-90">
            {e}
          </button>
        ))}
      </div>
    );
  };

  const renderMsg=(m,i)=>{
    const isMe=m.nickname===nick;
    const isSystem=m.nickname==="system"||m.type==="system";
    const isPredCard=m.type==="prediction_card";
    const reactions=m.reactions||{};
    const reply=m.reply_to;
    const lpHandlers=m.id?makeLongPress(()=>setOpenMenuFor(m.id)):{};

    // システム投稿（試合結果・バッジ獲得等）
    if(isSystem){
      return(
        <div key={m.id||i} className="my-2 px-4">
          <div {...(m.id?makeLongPress(()=>setOpenMenuFor(m.id)):{})}
            className="relative inline-block mx-auto bg-white/5 border border-white/15 rounded-card text-text-on-navy-dim text-xs px-4 py-2 text-center w-full"
            style={{whiteSpace:"pre-line",userSelect:"none"}}>
            {m.body}
            <ReactionMenu msgId={m.id} isMe={false}/>
          </div>
          {reactionChips(reactions,m.id,false)&&(
            <div className="flex justify-center mt-1">{reactionChips(reactions,m.id,false)}</div>
          )}
        </div>
      );
    }
    // 予想カード投稿（type:"prediction_card"）
    if(isPredCard){
      return(
        <div key={m.id||i} className={`my-2 px-4 flex${isMe?" justify-end":" justify-start"}`}>
          <div {...lpHandlers} className="relative max-w-[80%] rounded-card p-3 border-2 border-gold"
            style={{background:"linear-gradient(135deg,rgba(244,180,0,0.18),rgba(244,180,0,0.05))",userSelect:"none"}}>
            <div className="text-xs text-gold font-bold mb-1">📣 {m.nickname} の予想</div>
            <div className="text-white text-sm whitespace-pre-line">{m.body}</div>
            <div className="text-text-on-navy-dim text-[10px] mt-1 text-right">{fmtTime(m.created_at)}</div>
            <ReactionMenu msgId={m.id} isMe={isMe}/>
          </div>
        </div>
      );
    }
    // 通常メッセージ
    return(
      <div key={m.id||i} className={`my-1 px-4 flex items-start gap-2${isMe?" flex-row-reverse":""}`}>
        {/* アバター */}
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm flex-shrink-0 mt-1">
          {m.icon||"💬"}
        </div>
        <div className={`flex flex-col${isMe?" items-end":" items-start"} min-w-0`} style={{maxWidth:"75%"}}>
          {!isMe&&<div className="text-text-on-navy-weak text-[10px] font-bold mb-0.5 px-1">{m.nickname}</div>}
          {/* 引用返信（spec-06） */}
          {reply&&(
            <div className="border-l-4 border-hinomaru bg-white/5 rounded-r px-2 py-1 mb-1 text-xs text-text-on-navy-dim max-w-full overflow-hidden">
              <div className="font-bold truncate">{reply.senderName}</div>
              <div className="truncate opacity-80">{reply.preview}</div>
            </div>
          )}
          {/* バブル本体（長押し対象） */}
          <div className="relative">
            <ReactionMenu msgId={m.id} isMe={isMe}/>
            <div {...lpHandlers}
              className={`relative px-4 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap${isMe?" bg-hinomaru text-white shadow-cta-red rounded-2xl rounded-tr-sm":" bg-white text-text-on-white rounded-2xl rounded-tl-sm"}${reply?" rounded-tl-none rounded-tr-none":""}`}
              style={{userSelect:"none",cursor:"default"}}>
              {m.body}
            </div>
          </div>
          {/* 時刻 + 返信ボタン */}
          <div className={`flex items-center gap-2 mt-0.5 px-1${isMe?" flex-row-reverse":""}`}>
            <span className="text-text-on-navy-weakest text-[10px]">{fmtTime(m.created_at)}</span>
            {!isMe&&<button onClick={()=>setReplyTo({messageId:m.id,senderName:m.nickname,preview:m.body?.slice(0,30)||""})}
              className="text-text-on-navy-weak text-[10px] bg-transparent border-0 cursor-pointer">↩返信</button>}
          </div>
          {/* リアクションチップ */}
          {reactionChips(reactions,m.id,isMe)}
        </div>
      </div>
    );
  };

  return(
    <div className="bg-navy-base rounded-card overflow-hidden flex flex-col" style={{height:maxHeight+120}}>
      {/* オーバーレイ（長押しメニュー背景） */}
      {openMenuFor&&<div className="fixed inset-0 z-40 bg-black/40" onClick={()=>setOpenMenuFor(null)}/>}
      {/* ヘッダー */}
      <div className="bg-navy-700 px-5 py-3 flex items-center gap-3 flex-shrink-0 border-b border-white/10">
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm truncate">💬 {title}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse"/>
            <span className="text-text-on-navy-dim text-[11px]">{onlineCount}人オンライン</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex -space-x-2">
            {recentSenders.map((s,i)=>(
              <div key={i} className="w-7 h-7 rounded-full bg-navy-elevated border-2 border-navy-700 flex items-center justify-center text-xs">
                {s.icon||s.nickname?.[0]||"💬"}
              </div>
            ))}
          </div>
          <button onClick={()=>setShowSetup(true)} className="text-text-on-navy-weak text-xs bg-transparent border-0 cursor-pointer ml-1 active:scale-95 transition-transform">⚙️</button>
        </div>
      </div>
      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-0" style={{minHeight:0}}>
        {loading&&<div className="text-text-on-navy-dim text-center py-8 text-xs">読み込み中...</div>}
        {!loading&&messages.length===0&&(
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="text-4xl mb-3 opacity-40">💬</div>
            <div className="text-text-on-navy-dim text-xs font-bold">まだメッセージはありません</div>
            <div className="text-text-on-navy-weak text-xs mt-1">最初のメッセージを送ってみんなと盛り上がろう！</div>
          </div>
        )}
        {messages.map(renderMsg)}
        <div ref={bottomRef}/>
      </div>
      {/* 入力エリア */}
      <div className="flex-shrink-0 bg-navy-700 border-t border-white/10">
        {/* 応援クイック投稿（spec-09・日本戦時間帯のみ） */}
        {isJapanMatchTime&&(
          <div className="px-3 pt-2.5 pb-2.5 border-b border-white/10">
            <div className="text-hinomaru text-xs font-bold mb-2">🇯🇵 応援メッセージを送ろう！</div>
            <div className="grid grid-cols-2 gap-1.5">
              {CHEER_MSGS.map(msg=>(
                <button key={msg} onClick={()=>sendCheer(msg)}
                  className="bg-hinomaru/10 text-hinomaru border border-hinomaru/30 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer active:scale-[.98] transition-transform text-center">
                  {msg}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* 引用返信プレビュー */}
        {replyTo&&(
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border-b border-white/10">
            <div className="flex-1 min-w-0">
              <span className="text-hinomaru text-xs font-bold">↩ {replyTo.senderName}: </span>
              <span className="text-text-on-navy-dim text-xs truncate">{replyTo.preview}</span>
            </div>
            <button onClick={()=>setReplyTo(null)} className="text-text-on-navy-weak text-sm bg-transparent border-0 cursor-pointer leading-none">✕</button>
          </div>
        )}
        {/* テキスト入力 + 送信 */}
        <div className="flex items-end gap-2 px-3 py-2">
          <input className="bg-white/10 text-white placeholder-text-on-navy-weak rounded-full px-4 py-2 flex-1 text-sm outline-none border border-transparent focus:border-hinomaru/50 min-w-0"
            placeholder="メッセージを入力..."
            value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&handleSend()}
            maxLength={200}/>
          <button onClick={handleSend} disabled={sending||!input.trim()}
            className={`bg-hinomaru text-white rounded-full px-4 py-2 font-bold text-sm flex-shrink-0 border-0 cursor-pointer shadow-cta-red transition-opacity${(!input.trim()||sending)?" opacity-40 cursor-default shadow-none":""}`}>
            {sending?"...":"送信"}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ── 支払い方法バッジ ── */
function PaymentBadges({showCoffeeNote=false}){
  const badges=[
    {label:"💳 クレカ",active:true},
    {label:"🍎 Apple Pay",active:true},
    {label:"G Pay",active:true},
    {label:"PayPay",active:false},
    {label:"コンビニ",active:false},
  ];
  return(
    <div style={{marginTop:10}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:6}}>
        {badges.map((b,i)=>(
          <span key={i} onClick={()=>trackEvent("click_payment_method_info",{badge:b.label})} style={{
            background:b.active?"rgba(34,197,94,0.1)":"rgba(255,255,255,0.04)",
            border:`1px solid ${b.active?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.1)"}`,
            color:b.active?"#4ADE80":"#445",
            borderRadius:20,padding:"3px 9px",fontSize:9,fontWeight:700,
            display:"inline-flex",alignItems:"center",gap:3,cursor:"default",
          }}>
            {b.label}
            {!b.active&&<span style={{color:"#334",fontWeight:400,fontSize:8}}>準備中</span>}
          </span>
        ))}
      </div>
      <div style={{color:"#334",fontSize:9,lineHeight:1.6}}>
        {showCoffeeNote
          ?"100円応援課金も、クレジットカード・Apple Pay・Google Payでお支払いできます。PayPayは準備中です。"
          :"現在はクレジットカード・Apple Pay・Google Payでのお支払いに対応しています。PayPay・コンビニ決済は準備中です。"
        }<br/>
        ※ 表示される支払い方法は、ご利用端末・ブラウザ・Stripe側の設定により異なる場合があります。
      </div>
    </div>
  );
}

/* ── 法的リンクフッター ── */
function LegalFooter(){
  const openModal=(name,key)=>{
    trackEvent(key,{page:"legal"});
    alert(`${name}\n\n準備中です。近日公開予定です。`);
  };
  const links=[
    {label:"特定商取引法に基づく表記",key:"click_legal",anchor:"#legal"},
    {label:"プライバシーポリシー",key:"click_privacy",anchor:"#privacy"},
    {label:"お問い合わせ",key:"click_contact",anchor:"#contact"},
  ];
  return(
    <div style={{borderTop:"1px solid #1A3A28",marginTop:24,paddingTop:16,paddingBottom:8}}>
      <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:16,marginBottom:10}}>
        {links.map((l,i)=>(
          <a key={i} href={l.anchor} onClick={e=>{e.preventDefault();openModal(l.label,l.key);}}
            style={{color:G.muted,fontSize:11,textDecoration:"none",borderBottom:"1px solid #1A3A28"}}>
            {l.label}
          </a>
        ))}
      </div>
      <div style={{color:"#223",fontSize:9,textAlign:"center"}}>© 2026 W杯予想メーカー</div>
    </div>
  );
}


/* ── 応援課金コンポーネント ── */
function CoffeeSupport({compact=false}){
  const open=()=>{
    trackEvent("click_coffee_support",{page:"coffee"});
    const url=STRIPE.support.url;
    if(!url){alert("応援課金ページは準備中です。もうしばらくお待ちください！");return;}
    window.open(url,"_blank");
  };
  if(compact) return(
    <div style={{background:"rgba(180,120,40,0.06)",border:"1px solid rgba(180,120,40,0.18)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}>
      <span style={{fontSize:24,flexShrink:0}}>☕</span>
      <div style={{flex:1}}>
        <div style={{color:"#D4A056",fontSize:12,fontWeight:700}}>開発者にコーヒーを奢る</div>
        <div style={{color:G.muted,fontSize:10,marginTop:1}}>任意の応援課金 · 100円 · 機能解放なし</div>
      </div>
      <button onClick={open} style={{background:"rgba(180,120,40,0.2)",color:"#D4A056",border:"1px solid rgba(180,120,40,0.35)",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
        ☕ 100円
      </button>
    </div>
  );
  return(
    <div style={{background:"rgba(180,120,40,0.05)",border:"1px solid rgba(180,120,40,0.15)",borderRadius:14,padding:"16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{fontSize:32}}>☕</span>
        <div>
          <div style={{color:"#D4A056",fontWeight:700,fontSize:14}}>開発者にコーヒーを奢る</div>
          <div style={{color:G.muted,fontSize:11,marginTop:2}}>サービスが役に立ったら、100円で応援できます</div>
        </div>
      </div>
      <div style={{color:"#ccc",fontSize:12,lineHeight:1.7,marginBottom:12}}>
        W杯予想メーカーを応援する100円サポートです。<br/>
        <span style={{color:G.muted,fontSize:11}}>※ 任意の応援課金です。人数追加・有料機能の解放はありません。</span>
      </div>
      <PaymentBadges showCoffee={true}/>
      <button onClick={open} style={{...btnG,background:"linear-gradient(135deg,#92622A,#B8803A)",fontSize:14,padding:"12px"}}>
        ☕ 100円で応援する
      </button>
      <PaymentBadges showCoffeeNote={true}/>
    </div>
  );
}


/* ── アフィリエイト枠コンポーネント ── */
const AFFILIATE_ITEMS = {
  streaming: {icon:"📺", label:"配信サービスで試合を見る",  sub:"W杯全試合を見るならこちら", url:"#aff-streaming"},
  goods:     {icon:"⚽", label:"サッカー観戦グッズを探す",  sub:"ボール・グッズ・応援アイテム", url:"#aff-goods"},
  uniform:   {icon:"👕", label:"ユニフォームを探す",        sub:"推しチームのユニを手に入れよう", url:"#aff-uniform"},
  pizza:     {icon:"🍕", label:"みんなでピザを注文する",    sub:"観戦パーティーにフードデリバリー", url:"#aff-pizza"},
  drink:     {icon:"🍺", label:"観戦ドリンクを準備",        sub:"ノンアル・クラフトビールなど", url:"#aff-drink"},
  projector: {icon:"🎥", label:"プロジェクターで大画面観戦",sub:"迫力の大画面で楽しもう", url:"#aff-projector"},
  bar:       {icon:"🏟️", label:"スポーツバーを予約する",   sub:"友達と外で観戦するなら", url:"#aff-bar"},
  towel:     {icon:"🏳️", label:"応援タオルを探す",         sub:"スタジアムの雰囲気を家でも", url:"#aff-towel"},
};

function AffiliateBlock({title, keys, compact=false}){
  const [collapsed,setCollapsed]=useState(compact);
  const items=keys.map(k=>AFFILIATE_ITEMS[k]).filter(Boolean);
  return(
    <div style={{background:"linear-gradient(145deg,rgba(6,24,38,0.8),rgba(11,61,30,0.4))",borderRadius:14,padding:"14px 16px",marginTop:12,border:"1px solid rgba(14,165,233,0.15)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:collapsed?0:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{background:"rgba(14,165,233,0.15)",border:"1px solid rgba(14,165,233,0.3)",borderRadius:6,padding:"1px 7px",fontSize:9,color:"#7DD3FC",fontWeight:700,letterSpacing:0.5}}>PR</span>
          <span style={{color:"#fff",fontWeight:700,fontSize:13}}>{title}</span>
        </div>
        {compact&&<button onClick={()=>setCollapsed(c=>!c)} style={{background:"none",border:"none",color:G.muted,cursor:"pointer",fontSize:11,padding:0}}>{collapsed?"展開 ▾":"閉じる ▴"}</button>}
      </div>
      {!collapsed&&<>
        <div style={{color:G.muted,fontSize:10,marginBottom:8}}>※ アフィリエイトリンクを含みます</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {items.map((item,i)=>(
            <a key={i} href={item.url} target="_blank" rel="noopener noreferrer sponsored"
              onClick={()=>trackEvent("click_affiliate",{label:item.label,url:item.url,page:"affiliate"})} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 12px",textDecoration:"none",border:"1px solid rgba(255,255,255,0.06)"}}>
              <span style={{fontSize:20,flexShrink:0}}>{item.icon}</span>
              <div style={{flex:1,overflow:"hidden"}}>
                <div style={{color:"#fff",fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.label}</div>
                <div style={{color:G.muted,fontSize:10,marginTop:1}}>{item.sub}</div>
              </div>
              <span style={{color:"#0EA5E9",fontSize:11,flexShrink:0}}>→</span>
            </a>
          ))}
        </div>
      </>}
    </div>
  );
}

const Back=({onClick})=><button onClick={onClick} style={{background:"rgba(255,255,255,0.04)",border:"1px solid #D9E8FF",color:G.muted,cursor:"pointer",padding:"6px 14px 6px 10px",borderRadius:20,fontSize:12,display:"flex",alignItems:"center",gap:5,marginBottom:14,fontWeight:600,width:"fit-content"}}>‹ 戻る</button>;
const Err=({msg})=>msg?<div style={{color:"#FF8080",fontSize:13,padding:"10px 14px",background:"rgba(255,60,60,0.08)",borderRadius:12,marginBottom:12,border:"1px solid rgba(255,80,80,0.2)",display:"flex",alignItems:"center",gap:6}}><span>⚠️</span><span>{msg}</span></div>:null;
function FInput({label:lb,value,onChange,placeholder,type="text"}){return<div style={{marginBottom:16}}><label style={lbl}>{lb}</label><input style={inp} type={type} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/></div>;}
function Chips({opts,value,onChange,cols=2}){return<div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:6}}>{opts.map(o=><button key={o} onClick={()=>onChange(o)} style={{background:value===o?"linear-gradient(135deg,#005BAC,#003F8C)":"rgba(0,104,183,0.05)",color:value===o?"#fff":G.muted,border:`1.5px solid ${value===o?"#005BAC":"#D9E8FF"}`,borderRadius:10,padding:"10px 8px",fontSize:12,cursor:"pointer",fontWeight:value===o?700:400,lineHeight:1.3,minHeight:40}}>{o}</button>)}</div>;}
function Badge({label:lb,val}){return<div style={{background:"rgba(0,104,183,0.04)",borderRadius:10,padding:"9px 12px",border:"1px solid #D9E8FF"}}><div style={{color:G.muted,fontSize:9,fontWeight:700,marginBottom:3,letterSpacing:0.8,textTransform:"uppercase"}}>{lb}</div><div style={{color:G.navy,fontSize:12,fontWeight:700}}>{val||"—"}</div></div>;}
function FlagImg({code,country,size=26}){const c=code||(WC_GROUPS.flatMap(g=>g.teams).find(t=>t.n===country)?.f)||null;if(!c)return<span style={{fontSize:size*0.7}}>🏳️</span>;return<img src={`https://flagcdn.com/w40/${c}.png`} alt={country} style={{width:size,height:size*0.67,objectFit:"cover",borderRadius:3,verticalAlign:"middle"}} onError={e=>e.target.style.display="none"}/>;}
function FIFARank({country,small}){const r=FIFA_RANK[country];if(!r)return null;return<span style={{background:"rgba(0,91,172,0.08)",color:G.gold,fontSize:small?9:10,fontWeight:700,padding:"2px 6px",borderRadius:8,marginLeft:4,border:"1px solid rgba(0,91,172,0.2)"}}>FIFA {r}位</span>;}

function FlagChips({opts,value,onChange}){
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      {opts.map(c=>(
        <button key={c} onClick={()=>onChange(c)} style={{
          background:value===c?"linear-gradient(135deg,#005BAC,#003F8C)":"rgba(0,104,183,0.05)",
          color:value===c?"#fff":G.muted,
          border:`1.5px solid ${value===c?"#005BAC":"#D9E8FF"}`,
          borderRadius:10,padding:"10px 8px",fontSize:12,cursor:"pointer",
          fontWeight:value===c?700:400,lineHeight:1.3,minHeight:44,
          display:"flex",alignItems:"center",justifyContent:"center",gap:6,
        }}>
          <FlagImg country={c} size={16}/><span>{c}</span>
        </button>
      ))}
    </div>
  );
}
function PlayerChips({opts,value,onChange}){
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      <button onClick={()=>onChange("")} style={{
        gridColumn:"1/-1",background:value===""?"rgba(107,114,128,0.15)":"rgba(0,104,183,0.05)",
        color:"#0068B7",border:`1.5px solid ${value===""?"#6B7280":"#D9E8FF"}`,
        borderRadius:10,padding:"8px",fontSize:11,cursor:"pointer",fontWeight:400,
      }}>選択しない</button>
      {opts.map(p=>(
        <button key={p.name} onClick={()=>onChange(value===p.name?"":p.name)} style={{
          background:value===p.name?"linear-gradient(135deg,#005BAC,#003F8C)":"rgba(0,104,183,0.05)",
          color:value===p.name?"#fff":G.muted,
          border:`1.5px solid ${value===p.name?"#005BAC":"#D9E8FF"}`,
          borderRadius:10,padding:"10px 8px",fontSize:12,cursor:"pointer",
          fontWeight:value===p.name?700:400,lineHeight:1.4,minHeight:52,textAlign:"left",
        }}>
          <div style={{fontSize:12,fontWeight:"inherit"}}>{p.name}</div>
          <div style={{fontSize:9,opacity:0.65,marginTop:2}}>{p.pos} · {p.club}</div>
        </button>
      ))}
    </div>
  );
}
function ScorerChips({opts,value,onChange}){
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      {opts.map(s=>(
        <button key={s.name} onClick={()=>onChange(s.name)} style={{
          background:value===s.name?"linear-gradient(135deg,#005BAC,#003F8C)":"rgba(0,104,183,0.05)",
          color:value===s.name?"#fff":G.muted,
          border:`1.5px solid ${value===s.name?"#005BAC":"#D9E8FF"}`,
          borderRadius:10,padding:"10px 8px",fontSize:12,cursor:"pointer",
          fontWeight:value===s.name?700:400,lineHeight:1.4,minHeight:48,
          display:"flex",alignItems:"center",gap:6,
        }}>
          {s.country?<FlagImg country={s.country} size={14}/>:<span style={{width:14}}/>}
          <div>
            <div style={{fontSize:12,fontWeight:"inherit"}}>{s.name}</div>
            {s.country&&<div style={{fontSize:9,opacity:0.65}}>{s.country}</div>}
          </div>
        </button>
      ))}
    </div>
  );
}

// シンプルバーチャート
function BarChart({data,title}){
  const max=Math.max(...data.map(d=>d.count),1);
  return(
    <div style={{marginBottom:20}}>
      <div style={{color:G.gold,fontWeight:700,fontSize:13,marginBottom:10}}>{title}</div>
      {data.sort((a,b)=>b.count-a.count).map((d,i)=>(
        <div key={i} style={{marginBottom:6}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{color:"#ccc",fontSize:12}}>{d.label}</span>
            <span style={{color:G.gold,fontSize:12,fontWeight:700}}>{d.count}人</span>
          </div>
          <div style={{background:"rgba(0,104,183,0.05)",borderRadius:6,height:9,overflow:"hidden",border:"1px solid #D9E8FF"}}>
            <div style={{background:i===0?G.gold:i<3?"#4caf50":G.green,width:`${(d.count/max)*100}%`,height:"100%",borderRadius:6,transition:"width 0.5s"}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════ 通知ユーティリティ ══════════ */
function isNotificationSupported(){return typeof Notification!=="undefined";}
function isNotificationEnabled(){
  if(!isNotificationSupported())return false;
  return Notification.permission==="granted"&&localStorage.getItem("wcup_notif_enabled")==="true";
}
async function requestNotificationPermission(){
  if(!isNotificationSupported())return false;
  try{
    const perm=await Notification.requestPermission();
    if(perm==="granted"){localStorage.setItem("wcup_notif_enabled","true");return true;}
    localStorage.removeItem("wcup_notif_enabled");return false;
  }catch{return false;}
}
function scheduleNotifications(myMatchPredictions={}){
  if(!isNotificationEnabled())return;
  const now=Date.now();
  const HOURS_BEFORE=3;
  MATCHES.forEach(m=>{
    const kickoff=new Date(m.kickoff).getTime();
    if(kickoff<=now)return;
    if(myMatchPredictions&&myMatchPredictions[m.id])return; // 予想済みはスキップ
    const reminderTime=kickoff-HOURS_BEFORE*3600*1000;
    if(reminderTime<=now)return;
    const delay=reminderTime-now;
    if(delay>24*3600*1000)return; // 24時間以上先は次回起動時に再スケジュール
    const isJapan=m.home==="日本"||m.away==="日本";
    const title=isJapan?"🇯🇵 もうすぐ日本戦！":"⚽ もうすぐキックオフ";
    const body=isJapan
      ?`${m.away==="日本"?m.home:m.away}戦の予想はもう入れた？`
      :`${m.home} vs ${m.away} の予想を入れよう`;
    setTimeout(()=>{
      // 10分以上ズレたら見送り（スリープ後の大幅ズレ対策）
      if(Math.abs(Date.now()-reminderTime)>10*60*1000)return;
      if(!isNotificationEnabled())return;
      try{new Notification(title,{body,icon:"/wcup-yosou/icon-192.png",badge:"/wcup-yosou/icon-192.png",tag:`match-${m.id}`,data:{url:"/wcup-yosou/"}});}catch{}
    },delay);
  });
}
function fireResultNotification(matchId,pred,homeScore,awayScore){
  if(!isNotificationEnabled())return;
  try{
    const m=MATCHES.find(x=>x.id===matchId);
    if(!m||!pred?.pick)return;
    const actual=homeScore>awayScore?"home":homeScore<awayScore?"away":"draw";
    const correct=pred.pick===actual;
    const title=correct?"✅ 予想的中！ +3pt":"⚽ 試合結果が確定しました";
    const body=`${m.home} ${homeScore}-${awayScore} ${m.away}｜${correct?"的中🎉":"外れ😢"}`;
    new Notification(title,{body,icon:"/wcup-yosou/icon-192.png",tag:`result-${matchId}`});
  }catch{}
}

/* ══════════ ROOT ══════════ */
// ── spec-D9: 共通空状態コンポーネント ─────────────────────────
function EmptyState({icon,title,description,cta,onCtaClick}){
  return(
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center text-text-on-navy">
      <div className="text-6xl mb-4 opacity-50">{icon}</div>
      <div className="font-extrabold text-lg mb-3">{title}</div>
      <p className="text-text-on-navy-dim text-sm mb-6 whitespace-pre-wrap">{description}</p>
      {cta&&(
        <button onClick={onCtaClick}
          className="bg-hinomaru text-white rounded-card-lg shadow-cta-red py-3 px-6 font-bold active:scale-[.98] transition border-0 cursor-pointer">
          {cta}
        </button>
      )}
    </div>
  );
}

// ── spec-D9: 初回オンボーディング（3ステップ）─────────────────
function Onboarding({onComplete}){
  const [step,setStep]=useState(0);
  const steps=[
    {icon:"🌟",title:"W杯 2026\n予想メーカー",desc:"北中米3カ国共催・48ヶ国\n\n友達と予想して、\n一緒に W杯を楽しもう！"},
    {icon:"⚽",title:"勝敗を予想するだけ",desc:"各試合の勝敗を選ぶだけ。\n当たれば +3pt、\n日本戦の得点者まで当たれば +5pt"},
    {icon:"🏆",title:"友達と大会を作って、\nランキングで競おう！",desc:"一人でも遊べるよ。"},
  ];
  const isLast=step===steps.length-1;
  const cur=steps[step];
  return(
    <div className="fixed inset-0 z-[100] flex flex-col text-text-on-navy" style={{background:"linear-gradient(180deg,#061533 0%,#0a1f4c 55%,#0d2a5e 100%)"}}>
      {/* 背景装飾 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{position:"absolute",top:-60,left:-60,width:260,height:260,borderRadius:"50%",background:"radial-gradient(circle,rgba(100,160,255,0.2),transparent 65%)"}}/>
        <div style={{position:"absolute",bottom:60,right:-60,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(230,0,51,0.18),transparent 65%)"}}/>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center px-8 text-center relative z-10">
        <div className="text-7xl mb-6">{cur.icon}</div>
        <h1 className="font-black mb-4 whitespace-pre-wrap text-white" style={{fontSize:26,lineHeight:1.3}}>{cur.title}</h1>
        <p className="text-text-on-navy-dim text-sm whitespace-pre-wrap leading-relaxed">{cur.desc}</p>
      </div>
      {/* ステップインジケーター */}
      <div className="flex justify-center gap-2 pb-4 relative z-10">
        {steps.map((_,i)=>(
          <div key={i} className={`h-2 rounded-full transition-all ${i===step?"w-6 bg-hinomaru":"w-2 bg-white/30"}`}/>
        ))}
      </div>
      {/* CTA */}
      <div className="px-5 pb-10 relative z-10">
        {isLast?(
          <>
            <button onClick={()=>onComplete("create")}
              className="w-full bg-hinomaru text-white rounded-card-lg shadow-cta-red py-3.5 font-bold mb-2 active:scale-[.98] transition border-0 cursor-pointer text-base">
              🏆 友達と大会を作る
            </button>
            <button onClick={()=>onComplete("solo")}
              className="w-full border border-white/30 text-white rounded-card-lg py-3.5 font-bold bg-transparent cursor-pointer text-base">
              👤 ひとりで予想を始める
            </button>
          </>
        ):(
          <>
            <button onClick={()=>setStep(step+1)}
              className="w-full bg-hinomaru text-white rounded-card-lg shadow-cta-red py-3.5 font-bold mb-2 active:scale-[.98] transition border-0 cursor-pointer text-base">
              次へ →
            </button>
            <button onClick={()=>onComplete("skip")}
              className="w-full text-text-on-navy-dim py-2 text-sm bg-transparent border-0 cursor-pointer">
              スキップ
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function App(){
  const [page,setPage]=useState("home");
  const [tourn,setTourn]=useState(null);
  const [myId,setMyId]=useState(null);
  const [adminOk,setAdminOk]=useState(false);
  const [selCountry,setSelCountry]=useState(null);
  const [onboardingDone,setOnboardingDone]=useState(()=>{
    try{
      if(localStorage.getItem("wcup_onboardingDone")) return true;
      // 既存ユーザー（大会参加済 or チャット設定済）は自動スキップ
      return Object.keys(localStorage).some(k=>k.startsWith("wcup_myid_")||k==="chat_nick");
    }catch{return true;}
  });

  useEffect(()=>{
    const init=async()=>{
      try{
        await trackEvent("site_open",{page:window.location.pathname,hash:window.location.hash});
        const hash=window.location.hash;
        if(hash.startsWith("#t-")){
          const t=await loadT(hash.slice(3));
          if(t){
            setTourn(t);
            try{
              const mid=localStorage.getItem("wcup_myid_"+t.id);
              if(mid&&t.participants.find(p=>p.id===mid))setMyId(mid);
            }catch{}
            // 起動時HomeA固定：#t-IDハッシュがあっても着地はHomeA（開催後の挙動は別途検討）
            // アプリ内goT（大会選択・参加後）は従来どおりtournamentへ遷移する
          }
        }
      }catch(e){
        console.warn("[init] failed:",e?.message||e);
      }
    };

    init();
  },[]);

  // 通知スケジューリング（tourn/myId が変わるたびに再スケジュール）
  useEffect(()=>{
    if(!myId||!tourn)return;
    const me=tourn.participants?.find(p=>p.id===myId);
    scheduleNotifications(me?.matchPredictions||{});
  },[tourn?.id,myId]);

  // spec-07: アプリ起動時1回 + 3分ごとのライブスコア自動取得
  useEffect(()=>{
    if(!tourn?.id) return;
    fetchAndApplyResults(tourn,{update});
    const iv=setInterval(()=>{
      if(document.visibilityState==="visible") fetchAndApplyResults(tourn,{update});
    },3*60*1000);
    return()=>clearInterval(iv);
  },[tourn?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // GA4 スクリーントラッキング（本番ドメインのみ）
  useEffect(()=>{
    if(window.location.hostname!=='xiaokoulu-maker.github.io')return;
    if(typeof window.gtag!=='function')return;
    const GA_PAGES={
      home:       {path:"/",            title:"ホーム"},
      create:     {path:"/create",      title:"大会を作る"},
      upgrade:    {path:"/upgrade",     title:"プランアップグレード"},
      tournament: {path:"/tournament",  title:"大会ホーム"},
      join:       {path:"/join",        title:"大会に参加"},
      predict:    {path:"/predict",     title:"優勝予想を入力"},
      predictions:{path:"/predictions", title:"みんなの予想"},
      ranking:    {path:"/ranking",     title:"ランキング"},
      stats:      {path:"/stats",       title:"詳細統計"},
      admin:      {path:"/admin",       title:"管理者ページ"},
      schedule:   {path:"/schedule",    title:"試合日程"},
      groups:     {path:"/groups",      title:"グループ表"},
      country:    {path:"/country",     title:"国別データ"},
      globalchat: {path:"/chat",        title:"みんなのチャット"},
      bracket:    {path:"/bracket",     title:"決勝トーナメント表"},
      world:      {path:"/world",       title:"ワールドモード"},
      japan:      {path:"/japan",       title:"日本代表"},
      survival:   {path:"/survival",    title:"予想生存チェック"},
      singlepred: {path:"/singlepred",  title:"日本戦単発予想"},
      best11:     {path:"/best11",      title:"ベスト11"},
      best16:     {path:"/best16",      title:"ベスト16予想"},
      globalstats:{path:"/global-stats",title:"みんなの予想データ"},
      solopredict:{path:"/solo-predict",title:"ひとりで予想"},
      moremenu:   {path:"/more",        title:"もっと見る"},
      matches:    {path:"/matches",     title:"試合予想"},
      badges:     {path:"/badges",      title:"バッジ"},
      coinshop:   {path:"/coin-shop",   title:"コインショップ"},
      mypage:     {path:"/mypage",      title:"マイページ"},
      ai:         {path:"/ai",          title:"AI予想"},
    };
    const info=GA_PAGES[page]||{path:"/"+page,title:page};
    window.gtag('event','page_view',{
      page_path:     '/wcup-yosou'+info.path,
      page_title:    info.title,
      page_location: 'https://xiaokoulu-maker.github.io/wcup-yosou'+info.path,
    });
  },[page]);

  const nav=useCallback((p)=>{
    window.scrollTo(0,0);
    setPage(p);
    // ページ別イベント
    const pageEvents={
      "ai":"open_ai_prediction","schedule":"open_schedule",
      "groups":"open_groups","best11":"open_best11","best16":"open_best16",
      "bracket":"open_bracket","upgrade":"click_upgrade_page",
    };
    if(pageEvents[p]) trackEvent(pageEvents[p],{page:p});
  },[]);
  const update=useCallback(async(t)=>{setTourn(t);await saveT(t);},[]);
  const goT=useCallback(async(t)=>{setTourn(t);await saveT(t);window.location.hash="#t-"+t.id;try{const mid=localStorage.getItem("wcup_myid_"+t.id);if(mid&&t.participants.find(p=>p.id===mid))setMyId(mid);}catch{}setPage("tournament");},[]);
  const goCountry=useCallback((c)=>{setSelCountry(c);window.scrollTo(0,0);setPage("country");},[]);
  const sp={tourn,setTourn,nav,update,myId,setMyId,adminOk,setAdminOk,goCountry};

  const handleOnboardingComplete=(action)=>{
    try{localStorage.setItem("wcup_onboardingDone","true");}catch{}
    setOnboardingDone(true);
    if(action==="create") setPage("create");
    else if(action==="solo") setPage("matches");
  };

  return(
    <ErrorBoundary>
    {!onboardingDone&&<Onboarding onComplete={handleOnboardingComplete}/>}
    <div style={{background:G.bg,minHeight:"100vh",maxWidth:480,margin:"0 auto"}}>
      {page==="home"&&<PgHome nav={nav} goT={goT} tourn={tourn} myId={myId}/>}
      {page==="create"&&<PgCreate nav={nav} goT={goT}/>}
      {page==="upgrade"&&<PgUpgrade nav={nav} tourn={tourn} update={update}/>}
      {page==="tournament"&&<PgTournament {...sp}/>}
      {page==="join"&&<PgJoin {...sp}/>}
      {page==="predict"&&<PgPredict {...sp}/>}
      {page==="predictions"&&<PgPredictions {...sp}/>}
      {page==="ranking"&&<PgRanking {...sp}/>}
      {page==="stats"&&<PgStats tourn={tourn} nav={nav}/>}
      {page==="admin"&&<PgAdmin {...sp}/>}
      {page==="schedule"&&<PgSchedule nav={nav} goCountry={goCountry}/>}
      {page==="groups"&&<PgGroups nav={nav} goCountry={goCountry}/>}
      {page==="country"&&<PgCountry nav={nav} country={selCountry} goCountry={goCountry}/>}
      {page==="globalchat"&&<PgGlobalChat nav={nav}/>}
      {page==="bracket"&&<PgBracket nav={nav} tourn={tourn}/>}
      {page==="world"&&<PgWorldMode nav={nav} tourn={tourn} goCountry={goCountry}/>}
      {page==="japan"&&<PgJapanMode nav={nav} tourn={tourn}/>}
      {page==="survival"&&<PgSurvival nav={nav} tourn={tourn} update={update}/>}
      {page==="singlepred"&&<PgSinglePred nav={nav} tourn={tourn} update={update} myId={myId}/>}
      {page==="best11"&&<PgBest11 nav={nav}/>}
      {page==="best16"&&<PgBest16 nav={nav}/>}
      {page==="globalstats"&&<PgGlobalStats nav={nav}/>}
      {page==="solopredict"&&<PgSoloPredict nav={nav}/>}
      {page==="moremenu"&&<PgMoreMenu nav={nav}/>}
      {page==="matches"&&<PgMatches {...sp}/>}
      {page==="badges"&&<PgBadges nav={nav} tourn={tourn} myId={myId}/>}
      {page==="coinshop"&&<PgCoinShop nav={nav} tourn={tourn} myId={myId} update={update}/>}
      {page==="mypage"&&<PgMyPage nav={nav} tourn={tourn} myId={myId} update={update}/>}
      {/* 固定プロフィールボタン — home 以外のページでログイン中に右下に常時表示 */}
      {tourn&&myId&&page!=="home"&&(
        <button
          onClick={()=>nav("mypage")}
          title="マイページ"
          style={{
            position:"fixed",bottom:20,right:16,
            width:44,height:44,borderRadius:"50%",
            background:"rgba(10,31,76,0.88)",
            border:"1.5px solid rgba(255,255,255,0.22)",
            boxShadow:"0 4px 14px rgba(0,0,0,0.35)",
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
            color:"#fff",zIndex:50,
          }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
            <circle cx="12" cy="7.5" r="4.5"/>
            <path d="M3 21c0-4.97 4.03-9 9-9s9 4.03 9 9H3z"/>
          </svg>
        </button>
      )}
    </div>
    </ErrorBoundary>
  );
}


function PgLoad(){return<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"linear-gradient(180deg,#E8F1FF 0%,#F4F8FF 60%,#FFFFFF 100%)"}}><div style={{textAlign:"center"}}><div style={{fontSize:68,marginBottom:16,display:"inline-block",animation:"floatBall 2.2s ease-in-out infinite",filter:"drop-shadow(0 4px 20px rgba(0,104,183,0.3))"}}>⚽</div><div style={{color:G.gold,fontSize:13,letterSpacing:3,fontWeight:700}}>読み込み中...</div></div></div>;}

/* ── Hero: Countdown ── */
function HeroCountdown(){
  const TARGET=new Date("2026-06-11T18:00:00+09:00").getTime();
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[]);
  const diff=Math.max(0,TARGET-now);
  const started=diff===0;
  const d=Math.floor(diff/86400000);
  const h=Math.floor((diff/3600000)%24);
  const m=Math.floor((diff/60000)%60);
  const s=Math.floor((diff/1000)%60);
  const pad=n=>String(n).padStart(2,"0");
  return(
    <div className="relative z-10 mx-5 mt-6 bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-4">
      <div className="text-text-on-navy-dim text-xs text-center font-bold">{started?"⚽ 開幕中！":"開幕まで"}</div>
      {!started&&(
        <div className="flex items-baseline justify-around mt-2 tabular-nums">
          <div className="flex flex-col items-center">
            <span className="text-[44px] leading-none font-black text-gold">{pad(d)}</span>
            <span className="text-[10px] text-text-on-navy-dim mt-1 tracking-widest">DAYS</span>
          </div>
          <div className="text-white/30 text-2xl">·</div>
          <div className="flex flex-col items-center">
            <span className="text-[44px] leading-none font-black text-white">{pad(h)}</span>
            <span className="text-[10px] text-text-on-navy-dim mt-1 tracking-widest">HOURS</span>
          </div>
          <div className="text-white/30 text-2xl">·</div>
          <div className="flex flex-col items-center">
            <span className="text-[44px] leading-none font-black text-white">{pad(m)}</span>
            <span className="text-[10px] text-text-on-navy-dim mt-1 tracking-widest">MIN</span>
          </div>
          <div className="text-white/30 text-2xl">·</div>
          <div className="flex flex-col items-center">
            <span className="text-[44px] leading-none font-black text-white">{pad(s)}</span>
            <span className="text-[10px] text-text-on-navy-dim mt-1 tracking-widest">SEC</span>
          </div>
        </div>
      )}
      <div className="border-t border-white/10 mt-4 pt-3">
        <div className="grid grid-cols-3 divide-x divide-white/10 text-center">
          <div><div className="text-white font-bold">48 <span className="text-text-on-navy-dim text-xs">カ国</span></div></div>
          <div><div className="text-white font-bold">16 <span className="text-text-on-navy-dim text-xs">都市</span></div></div>
          <div><div className="text-white font-bold">104 <span className="text-text-on-navy-dim text-xs">試合</span></div></div>
        </div>
      </div>
    </div>
  );
}

/* ── Hero: Visual (field + ball + lights) ── */
function HeroVisual(){
  return(
    <div style={{position:"relative",background:"linear-gradient(180deg,#0d1f3f 0%,#1a3a6e 50%,#0b4928 100%)",height:300,overflow:"hidden",textAlign:"center"}}>
      <div className="hero-light hero-light-left"/>
      <div className="hero-light hero-light-right"/>
      <div style={{position:"relative",zIndex:3,paddingTop:30}}>
        <div style={{color:"rgba(255,255,255,0.5)",fontSize:10,fontWeight:700,letterSpacing:3,marginBottom:6}}>FIFA WORLD CUP 2026</div>
        <div style={{color:"#fff",fontSize:21,fontWeight:900,lineHeight:1.45,textShadow:"0 2px 14px rgba(0,0,0,0.55)"}}>W杯を友達と予想して、<br/>いちばん当てた人が優勝</div>
        <HeroCountdown/>
      </div>
      <div className="hero-field-wrapper">
        <svg className="hero-field" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="heroFieldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a5e32"/>
              <stop offset="100%" stopColor="#0d8a45"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="800" height="400" fill="url(#heroFieldGrad)"/>
          <rect x="10" y="10" width="780" height="380" fill="none" stroke="white" strokeWidth="2" opacity="0.7"/>
          <line x1="10" y1="200" x2="790" y2="200" stroke="white" strokeWidth="2" opacity="0.7"/>
          <ellipse cx="400" cy="200" rx="80" ry="50" fill="none" stroke="white" strokeWidth="2" opacity="0.7"/>
          <circle cx="400" cy="200" r="4" fill="white" opacity="0.8"/>
          <rect x="10" y="130" width="140" height="140" fill="none" stroke="white" strokeWidth="2" opacity="0.6"/>
          <rect x="650" y="130" width="140" height="140" fill="none" stroke="white" strokeWidth="2" opacity="0.6"/>
          <rect x="10" y="162" width="54" height="76" fill="none" stroke="white" strokeWidth="2" opacity="0.5"/>
          <rect x="736" y="162" width="54" height="76" fill="none" stroke="white" strokeWidth="2" opacity="0.5"/>
        </svg>
      </div>
      <div className="hero-ball">⚽</div>
    </div>
  );
}

/* ── spec-14: Crowd Pick コンポーネント ── */
function GlobalChampionPicks({data}){
  const [showAll,setShowAll]=useState(false);
  if(!data||data.rankings.length===0) return null;
  const visible=showAll?data.rankings:data.rankings.slice(0,5);
  return(
    <section className="relative z-10 px-5 mt-8">
      <div className="flex items-center gap-2 mb-1">
        <Globe size={14} className="text-gold flex-shrink-0"/>
        <h2 className="text-white font-bold text-sm tracking-wide">みんなの優勝予想</h2>
      </div>
      <p className="text-text-on-navy-dim text-xs mb-3 pl-5">全国 {data.total.toLocaleString()} 票</p>
      <div className="rounded-xl border border-white/10 p-4" style={{background:"#12244f"}}>
        <div className="flex flex-col gap-3">
          {visible.map((row,i)=>(
            <div key={row.country}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <FlagImg country={row.country} size={20}/>
                  <span className="font-semibold text-sm text-white">{row.country}</span>
                  {i===0&&<span className="text-[10px] bg-gold/20 text-gold border border-gold/40 px-1.5 py-0.5 rounded-full font-bold">1位</span>}
                </div>
                <div className="text-right">
                  <span className={`font-black text-sm tabular-nums ${i===0?"text-gold":"text-white/70"}`}>{row.percent}%</span>
                  <span className="ml-1 text-[10px] text-text-on-navy-weak">({row.count.toLocaleString()}票)</span>
                </div>
              </div>
              <div className="bg-white/8 rounded-full h-1 overflow-hidden">
                <div className={`h-1 rounded-full ${i===0?"bg-gold":"bg-hinomaru/70"}`} style={{width:`${row.percent}%`}}/>
              </div>
            </div>
          ))}
        </div>
        {data.rankings.length>5&&(
          <button onClick={()=>setShowAll(!showAll)} className="w-full text-gold/80 text-xs font-bold pt-4 text-center bg-transparent border-0 cursor-pointer hover:text-gold transition-colors">
            {showAll?"閉じる ▲":`もっと見る ▼ (残り ${data.rankings.length-5} カ国)`}
          </button>
        )}
      </div>
    </section>
  );
}
function GlobalJapanScorerPicks({data}){
  if(!data||data.rankings.length===0) return null;
  const medals=["🥇","🥈","🥉"];
  return(
    <section className="mx-5 mt-6">
      <h2 className="text-white font-bold text-base mb-1">🌐 みんなの注目選手予想</h2>
      <p className="text-text-on-navy-dim text-xs mb-3">全国 {data.total.toLocaleString()} 票 / 次の日本戦</p>
      <div className="rounded-xl border border-white/10 p-4" style={{background:"#12244f"}}>
        <div className="flex flex-col gap-3">
          {data.rankings.slice(0,6).map((row,i)=>(
            <div key={row.playerId}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {i<3&&<span>{medals[i]}</span>}
                  <span className="font-semibold text-sm text-white">{row.playerName}</span>
                  {row.playerNumber&&<span className="text-xs text-text-on-navy-dim">#{row.playerNumber} {row.playerPos}</span>}
                </div>
                <div className="text-right">
                  <span className={`font-black text-sm tabular-nums ${i===0?"text-gold":"text-white/70"}`}>{row.percent}%</span>
                  <span className="ml-1 text-[10px] text-text-on-navy-weak">({row.count}票)</span>
                </div>
              </div>
              <div className="bg-white/8 rounded-full h-1 overflow-hidden">
                <div className={`h-1 rounded-full ${i===0?"bg-gold":"bg-hinomaru/70"}`} style={{width:`${row.percent}%`}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── spec-13: 自分の大会ハブ ── */
function TournamentCard({tournament,onClick}){
  const t=tournament;
  return(
    <button onClick={onClick}
      className="w-full text-left active:scale-[.99] transition border-0 cursor-pointer rounded-xl p-4 flex items-center justify-between gap-3"
      style={{background:"#12244f",border:"1px solid rgba(255,255,255,0.1)"}}>
      <div className="min-w-0">
        <div className="font-bold text-sm text-white truncate">{t.name}</div>
        <div className="text-xs text-text-on-navy-dim mt-0.5">
          {t.myRank?`${t.myRank}位 / ${t.participantCount}人 · ${t.myPoints} pt`:`参加中 · ${t.myPoints} pt`}
        </div>
      </div>
      <ChevronRight size={16} className="text-gold flex-shrink-0"/>
    </button>
  );
}
function MyTournamentsSection({myTournaments,onSelect,onCreate,onJoinByCode}){
  if(!myTournaments||myTournaments.length===0) return null;
  return(
    <section className="relative z-10 px-5 mt-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block w-[3px] h-4 rounded-full bg-gold flex-shrink-0"/>
        <h2 className="text-white font-bold text-sm tracking-wide">あなたの大会 ({myTournaments.length})</h2>
      </div>
      <div className="flex flex-col gap-3">
        {myTournaments.map(t=>(
          <TournamentCard key={t.id} tournament={t} onClick={()=>onSelect(t)}/>
        ))}
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <button onClick={onCreate}
          className="w-full bg-hinomaru text-white rounded-2xl shadow-cta-red py-3 font-bold text-base flex items-center justify-center gap-2 active:scale-[.98] transition border-0 cursor-pointer">
          <span className="text-xl leading-none">＋</span>新しい大会を作る
        </button>
        <button onClick={onJoinByCode}
          className="w-full border border-white/30 text-white rounded-2xl py-2.5 font-bold text-sm active:scale-[.98] transition bg-transparent cursor-pointer">
          招待コードで参加
        </button>
      </div>
    </section>
  );
}

/* ── Samurai Blue: Countdown ── */
function SbCountdown(){
  const TARGET=new Date("2026-06-11T18:00:00+09:00").getTime();
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[]);
  const diff=Math.max(0,TARGET-now);
  const d=Math.floor(diff/86400000);
  const h=Math.floor((diff/3600000)%24);
  const m=Math.floor((diff/60000)%60);
  const s=Math.floor((diff/1000)%60);
  const pad=n=>String(n).padStart(2,"0");
  return(
    <div className="sb-countdown sb-stripe-field">
      <div className="sb-cd-label"><span className="sb-cd-dot"/>開幕まで &nbsp;KICKOFF: 6.11</div>
      <div className="sb-cd-grid">
        {[{n:d,u:"DAYS"},{n:h,u:"HOURS"},{n:m,u:"MIN"},{n:s,u:"SEC"}].map((c,i)=>(
          <div className="sb-cd-cell" key={i}>
            <div className="sb-cd-num">{pad(c.n)}</div>
            <div className="sb-cd-unit">{c.u}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Samurai Blue: Champion picks ── */
function SbChampionSection({data}){
  const [showAll,setShowAll]=useState(false);
  if(!data||data.rankings.length===0) return null;
  const maxPct=data.rankings[0]?.percent||1;
  const visible=showAll?data.rankings:data.rankings.slice(0,5);
  const rest=data.rankings.length-5;
  return(
    <div className="sb-section">
      <div className="sb-section-head">
        <div className="sb-t"><span className="sb-tick sb-tick-gold"/>みんなの優勝予想</div>
        <div className="sb-meta">{data.total.toLocaleString()} 票</div>
      </div>
      <div className="sb-card">
        <div className="sb-predict sb-pitch-field">
          {visible.map((row,i)=>(
            <div className="sb-pred-row" key={row.country}>
              <span className={"sb-rank-no"+(i===0?" sb-r1":"")}>{i+1}</span>
              <span style={{flexShrink:0}}><FlagImg country={row.country} size={30}/></span>
              <div className="sb-pred-body">
                <div className="sb-pred-nm">{row.country}</div>
                <div className="sb-pred-track">
                  <div className={"sb-pred-fill"+(i===0?" sb-pred-fill-lead":"")}
                    style={{width:(row.percent/maxPct*100)+"%"}}/>
                </div>
              </div>
              <span className={"sb-pred-pct"+(i===0?" sb-pred-pct-lead":"")}>{row.percent.toFixed(1)}%</span>
            </div>
          ))}
        </div>
        {data.rankings.length>5&&(
          <button className="sb-morelink" onClick={()=>setShowAll(s=>!s)}>
            {showAll?"閉じる":`もっと見る（残り ${rest} カ国）`}
            <span style={{display:"inline-block",transform:showAll?"rotate(180deg)":"none",transition:".2s",marginLeft:4}}>▼</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Samurai Blue: Leagues ── */
const SB_BADGE_COLORS=["var(--sb-red)","var(--sb-blue-b)","var(--sb-gold-d)","var(--sb-green)"];
function SbLeaguesSection({myTournaments,onSelect,onCreate,onJoin}){
  return(
    <div className="sb-section">
      <div className="sb-section-head">
        <div className="sb-t"><span className="sb-tick"/>あなたの大会</div>
        {myTournaments.length>0&&<div className="sb-meta">{myTournaments.length}</div>}
      </div>
      {myTournaments.length>0&&(
        <div className="sb-card" style={{overflow:"hidden"}}>
          {myTournaments.map((t,i)=>(
            <button className="sb-league" key={t.id} onClick={()=>onSelect(t)}>
              <div className="sb-league-badge"
                style={{background:`linear-gradient(180deg,${SB_BADGE_COLORS[i%SB_BADGE_COLORS.length]},rgba(0,0,0,0.25))`}}>
                {t.name.charAt(0)}
              </div>
              <div className="sb-league-info">
                <div className="sb-league-ln">{t.name}</div>
                <div className="sb-league-sub">
                  {t.myRank&&<span className="sb-league-pos">{t.myRank}位</span>}
                  <span>/ {t.participantCount}人</span>
                  <span>· {t.myPoints} pt</span>
                </div>
              </div>
              <ChevronRight size={18} className="sb-chev"/>
            </button>
          ))}
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:9,marginTop:12}}>
        <button className="sb-btn sb-btn-blue sb-btn-sm" onClick={onCreate}>
          <span style={{fontSize:17}}>＋</span>新しい大会を作る
        </button>
        <button className="sb-btn sb-btn-ghost sb-btn-sm" onClick={onJoin}>招待コードで参加</button>
      </div>
    </div>
  );
}

/* ── Home (侍ブルー D2) ── */
function PgHome({nav,goT,tourn,myId}){
  const [showJoin,setShowJoin]=useState(false);
  const [joinId,setJoinId]=useState("");
  const [joinErr,setJoinErr]=useState("");
  const [extraOpen,setExtraOpen]=useState(true);
  const [notifEnabled,setNotifEnabled]=useState(isNotificationEnabled());
  const [chatUnread,setChatUnread]=useState(0);
  const [japanCelebration,setJapanCelebration]=useState(null);
  const [showLandingOverride,setShowLandingOverride]=useState(true); // 起動時HomeA固定
  const [showHamMenu,setShowHamMenu]=useState(false);
  const [myTournaments,setMyTournaments]=useState([]);
  const [championVotes,setChampionVotes]=useState(null);
  const me=tourn?.participants?.find(p=>p.id===myId);
  const isLoggedIn=!!(me&&tourn);
  // 日本戦結果演出チェック
  useEffect(()=>{
    if(!me||!tourn) return;
    const japanMatches=MATCHES.filter(m=>m.home==="日本"||m.away==="日本");
    for(const jm of japanMatches){
      const key=`wcup_japanResultShown_${tourn.id}_${jm.id}`;
      if(localStorage.getItem(key)) continue;
      const stored=tourn.results?.matchResults?.[jm.id];
      if(!stored) continue;
      const cutoff=new Date(jm.kickoff).getTime()+24*3600*1000;
      if(Date.now()>cutoff){localStorage.setItem(key,"1");continue;}
      const myPred=me.matchPredictions?.[jm.id];
      const actual=stored.homeScore>stored.awayScore?"home":stored.homeScore<stored.awayScore?"away":"draw";
      const japanSide=jm.home==="日本"?"home":"away";
      const japanWon=actual===japanSide;
      const japanDrew=actual==="draw";
      const myPts=myPred?.points??null;
      setJapanCelebration({match:jm,stored,myPts,japanWon,japanDrew,key});
      break;
    }
  },[tourn?.id]);
  useEffect(()=>{
    if(!tourn?.id||!db)return;
    const since=getChatLastSeen(tourn.id);
    if(since){
      db.from("messages").select("id",{count:"exact",head:true}).eq("tournament_id",tourn.id).gt("created_at",since).then(({count})=>setChatUnread(count||0));
    }
    const unsub=subscribeToChat(tourn.id,()=>setChatUnread(c=>c+1));
    return unsub;
  },[tourn?.id]);

  // spec-13: 自分の参加大会を読み込む（5分キャッシュ）
  useEffect(()=>{
    const CACHE_KEY="wcup_myTournaments";
    const CACHE_TTL=5*60*1000;
    const load=async()=>{
      try{
        const cached=localStorage.getItem(CACHE_KEY);
        if(cached){
          const{data,cachedAt}=JSON.parse(cached);
          if(Date.now()-cachedAt<CACHE_TTL&&Array.isArray(data)&&data.length>0){
            setMyTournaments(data);return;
          }
        }
        const joined=getMyJoined();
        const fromKeys=Object.keys(localStorage).filter(k=>k.startsWith("wcup_myid_")).map(k=>k.replace("wcup_myid_",""));
        const allIds=[...new Set([...joined,...fromKeys])].filter(Boolean);
        if(allIds.length===0)return;
        const results=await Promise.all(allIds.map(id=>loadT(id)));
        const valid=results.filter(Boolean).map(t=>{
          const myPid=localStorage.getItem("wcup_myid_"+t.id)||"";
          const myPart=t.participants?.find(p=>p.id===myPid);
          if(!myPart)return null;
          const sorted=[...(t.participants||[])].sort((a,b)=>(b.totalMatchPoints||0)-(a.totalMatchPoints||0));
          const myRank=sorted.findIndex(p=>p.id===myPid)+1;
          return{id:t.id,name:t.name,myPoints:myPart.totalMatchPoints||0,myRank:myRank>0?myRank:null,participantCount:t.participants?.length||0};
        }).filter(Boolean);
        try{localStorage.setItem(CACHE_KEY,JSON.stringify({data:valid,cachedAt:Date.now()}));}catch{}
        setMyTournaments(valid);
      }catch{}
    };
    load();
  },[]);

  const handleSelectMyTourn=async(item)=>{
    try{
      const t=await loadT(item.id);
      if(t)goT(t);
    }catch{}
  };

  // spec-14: 全国優勝予想集計を読み込む
  useEffect(()=>{
    loadGlobalChampionVotes().then(d=>{if(d)setChampionVotes(d);}).catch(()=>{});
  },[]);

  const joinByID=async()=>{const id=joinId.trim().toUpperCase();if(!id)return;const t=await loadT(id);if(t)goT(t);else setJoinErr("大会が見つかりませんでした。");};
  const now=new Date();
  const pad=n=>String(n).padStart(2,"0");
  const todayStr=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const todayCount=MATCHES.filter(m=>m.kickoff.slice(0,10)===todayStr).length;
  const matchResults=tourn?.results?.matchResults||{};
  const myPreds=me?.matchPredictions||{};
  const nextUnpredicted=MATCHES.filter(m=>!matchResults[m.id]&&new Date(m.kickoff)>now&&!myPreds[m.id]).sort((a,b)=>new Date(a.kickoff)-new Date(b.kickoff))[0];
  let nextDeadline="なし";
  if(nextUnpredicted){const diff=new Date(nextUnpredicted.kickoff)-now;const h=Math.floor(diff/3600000);const m=Math.floor((diff%3600000)/60000);nextDeadline=h>=24?Math.floor(h/24)+"日後":h+"h"+m+"m";}
  const sortedP=tourn?[...tourn.participants].sort((a,b)=>(b.totalMatchPoints||0)-(a.totalMatchPoints||0)):[];
  const myRankIdx=sortedP.findIndex(p=>p.id===myId);
  const rankStr=myRankIdx>=0?`${myRankIdx+1}位/${sortedP.length}人中`:"－";
  const lineMsg=tourn?encodeURIComponent(`【W杯予想大会】${tourn.name}\n一緒に予想しよう！\n${window.location.origin}${window.location.pathname}#t-${tourn.id}`):"";
  // HomeB 追加データ
  const nextJapanMatchB=useMemo(()=>MATCHES.filter(m=>(m.home==="日本"||m.away==="日本")&&new Date(m.kickoff)>now).sort((a,b)=>new Date(a.kickoff)-new Date(b.kickoff))[0],[]);
  const unpredictedTodayMatches=MATCHES.filter(m=>m.kickoff.slice(0,10)===todayStr&&!matchResults[m.id]&&!myPreds[m.id]);
  const featuredMatch=unpredictedTodayMatches[0]||MATCHES.filter(m=>!matchResults[m.id]&&new Date(m.kickoff)>now&&!myPreds[m.id]).sort((a,b)=>new Date(a.kickoff)-new Date(b.kickoff))[0];
  const myStreak=me?.streak?.current||0;
  const myCoins=getCoins(me).balance;
  const myBadgesCount=me?.badges?.length||0;

  // ── HomeB (handoff home.jsx / HomeB デザイン適用) ──
  if(isLoggedIn&&!showLandingOverride){
    // 日本戦カウントダウンバナー（ロジック温存・スタイルのみ更新）
    const JapanBanner=()=>{
      const [jpNow,setJpNow]=useState(Date.now());
      useEffect(()=>{const t=setInterval(()=>setJpNow(Date.now()),1000);return()=>clearInterval(t);},[]);
      if(!nextJapanMatchB)return null;
      const diff2=Math.max(0,new Date(nextJapanMatchB.kickoff).getTime()-jpNow);
      const jd=Math.floor(diff2/86400000);
      const jh=Math.floor((diff2/3600000)%24);
      const jm=Math.floor((diff2/60000)%60);
      const opp=nextJapanMatchB.home==="日本"?nextJapanMatchB.away:nextJapanMatchB.home;
      const koStr=new Date(nextJapanMatchB.kickoff).toLocaleString("ja-JP",{month:"numeric",day:"numeric",weekday:"short",hour:"2-digit",minute:"2-digit"});
      return(
        <button onClick={()=>nav("japan")} className="next-card" style={{width:"100%",textAlign:"left",border:"none",cursor:"pointer",display:"block"}}>
          <div className="glow"/>
          <div className="eyebrow" style={{color:"#7ea2ff"}}>NEXT JAPAN MATCH</div>
          <div className="teams-line">
            <span className="jp">JP</span>
            <span className="vs-t">日本<span className="x">VS</span>{opp}</span>
          </div>
          <div className="cd-row">
            <div className="cd-tile"><div className="n">{jd}</div><div className="l">DAYS</div></div>
            <div className="cd-tile"><div className="n">{jh}</div><div className="l">HOURS</div></div>
            <div className="cd-tile"><div className="n">{jm}</div><div className="l">MIN</div></div>
          </div>
          <div className="ko-line"><DsIcon name="calendar" size={14}/> {koStr} KO</div>
        </button>
      );
    };

    return(
      <>
      <div className="screen">
        {/* ── TopBar ── */}
        <div className="topbar">
          <div className="ttl">
            <div className="badge">{tourn.name?.[0]||"?"}</div>
            <div className="meta">
              <div className="k">大会</div>
              <div className="v">{tourn.name}</div>
            </div>
          </div>
          <div className="acts">
            {isNotificationSupported()&&!notifEnabled&&(
              <div className="icobtn dot" onClick={async()=>{const ok=await requestNotificationPermission();setNotifEnabled(ok);}} title="通知をオン">
                <DsIcon name="bell" size={19}/>
              </div>
            )}
            <div className="icobtn me" onClick={()=>nav("mypage")} title="マイページ" style={{fontSize:17,fontWeight:900}}>
              {me.nickname?.[0]||me.icon||"?"}
            </div>
            <div className="icobtn" onClick={()=>setShowHamMenu(v=>!v)} title="メニュー">
              <DsIcon name={showHamMenu?"xLogo":"menu"} size={19}/>
            </div>
          </div>
        </div>

        {/* ── 日本戦カウントダウン ── */}
        <div className="wrap section tight">
          <JapanBanner/>
        </div>

        {/* ── 今日の試合 ── */}
        {featuredMatch&&(
          <div className="wrap section">
            <button onClick={()=>nav("matches")} className="card today" style={{width:"100%",textAlign:"left",border:"none",cursor:"pointer",display:"block"}}>
              <div className="top">
                <div className="l"><span className="i"><DsIcon name="whistle" size={17}/></span> 今日の試合</div>
                <span className="chip red"><span className="dot"></span> 未予想 {unpredictedTodayMatches.length||1}</span>
              </div>
              <div className="teams">
                <div className="team"><Flag name={featuredMatch.home} lg/><span className="nm">{featuredMatch.home}</span></div>
                <div className="vs">VS<span className="ko">{(()=>{const ko=new Date(featuredMatch.kickoff);return`${String(ko.getHours()).padStart(2,"0")}:${String(ko.getMinutes()).padStart(2,"0")}`;})()}</span></div>
                <div className="team"><Flag name={featuredMatch.away} lg/><span className="nm">{featuredMatch.away}</span></div>
              </div>
              <div className="ft">
                <div className="dl"><DsIcon name="clock" size={14}/> 締切まで <b>{(()=>{const diff3=new Date(featuredMatch.kickoff)-now;const rh=Math.floor(diff3/3600000);const rm=Math.floor((diff3%3600000)/60000);return`${rh>0?rh+"h ":""}${rm}m`;})()}</b></div>
                <div className="rw">当たれば +{SCORING.outcome}pt</div>
              </div>
            </button>
          </div>
        )}

        {/* ── 2×2 ステータス ── */}
        <div className="wrap section">
          <div className="grid2">
            <DsStat icon="chart" label="現在の順位" value={myRankIdx>=0?myRankIdx+1:"－"} unit={`位 / ${sortedP.length}人`} onClick={()=>nav("ranking")}/>
            <DsStat icon="flame" label="連続的中" value={myStreak} unit="連続" color="red" onClick={()=>nav("badges")}/>
            <DsStat icon="coin" label="コイン残高" value={myCoins.toLocaleString()} color="gold" onClick={()=>nav("coinshop")}/>
            <DsStat icon="medal" label="獲得バッジ" value={myBadgesCount} unit={`/ ${BADGES.length}`} onClick={()=>nav("badges")}/>
          </div>
        </div>

        {/* ── メイン CTA ── */}
        <div className="wrap section">
          <button className="btn btn-red lg" onClick={()=>nav("matches")}>
            <DsIcon name="whistle" size={21}/> 試合を予想する
          </button>
        </div>

        {/* ── その他機能グリッド ── */}
        <div className="wrap section">
          <DsSectionHead title="この大会のその他の機能" action={extraOpen?"閉じる":"すべて見る"} onAction={()=>setExtraOpen(v=>!v)}/>
          {extraOpen&&(
            <div className="grid4">
              {[
                {ic:"trophy",  t:"優勝予想",  action:()=>nav("predict"),    hl:false, badge:0},
                {ic:"flag",    t:"日本代表",  action:()=>nav("japan"),      hl:true,  badge:0},
                {ic:"star",    t:"ベスト11",  action:()=>nav("best11"),     hl:false, badge:0},
                {ic:"grid",    t:"グループ表",action:()=>nav("groups"),     hl:false, badge:0},
                {ic:"chatBig", t:"チャット",  action:()=>nav("tournament"), hl:false, badge:chatUnread},
                {ic:"medal",   t:"バッジ",    action:()=>nav("badges"),     hl:false, badge:0},
                {ic:"coin",    t:"コイン",    action:()=>nav("coinshop"),   hl:false, badge:0},
                {ic:"gear",    t:"設定",      action:()=>nav("admin"),      hl:false, badge:0},
              ].map(c=>(
                <button key={c.t} className={"feat"+(c.hl?" hl":"")} onClick={c.action} style={{border:"none",cursor:"pointer",position:"relative"}}>
                  <div className="fi" style={{position:"relative"}}>
                    <DsIcon name={c.ic} size={20}/>
                    {c.badge>0&&<span style={{position:"absolute",top:-4,right:-8,background:"var(--red)",color:"#fff",borderRadius:99,fontSize:9,fontWeight:900,padding:"0 4px",lineHeight:"14px",minWidth:14,textAlign:"center"}}>{c.badge>99?"99+":c.badge}</span>}
                  </div>
                  <div className="ft">{c.t}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── LINE招待 ── */}
        <div className="wrap section">
          <a href={`https://line.me/R/msg/text/?${lineMsg}`} target="_blank" rel="noopener noreferrer" className="btn btn-teal lg" style={{textDecoration:"none"}}>
            <DsIcon name="users" size={20}/> 友達を招待する
          </a>
        </div>
      </div>

      {/* JapanCelebrationModal（温存） */}
      {japanCelebration&&<JapanCelebrationModal data={japanCelebration} onClose={()=>{localStorage.setItem(japanCelebration.key,"1");setJapanCelebration(null);}}/>}

      {/* ── ハンバーガーナビメニュー（スライドイン・温存） ── */}
      {showHamMenu&&(
        <>
          <div onClick={()=>setShowHamMenu(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:80}}/>
          <div style={{position:"fixed",top:0,right:0,bottom:0,width:248,background:"var(--panel)",zIndex:90,display:"flex",flexDirection:"column",boxShadow:"-4px 0 30px rgba(0,0,0,0.6)",borderLeft:"1px solid var(--line)"}}>
            <div style={{padding:"56px 18px 12px",borderBottom:"1px solid var(--line)"}}>
              <div style={{color:"var(--dim)",fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",fontFamily:"'Roboto Mono',monospace"}}>メニュー</div>
            </div>
            <div style={{flex:1,overflowY:"auto"}}>
              {[
                {ic:"whistle",  label:"試合を予想", dest:"matches"},
                {ic:"trophy",   label:"優勝予想",   dest:"predict"},
                {ic:"chart",    label:"ランキング", dest:"ranking"},
                {ic:"grid",     label:"グループ表", dest:"groups"},
                {ic:"flag",     label:"日本代表",   dest:"japan"},
                {ic:"bracket",  label:"決勝T",      dest:"bracket"},
                {ic:"chatBig",  label:"チャット",   dest:"tournament"},
                {ic:"medal",    label:"バッジ",     dest:"badges"},
                {ic:"coin",     label:"コイン",     dest:"coinshop"},
                {ic:"gear",     label:"設定",       dest:"admin"},
              ].map(item=>(
                <button key={item.dest} onClick={()=>{nav(item.dest);setShowHamMenu(false);}}
                  style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"transparent",border:"none",borderBottom:"1px solid var(--line-soft)",cursor:"pointer",color:"var(--txt)",fontSize:14,fontWeight:600,textAlign:"left",width:"100%"}}>
                  <span style={{width:24,display:"inline-flex",alignItems:"center",justifyContent:"center",color:"var(--muted)"}}><DsIcon name={item.ic} size={18}/></span>
                  {item.label}
                </button>
              ))}
            </div>
            <button onClick={()=>{setShowLandingOverride(true);setShowHamMenu(false);}}
              style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"transparent",border:"none",borderTop:"1px solid var(--line)",cursor:"pointer",color:"var(--faint)",fontSize:13,textAlign:"left",width:"100%"}}>
              <DsIcon name="arrowRight" size={18} style={{color:"var(--faint)",transform:"scaleX(-1)"}}/>
              ホーム画面
            </button>
          </div>
        </>
      )}
      </>
    );
  }

  // ── HomeA Samurai Blue ──
  return(
    <>
    <div className="sb-app">
      {/* top bar */}
      <div className="sb-topbar">
        <div className="sb-wc-mark" onClick={()=>nav("home")} style={{cursor:"pointer"}}>
          <span className="sb-fifa">FIFA WORLD CUP</span>
          <span className="sb-yr">2026</span>
        </div>
        <div className="sb-app-name">W杯予想メーカー</div>
      </div>

      {/* 参加中の大会への戻るリンク（showLandingOverride 時のみ） */}
      {showLandingOverride&&isLoggedIn&&(
        <div style={{display:"flex",alignItems:"center",padding:"4px 16px 8px"}}>
          <button onClick={()=>setShowLandingOverride(false)}
            style={{display:"inline-flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",color:"var(--sb-text-dim)",fontFamily:"var(--sb-jp)",fontWeight:700,fontSize:14,padding:"6px 4px"}}>
            ‹ {tourn.name} に戻る
          </button>
        </div>
      )}

      {/* hero */}
      <div className="sb-hero sb-stripe-field">
        <div className="sb-hinomaru"/>
        <div className="sb-kicker"><span className="sb-bar"/>SAMURAI PREDICTION</div>
        <h1 className="sb-h1">4年に1度の夏、<br/>予想で<span className="sb-accent">最高の景色</span>を。</h1>
        <p className="sb-lead">仲間と優勝国を予想し、本番104試合をリアルタイムで競い合おう。開幕までもう待てない。</p>
      </div>

      {/* countdown */}
      <SbCountdown/>

      {/* primary CTAs */}
      <div style={{padding:"16px 16px 0",display:"flex",flexDirection:"column",gap:10}}>
        <button className="sb-btn sb-btn-primary" onClick={()=>nav("create")}>
          <span style={{fontSize:19}}>＋</span>友達と大会を作る
        </button>
        <p className="sb-btn-hint">30秒で完成・LINEでそのまま招待</p>
        <button className="sb-btn sb-btn-ghost" onClick={()=>nav("solopredict")}>ひとりで予想を始める</button>
      </div>

      {/* みんなの優勝予想 */}
      {championVotes&&championVotes.rankings.length>0&&(
        <SbChampionSection data={championVotes}/>
      )}

      {/* あなたの大会 */}
      <SbLeaguesSection
        myTournaments={myTournaments}
        onSelect={handleSelectMyTourn}
        onCreate={()=>{try{localStorage.removeItem("wcup_myTournaments");}catch{}nav("create");}}
        onJoin={()=>setShowJoin(true)}
      />

      {/* チャット CTA */}
      <div className="sb-section">
        <div className="sb-card sb-chat-cta" onClick={()=>nav("globalchat")} style={{cursor:"pointer"}}>
          <div className="sb-chat-ic">
            <MessageCircle size={20} color="var(--sb-blue-b)"/>
          </div>
          <div className="sb-chat-tx">
            <div className="sb-chat-a">みんなのチャット</div>
            <div className="sb-chat-b">W杯について語ろう</div>
          </div>
          <ChevronRight size={18} className="sb-chev"/>
        </div>
      </div>

      {/* 予想メニュー */}
      <div className="sb-section">
        <div className="sb-section-head">
          <div className="sb-t"><span className="sb-tick sb-tick-blue"/>予想メニュー</div>
        </div>
        <div className="sb-feat-grid">
          {[
            {k:"グループ別",d:"A〜L組の順位予想",bg:"rgba(63,107,255,0.2)",ic:<LayoutGrid size={18} color="#fff"/>,action:()=>nav("groups")},
            {k:"決勝T",d:"ノックアウト予想",bg:"rgba(228,0,43,0.2)",ic:<Trophy size={18} color="#fff"/>,action:()=>nav("bracket")},
            SHOW_BEST11
              ? {k:"ベスト11",d:"スタメン11人を選ぼう",bg:"rgba(231,200,115,0.18)",ic:<Medal size={18} color="var(--sb-gold)"/>,action:()=>nav("best11")}
              : {k:"ベスト16予想",d:"ベスト16に残る16チームを当てる",bg:"rgba(228,0,43,0.18)",ic:<Target size={18} color="#fff"/>,action:()=>nav("best16")},
            {k:"試合日程",d:"全104試合カレンダー",bg:"rgba(63,107,255,0.2)",ic:<Calendar size={18} color="#fff"/>,action:()=>nav("schedule")},
          ].map(f=>(
            <button className="sb-feat" key={f.k} onClick={f.action}>
              <div className="sb-feat-ic" style={{background:f.bg}}>{f.ic}</div>
              <div>
                <div className="sb-feat-lbl">{f.k}</div>
                <div className="sb-feat-desc">{f.d}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 招待コードで参加 */}
      <div style={{textAlign:"center",padding:"8px 16px"}}>
        <button onClick={()=>setShowJoin(v=>!v)}
          style={{background:"none",border:"none",cursor:"pointer",color:"var(--sb-text-faint)",fontSize:12,fontWeight:500}}>
          招待された? <span style={{color:"var(--sb-red-b)",fontWeight:700}}>コードで参加</span>
        </button>
      </div>
      {showJoin&&(
        <div style={{padding:"0 16px 8px"}}>
          <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:16}}>
            <div style={{color:"var(--sb-text-faint)",fontSize:12,fontWeight:700,marginBottom:8}}>大会IDを入力</div>
            <div style={{display:"flex",gap:8}}>
              <input value={joinId} onChange={e=>setJoinId(e.target.value)} placeholder="例: ABCD1234"
                style={{flex:1,borderRadius:10,padding:"10px 12px",fontSize:13,background:"rgba(5,9,28,0.7)",border:"1px solid var(--sb-line-s)",color:"var(--sb-text)",outline:"none"}}
                onKeyDown={e=>e.key==="Enter"&&joinByID()}/>
              <button onClick={joinByID}
                style={{background:"var(--sb-red)",color:"#fff",fontWeight:700,padding:"10px 16px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13}}>入る</button>
            </div>
            {joinErr&&<div style={{color:"var(--sb-red-b)",fontSize:12,marginTop:8}}>{joinErr}</div>}
          </div>
        </div>
      )}

      <div className="sb-spacer-bottom"/>
    </div>
    </>
  );
}

/* ── Home Legacy (バックアップ) ── */
function PgHomeLegacy({nav,goT}){
  const [joinId,setJoinId]=useState("");
  const [joinErr,setJoinErr]=useState("");
  const [myCreated,setMyCreated]=useState([]);
  const [myJoined,setMyJoined]=useState([]);
  const [loadedT,setLoadedT]=useState({});

  useEffect(()=>{
    const created=getMyCreated();
    const joined=getMyJoined();
    setMyCreated(created);setMyJoined(joined);
    const allIds=[...new Set([...created,...joined])];
    allIds.forEach(id=>loadT(id).then(t=>{if(t)setLoadedT(prev=>({...prev,[id]:t}));}));
  },[]);

  const joinByID=async()=>{const id=joinId.trim().toUpperCase();if(!id)return;const t=await loadT(id);if(t)goT(t);else setJoinErr("大会が見つかりませんでした。");};

  const TCard=({id,isCreated})=>{
    const t=loadedT[id];
    const passed=t&&isDeadlinePassed(t.deadline);
    if(!t)return<div style={{background:"#F7FAFF",borderRadius:12,padding:"12px 14px",marginBottom:8,opacity:0.5,border:"1px solid #D9E8FF"}}><div style={{color:G.muted,fontSize:12}}>読み込み中...</div></div>;
    return(
      <div onClick={()=>goT(t)} style={{
        background:"#FFFFFF",borderRadius:12,padding:"12px 14px",marginBottom:8,cursor:"pointer",
        border:"1px solid #D9E8FF",
        borderLeft:`3px solid ${isCreated?"#0068B7":"#22C55E"}`,
        boxShadow:"0 2px 10px rgba(0,91,172,0.07)",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{color:"#102A43",fontWeight:700,fontSize:13,marginBottom:5}}>{t.name}</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              <span style={{color:isCreated?"#0068B7":"#22C55E",fontSize:10,fontWeight:600,
                background:isCreated?"rgba(0,104,183,0.08)":"rgba(34,197,94,0.08)",
                borderRadius:8,padding:"1px 7px"}}>
                {isCreated?"👑 主催":"✋ 参加中"}
              </span>
              <span style={{color:"#5B6B7A",fontSize:10,background:"rgba(0,0,0,0.04)",borderRadius:8,padding:"1px 7px"}}>
                {t.participants.length}/{t.maxParticipants}人
              </span>
              {t.deadline&&<span style={{color:passed?"#E60033":"#16A34A",fontSize:10,
                background:passed?"rgba(230,0,51,0.07)":"rgba(22,163,74,0.07)",borderRadius:8,padding:"1px 7px"}}>
                {passed?"⛔ 締切済":"⏰ "+fmtDeadline(t.deadline)}
              </span>}
            </div>
          </div>
          <div style={{color:"#0068B7",fontSize:11,fontWeight:800,marginLeft:8,
            background:"rgba(0,104,183,0.08)",borderRadius:8,padding:"4px 10px",flexShrink:0}}>開く →</div>
        </div>
      </div>
    );
  };

  // ① まず予想する
  const CARDS_PREDICT=[
    {icon:"👤",label:"今すぐ個人予想",sub:"大会に参加せず、自分だけの予想を作成",action:()=>nav("solopredict"),color:G.gold,  bg:"rgba(0,91,172,0.07)", border:"rgba(0,91,172,0.2)"},
    {icon:"⚽",label:"大会で予想する",sub:"参加中の大会で予想を入力",             action:()=>nav("predict"),  color:"#22C55E",bg:"rgba(34,197,94,0.12)",border:"rgba(34,197,94,0.3)"},
  ];
  // ③ データを見る（2枚）
  const CARDS_DATA=[
    {icon:"📅",label:"試合日程",         sub:"全試合スケジュール・結果",    action:()=>nav("schedule"),  color:"#22C55E",bg:"rgba(34,197,94,0.1)",   border:"rgba(34,197,94,0.25)"},
    {icon:"📊",label:"みんなの予想データ",sub:"全体の匿名集計ランキング",  action:()=>nav("globalstats"),color:"#0068B7",bg:"rgba(0,104,183,0.07)", border:"rgba(0,104,183,0.2)"},
  ];

  return(
    <div className="pg-home-bg" style={{paddingBottom:40}}>
      {/* ━━ ステータスバー ━━ */}
      <div style={{background:"#0A1F3C",padding:"6px 16px",display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:"#E60033",boxShadow:"0 0 6px rgba(230,0,51,0.8)",flexShrink:0}}/>
        <div style={{color:"rgba(255,255,255,0.5)",fontSize:9,fontWeight:700,letterSpacing:1.5}}>LIVE</div>
        <div style={{width:1,height:10,background:"rgba(255,255,255,0.2)",margin:"0 2px"}}/>
        <div style={{color:"rgba(255,255,255,0.75)",fontSize:10,fontWeight:600,letterSpacing:0.3}}>2026.06.11 開幕 / WORLD CUP COUNTDOWN</div>
      </div>

      {/* ━━ モード切り替え（最上部） ━━ */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,background:"#FFFFFF",borderBottom:"2px solid #D9E8FF",boxShadow:"0 2px 8px rgba(0,91,172,0.08)"}}>
        <button onClick={()=>{nav("world");trackEvent("open_world_mode",{page:"home"});}}
          style={{background:"linear-gradient(135deg,#005BAC 0%,#003F8C 100%)",color:"#FFFFFF",fontWeight:800,border:"none",
            borderRight:"1px solid rgba(255,255,255,0.15)",
            padding:"13px 0",fontSize:13,cursor:"pointer",letterSpacing:0.3,
            boxShadow:"inset 0 -2px 0 rgba(0,0,0,0.15)"}}>
          🌍 ワールド
        </button>
        <button onClick={()=>{nav("japan");trackEvent("open_japan_mode",{page:"home"});}}
          style={{background:"#FFFFFF",color:"#0068B7",fontWeight:700,border:"none",
            padding:"13px 0",fontSize:13,cursor:"pointer",letterSpacing:0.3,
            position:"relative"}}>
          🇯🇵 日本代表
          <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:"#E60033",
            position:"absolute",top:9,right:"18%",boxShadow:"0 0 5px rgba(230,0,51,0.7)"}}/>
        </button>
      </div>

      {/* ━━ ヒーローエリア ━━ */}
      <div style={{background:"linear-gradient(180deg,#E8F1FF 0%,#F2F7FF 50%,#FFFFFF 100%)",
        padding:"28px 22px 40px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        {/* スタジアムライト風 左 */}
        <div style={{position:"absolute",top:-80,left:-60,width:260,height:260,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(0,104,183,0.07) 0%,transparent 70%)",pointerEvents:"none"}}/>
        {/* スタジアムライト風 右 */}
        <div style={{position:"absolute",top:-80,right:-60,width:260,height:260,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(230,0,51,0.04) 0%,transparent 70%)",pointerEvents:"none"}}/>
        {/* 日の丸アクセント */}
        <div style={{position:"absolute",top:-30,right:-20,width:150,height:150,borderRadius:"50%",
          background:"rgba(230,0,51,0.04)",pointerEvents:"none"}}/>
        {/* 青赤ラインアクセント */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,
          background:"linear-gradient(90deg,#E60033 0%,#005BAC 50%,#0068B7 100%)",
          pointerEvents:"none"}}/>
        {/* センターサークル（大） */}
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:300,height:300,borderRadius:"50%",border:"1px solid rgba(0,91,172,0.06)",background:"transparent",pointerEvents:"none"}}/>
        {/* センターサークル（小） */}
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:160,height:160,borderRadius:"50%",border:"1px solid rgba(0,91,172,0.05)",background:"transparent",pointerEvents:"none"}}/>
        {/* 上部ペナルティアーク */}
        <div style={{position:"absolute",top:-60,left:"50%",transform:"translateX(-50%)",width:140,height:140,borderRadius:"50%",border:"1px solid rgba(0,91,172,0.07)",background:"transparent",pointerEvents:"none"}}/>
        {/* 芝生グラデーション（底部） */}
        <div style={{position:"absolute",bottom:3,left:0,right:0,height:60,background:"linear-gradient(0deg,rgba(199,239,212,0.14) 0%,transparent 100%)",pointerEvents:"none"}}/>

        <div style={{position:"relative",zIndex:1}}>
          {/* 上部ラベル */}
          <div style={{display:"inline-flex",alignItems:"center",gap:6,
            background:"rgba(0,104,183,0.07)",border:"1px solid rgba(0,104,183,0.18)",
            borderRadius:20,padding:"4px 14px",marginBottom:16}}>
            <span style={{color:"#E60033",fontSize:8,fontWeight:900,lineHeight:1}}>●</span>
            <span style={{color:"#0068B7",fontSize:10,fontWeight:800,letterSpacing:1.5}}>WORLD CUP FAN APP · 2026</span>
          </div>

          {/* ロゴ */}
          <div style={{marginBottom:10,display:"inline-block",position:"relative",
            filter:"drop-shadow(0 4px 16px rgba(0,91,172,0.25))"}}>
            <img src={LOGO_IMG} alt="W杯予想メーカー"
              style={{width:86,height:86,borderRadius:"50%",objectFit:"cover",
                boxShadow:"0 0 0 3px rgba(0,104,183,0.25), 0 8px 28px rgba(0,91,172,0.2)"}}/>
            <div style={{position:"absolute",bottom:0,right:0,width:20,height:20,borderRadius:"50%",
              background:"linear-gradient(135deg,#E60033,#CC0000)",border:"2.5px solid #FFFFFF",
              boxShadow:"0 2px 6px rgba(230,0,51,0.4)"}}/>
          </div>

          {/* 英字サブ */}
          <div style={{color:"#0068B7",fontSize:9,fontWeight:800,letterSpacing:4,marginBottom:4,opacity:0.6}}>
            FIFA WORLD CUP 2026
          </div>

          {/* タイトル */}
          <div style={{fontSize:30,fontWeight:900,letterSpacing:1,lineHeight:1.1,marginBottom:4}}>
            <span style={{color:"#102A43"}}>W杯</span><span style={{color:"#0068B7"}}>予想</span><span style={{color:"#102A43"}}>メーカー</span>
          </div>
          <div style={{color:"#E60033",fontSize:10,fontWeight:700,letterSpacing:4,marginBottom:14}}>
            WORLD CUP PREDICTION
          </div>

          {/* 特徴タグ */}
          <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:6,marginBottom:14}}>
            {[
              {label:"無料",      color:"#16A34A",bg:"rgba(22,163,74,0.08)",  border:"rgba(22,163,74,0.25)"},
              {label:"登録不要OK",color:"#0068B7",bg:"rgba(0,104,183,0.07)", border:"rgba(0,104,183,0.2)"},
              {label:"グループ予想",color:"#005BAC",bg:"rgba(0,91,172,0.07)",border:"rgba(0,91,172,0.2)"},
              {label:"ベスト11", color:"#E60033",bg:"rgba(230,0,51,0.06)",   border:"rgba(230,0,51,0.2)"},
            ].map((tg,i)=>(
              <span key={i} style={{background:tg.bg,border:`1px solid ${tg.border}`,borderRadius:20,
                padding:"3px 11px",color:tg.color,fontSize:10,fontWeight:700}}>
                {tg.label}
              </span>
            ))}
          </div>

          {/* コピー */}
          <div style={{color:"#102A43",fontSize:13,fontWeight:600,lineHeight:1.7,marginBottom:4}}>
            W杯の予想、LINEだけで管理するの限界じゃない？
          </div>
          <div style={{color:"#5B6B7A",fontSize:11,lineHeight:1.9,marginBottom:20}}>
            友達同士の優勝国・得点王・日本代表成績をまとめて管理。<br/>
            結果に応じて自動でランキング化。
          </div>

          {/* メインCTA */}
          <button style={{
            background:"linear-gradient(135deg,#005BAC 0%,#003F8C 100%)",
            color:"#FFFFFF",fontWeight:900,borderRadius:16,padding:0,fontSize:16,
            border:"none",cursor:"pointer",width:"100%",
            boxShadow:"0 10px 30px rgba(0,104,183,0.4),0 4px 12px rgba(0,60,133,0.3)",
            letterSpacing:0.3,marginBottom:12,overflow:"hidden",
          }} onClick={()=>nav("create")}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"14px 20px 8px",gap:10}}>
              <span style={{background:"rgba(255,255,255,0.2)",borderRadius:8,padding:"2px 8px",fontSize:11,fontWeight:800,letterSpacing:1,flexShrink:0}}>FREE</span>
              <span>無料で予想大会を作る</span>
              <span style={{fontSize:16,marginLeft:2}}>→</span>
            </div>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:9,letterSpacing:2,paddingBottom:8,fontWeight:700}}>CREATE YOUR TOURNAMENT</div>
          </button>

          {/* ベスト11 */}
          <button style={{
            background:"#FFFFFF",color:"#0068B7",fontWeight:700,borderRadius:14,padding:"12px 20px",fontSize:14,
            border:"1.5px solid rgba(0,104,183,0.25)",cursor:"pointer",width:"100%",
            boxShadow:"0 4px 16px rgba(0,91,172,0.1)",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          }} onClick={()=>nav("best11")}>
            <span>⚽</span>
            <span>ベスト11を作る</span>
            <span style={{background:"#E60033",color:"#FFFFFF",fontSize:9,fontWeight:800,
              borderRadius:10,padding:"2px 7px",letterSpacing:1}}>NEW</span>
          </button>
        </div>
      </div>

      {/* ━━ メインコンテンツ ━━ */}
      <div style={{padding:"16px 16px 0"}}>
        {/* 自分の大会 */}
        {myCreated.length>0&&<div style={{...crd,borderLeft:"3px solid #0068B7",marginBottom:12,padding:"14px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
            <span style={{color:"#0068B7",fontWeight:800,fontSize:13}}>👑 自分が作った大会</span>
            <span style={{color:"#0068B7",fontSize:9,fontWeight:700,letterSpacing:1,background:"rgba(0,104,183,0.08)",border:"1px solid rgba(0,104,183,0.2)",borderRadius:10,padding:"1px 7px",marginLeft:"auto"}}>CREATED</span>
          </div>
          {myCreated.map(id=><TCard key={id} id={id} isCreated={true}/>)}
        </div>}
        {myJoined.filter(id=>!myCreated.includes(id)).length>0&&<div style={{...crd,borderLeft:"3px solid #22C55E",marginBottom:12,padding:"14px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
            <span style={{color:"#16A34A",fontWeight:800,fontSize:13}}>✋ 参加中の大会</span>
            <span style={{color:"#16A34A",fontSize:9,fontWeight:700,letterSpacing:1,background:"rgba(22,163,74,0.08)",border:"1px solid rgba(22,163,74,0.25)",borderRadius:10,padding:"1px 7px",marginLeft:"auto"}}>JOINED</span>
          </div>
          {myJoined.filter(id=>!myCreated.includes(id)).map(id=><TCard key={id} id={id} isCreated={false}/>)}
        </div>}

        {/* ━━ ① まず予想する ━━ */}
        <div style={{marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:3,height:16,background:"#E60033",borderRadius:2,flexShrink:0}}/>
            <span style={{color:"#005BAC",fontSize:12,fontWeight:800,letterSpacing:0.5}}>まず予想する</span>
            <span style={{color:"#9BB5D0",fontSize:9,fontWeight:700,letterSpacing:2}}>PREDICTIONS</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {CARDS_PREDICT.map((m,i)=>(
              <div key={i} onClick={m.action} style={{background:"#FFFFFF",border:"1px solid rgba(0,91,172,0.12)",borderRadius:16,padding:"16px 14px",cursor:"pointer",boxShadow:"0 4px 16px rgba(0,91,172,0.07)",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${m.color},transparent)`}}/>
                <div style={{width:38,height:38,borderRadius:10,background:m.bg,border:`1px solid ${m.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:10}}>{m.icon}</div>
                <div style={{color:"#102A43",fontWeight:700,fontSize:13,marginBottom:3}}>{m.label}</div>
                <div style={{color:G.muted,fontSize:10,lineHeight:1.4}}>{m.sub}</div>
                <div style={{color:m.color,fontSize:10,marginTop:6,fontWeight:700}}>→ 開く</div>
              </div>
            ))}
          </div>
        </div>

        {/* ━━ ② 大会を使う ━━ */}
        <div style={{marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:3,height:16,background:"#E60033",borderRadius:2,flexShrink:0}}/>
            <span style={{color:"#005BAC",fontSize:12,fontWeight:800,letterSpacing:0.5}}>大会を使う</span>
            <span style={{color:"#9BB5D0",fontSize:9,fontWeight:700,letterSpacing:2}}>TOURNAMENT</span>
          </div>
          <button style={{...btnG,marginBottom:10,fontSize:14,padding:"14px 20px"}} onClick={()=>nav("create")}>🏆 大会を作成・管理する</button>
          <div style={{...crd,marginBottom:0}}>
            <div style={{color:G.gold,fontWeight:700,fontSize:12,marginBottom:10}}>🔗 大会IDで参加する</div>
            <div style={{display:"flex",gap:8}}>
              <input style={{...inp,flex:1,textTransform:"uppercase"}}
                placeholder="大会IDを入力 (例: AB12CD34)" value={joinId}
                onChange={e=>{setJoinId(e.target.value);setJoinErr("");}}
                onKeyDown={e=>e.key==="Enter"&&joinByID()}/>
              <button onClick={joinByID} style={{background:G.gold,color:"#FFFFFF",border:"none",borderRadius:10,padding:"0 16px",fontWeight:700,cursor:"pointer",flexShrink:0,fontSize:13}}>参加</button>
            </div>
            {joinErr&&<div style={{marginTop:8}}><Err msg={joinErr}/></div>}
          </div>
        </div>

        {/* ━━ ③ データを見る ━━ */}
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:3,height:16,background:"#E60033",borderRadius:2,flexShrink:0}}/>
            <span style={{color:"#005BAC",fontSize:12,fontWeight:800,letterSpacing:0.5}}>データを見る</span>
            <span style={{color:"#9BB5D0",fontSize:9,fontWeight:700,letterSpacing:2}}>STATS & DATA</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            {CARDS_DATA.map((m,i)=>(
              <div key={i} onClick={m.action} style={{background:"#FFFFFF",border:"1px solid rgba(0,91,172,0.12)",borderRadius:16,padding:"16px 14px",cursor:"pointer",boxShadow:"0 4px 16px rgba(0,91,172,0.07)",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${m.color},transparent)`}}/>
                <div style={{width:38,height:38,borderRadius:10,background:m.bg,border:`1px solid ${m.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:10}}>{m.icon}</div>
                <div style={{color:"#102A43",fontWeight:700,fontSize:13,marginBottom:3}}>{m.label}</div>
                <div style={{color:G.muted,fontSize:10,lineHeight:1.4}}>{m.sub}</div>
                <div style={{color:m.color,fontSize:10,marginTop:6,fontWeight:700}}>→ 開く</div>
              </div>
            ))}
          </div>
          <div onClick={()=>nav("moremenu")} style={{background:"#FFFFFF",border:"1px solid rgba(139,92,246,0.3)",borderRadius:16,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 16px rgba(0,91,172,0.06)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 0 12px rgba(139,92,246,0.2)"}}>📋</div>
              <div>
                <div style={{color:"#102A43",fontWeight:700,fontSize:13}}>もっと見る</div>
                <div style={{color:G.muted,fontSize:10,marginTop:2}}>AI予想・グループ表・日本代表など</div>
              </div>
            </div>
            <div style={{color:"#A78BFA",fontSize:14,fontWeight:700}}>→</div>
          </div>
        </div>

        {/* 料金案内 */}
        <div style={{background:"#FFFFFF",
          borderRadius:16,padding:"16px",marginBottom:14,border:"1px solid #D9E8FF",boxShadow:"0 4px 16px rgba(0,91,172,0.06)"}}>
          <div style={{textAlign:"center",marginBottom:10}}>
            <div style={{color:"#102A43",fontWeight:700,fontSize:13}}>5人まで無料でスタート。</div>
            <div style={{color:G.muted,fontSize:11,marginTop:4,lineHeight:1.6}}>
              友達が増えたら、人数に合わせてアップグレードできます。
            </div>
          </div>
          <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:"1px solid #D9E8FF"}}>
            {[["無料","5人","0円","#16A34A"],["S","10人","¥500","#0068B7"],["P","30人","¥980","#D4AF37"],["G","50人","¥1,480","#005BAC"]].map(([lbl,ppl,price,col],i)=>(
              <div key={i} onClick={()=>nav("upgrade")} style={{flex:1,padding:"8px 2px",textAlign:"center",
                borderRight:i<3?"1px solid #D9E8FF":"none",cursor:"pointer",
                background:i===0?"rgba(22,163,74,0.07)":"transparent"}}>
                <div style={{color:col,fontSize:9,fontWeight:800,marginBottom:1}}>{lbl}</div>
                <div style={{color:"#102A43",fontSize:10,fontWeight:700}}>{ppl}</div>
                <div style={{color:G.muted,fontSize:8}}>{price}</div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:8}}>
            <span onClick={()=>nav("upgrade")} style={{color:G.gold,fontSize:11,cursor:"pointer",
              textDecoration:"underline",textDecorationColor:"rgba(0,91,172,0.3)"}}>
              詳しいプラン内容を見る →
            </span>
          </div>
        </div>

        <CoffeeSupport compact={true}/>
        <AffiliateBlock title="🎉 W杯観戦をもっと楽しむ" keys={["streaming","uniform","goods","pizza"]} compact={true}/>
        <LegalFooter/>
        <div style={{marginTop:12,background:"rgba(0,91,172,0.04)",borderRadius:12,padding:"10px 14px",border:"1px solid #D9E8FF",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18,flexShrink:0}}>📱</span>
          <div style={{color:G.muted,fontSize:11,lineHeight:1.6}}>ホーム画面に追加すると、次回からアプリのように開けます</div>
        </div>
      </div>
    </div>
  );
}


/* ── Create ── */
function PgCreate({nav,goT}){
  const PRESETS={
    lite:{label:"⚡ ライト大会",color:"#0EA5E9",bg:"rgba(14,165,233,0.08)",desc:"初めての人向け。1分で参加できます。",settings:{winner:true,runnerUp:false,topScorer:false,japanResult:true,japanMvp:false,assistKing:false,tournamentMvp:false,best4:false,japanFirstMatchScore:false}},
    standard:{label:"⚽ スタンダード大会",color:"#0068B7",bg:"rgba(0,104,183,0.08)",desc:"友達同士で一番盛り上がる基本セット。",settings:{winner:true,runnerUp:true,topScorer:true,japanResult:true,japanMvp:true,assistKing:false,tournamentMvp:false,best4:false,japanFirstMatchScore:false}},
    gachi:{label:"🔥 ガチ大会",color:"#E60033",bg:"rgba(230,0,51,0.06)",desc:"サッカー好き向け。MVPやアシスト王まで予想。",settings:{winner:true,runnerUp:true,topScorer:true,japanResult:true,japanMvp:true,assistKing:true,tournamentMvp:true,best4:true,japanFirstMatchScore:true}},
  };
  const PRED_ITEMS=[
    {key:"winner",label:"🥇 優勝国"},
    {key:"runnerUp",label:"🥈 準優勝国"},
    {key:"topScorer",label:"⚽ 得点王"},
    {key:"assistKing",label:"🎯 アシスト王"},
    {key:"tournamentMvp",label:"🏅 大会MVP"},
    {key:"japanResult",label:"🇯🇵 日本代表の成績"},
    {key:"japanMvp",label:"🌟 日本代表MVP"},
    {key:"best4",label:"🏆 ベスト4（4チーム）"},
    {key:"japanFirstMatchScore",label:"📊 日本代表初戦スコア"},
  ];
  const [form,setForm]=useState({name:"",creatorName:"",maxParticipants:5,adminPasscode:"",deadline:"",allowLateJoin:true});
  const [predSet,setPredSet]=useState({...DEFAULT_PRED_SETTINGS});
  const [selectedPreset,setSelectedPreset]=useState("standard");
  const applyPreset=(key)=>{setSelectedPreset(key);setPredSet({...PRESETS[key].settings});};
  const toggleItem=(key)=>{setSelectedPreset(null);setPredSet(p=>({...p,[key]:!p[key]}));};
  const [err,setErr]=useState("");const [loading,setLoading]=useState(false);
  const setF=k=>v=>setForm(f=>({...f,[k]:v}));
  const submit=async(overrideMax=null)=>{
    if(!form.name.trim()||!form.creatorName.trim()||!form.adminPasscode.trim()){setErr("すべての項目を入力してください");return;}
    if(form.adminPasscode.length<3){setErr("パスコードは3文字以上にしてください");return;}
setLoading(true);
    const maxP=overrideMax!==null?overrideMax:Number(form.maxParticipants);
    const t={id:genId(),name:form.name.trim(),creatorName:form.creatorName.trim(),maxParticipants:maxP,adminPasscode:form.adminPasscode.trim(),participants:[],results:null,plan:"free",deadline:form.deadline||null,predictionSettings:predSet,allowLateJoin:form.allowLateJoin!==false,createdAt:new Date().toISOString()};
    saveMyCreated(t.id);trackEvent("create_tournament",{tournamentId:t.id,page:"create"});await goT(t);setLoading(false);
  };
  const reqPlan=getRequiredPlanByPeople(form.maxParticipants);
  return(
    <div style={{padding:"20px 18px 40px"}}><Back onClick={()=>nav("home")}/>
      <div style={{color:G.gold,fontSize:21,fontWeight:900,marginBottom:4}}>予想大会を作る</div>
      <div style={{color:G.muted,fontSize:13,marginBottom:20}}>情報を入力して大会を作成しよう</div>
      <div style={crd}>
        <FInput label="大会名 ＊" placeholder="例: 2026 友達W杯予想大会" value={form.name} onChange={setF("name")}/>
        <FInput label="作成者名 ＊" placeholder="例: たろう" value={form.creatorName} onChange={setF("creatorName")}/>
        <div style={{marginBottom:16}}>
          <label style={lbl}>👥 何人で遊ぶ？</label>
          <div style={{color:G.muted,fontSize:11,marginBottom:12}}>人数に応じて最適なプランを自動で表示します</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20,marginBottom:14}}>
            <button onClick={()=>setForm(f=>({...f,maxParticipants:Math.max(2,f.maxParticipants-1)}))} style={{width:52,height:52,borderRadius:14,background:"rgba(0,104,183,0.03)",border:"2px solid #D9E8FF",color:"#0068B7",fontSize:28,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>－</button>
            <div style={{textAlign:"center",minWidth:90}}>
              <div style={{color:G.navy,fontSize:42,fontWeight:900,lineHeight:1}}>{form.maxParticipants}</div>
              <div style={{color:G.muted,fontSize:12,marginTop:3}}>人</div>
            </div>
            <button onClick={()=>setForm(f=>({...f,maxParticipants:Math.min(50,f.maxParticipants+1)}))} style={{width:52,height:52,borderRadius:14,background:"rgba(0,104,183,0.03)",border:"2px solid #D9E8FF",color:"#0068B7",fontSize:28,cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>＋</button>
          </div>
          <div style={{background:reqPlan.key==="free"?"rgba(34,197,94,0.08)":"rgba(0,104,183,0.06)",border:`1px solid ${reqPlan.key==="free"?"rgba(34,197,94,0.3)":"rgba(0,104,183,0.3)"}`,borderRadius:12,padding:"12px 14px"}}>
            {reqPlan.key==="free"&&<div style={{color:"#22C55E",fontWeight:800,fontSize:13,marginBottom:2}}>✅ 無料プランで利用できます</div>}
            {reqPlan.key==="free"&&<div style={{color:G.muted,fontSize:12}}>{FREE_LIMIT}人まで無料</div>}
            {reqPlan.key!=="free"&&<div style={{color:G.gold,fontWeight:800,fontSize:13,marginBottom:4}}>💳 この人数では有料プランが必要です</div>}
            {reqPlan.key!=="free"&&<div style={{color:G.navy,fontSize:13}}><span style={{color:reqPlan.key==="standard"?"#22C55E":reqPlan.key==="premium"?G.gold:"#A78BFA",fontWeight:700}}>{reqPlan.label}プラン</span><span style={{color:G.muted}}> · {reqPlan.people}人まで · </span><span style={{color:G.gold,fontWeight:700}}>¥{reqPlan.price.toLocaleString()}</span></div>}
            {reqPlan.key!=="free"&&<div style={{color:G.muted,fontSize:11,marginTop:5}}>カード / Apple Pay / Google Pay</div>}
            {reqPlan.key!=="free"&&<div style={{color:G.muted,fontSize:10,marginTop:1}}>対応端末ではウォレット決済が使えます · PayPayは今後対応予定</div>}
          </div>
        </div>
        <FInput label="管理用パスコード ＊" placeholder="3文字以上" type="password" value={form.adminPasscode} onChange={setF("adminPasscode")}/>
      </div>
      {/* 予想項目選択 */}
      <div style={{...crd,border:"1px solid #C9DDF5"}}>
        <div style={{color:G.gold,fontWeight:700,fontSize:13,marginBottom:12}}>⚽ 予想項目を選ぶ</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
          {Object.entries(PRESETS).map(([key,p])=>(
            <div key={key} onClick={()=>applyPreset(key)} style={{background:selectedPreset===key?p.bg:"transparent",border:`2px solid ${selectedPreset===key?p.color:"#C9DDF5"}`,borderRadius:12,padding:"12px 14px",cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{color:selectedPreset===key?p.color:G.muted,fontWeight:700,fontSize:14}}>{p.label}</span>
                {selectedPreset===key&&<span style={{color:p.color,fontSize:14}}>✓</span>}
              </div>
              <div style={{color:G.muted,fontSize:11}}>{p.desc}</div>
            </div>
          ))}
        </div>
        <div style={{color:G.muted,fontSize:11,fontWeight:700,marginBottom:8,letterSpacing:0.5}}>個別に調整する</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {PRED_ITEMS.map(item=>(
            <label key={item.key} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"6px 8px",borderRadius:8,background:predSet[item.key]?"rgba(0,104,183,0.06)":"transparent"}}>
              <input type="checkbox" checked={!!predSet[item.key]} onChange={()=>toggleItem(item.key)} style={{width:16,height:16,accentColor:G.gold,cursor:"pointer"}}/>
              <span style={{color:predSet[item.key]?G.navy:G.muted,fontSize:13}}>{item.label}</span>
            </label>
          ))}
        </div>
        <div style={{marginTop:10,background:G.dark,borderRadius:8,padding:"8px 12px"}}>
          <div style={{color:G.muted,fontSize:11}}>選択中: {Object.values(predSet).filter(Boolean).length}項目</div>
        </div>
      </div>
      <div style={crd}>
        <div style={{marginBottom:16}}>
          <label style={lbl}>⏰ 予想締め切り日時（任意）</label>
          <input style={inp} type="datetime-local" value={form.deadline} onChange={e=>setF("deadline")(e.target.value)}/>
          <div style={{color:G.muted,fontSize:11,marginTop:4}}>設定すると締め切り後は予想できなくなります</div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={lbl}>途中参加の設定</label>
          <div style={{display:"flex",gap:8}}>
            {[{v:true,lb:"✅ 途中参加OK（推奨）"},{v:false,lb:"🚫 途中参加NG"}].map(opt=>(
              <button key={opt.v} onClick={()=>setForm(f=>({...f,allowLateJoin:opt.v}))} style={{flex:1,background:form.allowLateJoin===opt.v?G.gold:"transparent",color:form.allowLateJoin===opt.v?"#fff":"#888",border:`1.5px solid ${form.allowLateJoin===opt.v?G.gold:"#D9E8FF"}`,borderRadius:10,padding:"9px 8px",fontSize:12,cursor:"pointer",fontWeight:form.allowLateJoin===opt.v?700:400}}>{opt.lb}</button>
            ))}
          </div>
          <div style={{color:G.muted,fontSize:11,marginTop:4}}>途中参加OKにすると、締め切り後も新規参加できます（残り項目でのみ得点）</div>
        </div>
      </div>
      <Err msg={err}/>
      {reqPlan.key==="free"&&<button style={btnG} onClick={()=>submit()} disabled={loading}>{loading?"作成中...":"🏆 無料で予想大会を作る"}</button>}
      {reqPlan.key!=="free"&&<a href={reqPlan.url} target="_blank" rel="noopener noreferrer" style={{...btnG,display:"block",textDecoration:"none",textAlign:"center",marginBottom:6}}>この人数でかんたん決済へ進む</a>}
      {reqPlan.key!=="free"&&<div style={{color:G.muted,fontSize:10,textAlign:"center",marginBottom:8}}>※現在はテスト決済です。本番公開時に正式リンクへ切り替えます</div>}
      {reqPlan.key!=="free"&&<button style={{...btnGr,fontSize:12,padding:"10px"}} onClick={()=>submit(FREE_LIMIT)} disabled={loading}>{loading?"作成中...":"まず5人で作成する（後でアップグレード可）"}</button>}
    </div>
  );
}

/* ── Tournament ── */
function PgTournament({tourn:t,setTourn,nav,goCountry}){
  const [copied,setCopied]=useState(false);
  useEffect(()=>{if(!t?.id)return;loadT(t.id).then(f=>{if(f)setTourn(f);});const unsub=subscribeToTournament(t.id,setTourn);return unsub;},[t?.id]);
  if(!t)return null;
  const url=`${window.location.origin}${window.location.pathname}#t-${t.id}`;
  const lineMsg=encodeURIComponent(`W杯予想大会を作った！
優勝国・得点王・日本代表の成績を予想して参加して！
参加はこちら👇
${url}`);
  const copy=async()=>{try{await navigator.clipboard.writeText(url);}catch{}setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const full=t.participants.length>=t.maxParticipants;
  const isPaid=t.plan&&t.plan!=="free";
  const deadlinePassed=isDeadlinePassed(t.deadline);
  return(
    <div style={{paddingBottom:40}}>
      <div style={{padding:"14px 18px 0"}}><Back onClick={()=>{window.location.hash="";nav("home");}}/></div>
      <div style={{background:"linear-gradient(180deg,#061533 0%,#0a1f4c 100%)",padding:"16px 20px 26px",textAlign:"center",position:"relative",overflow:"hidden",borderBottom:"1px solid rgba(255,255,255,0.08)"}}><div style={{position:"absolute",top:-40,left:"50%",transform:"translateX(-50%)",width:300,height:200,background:"radial-gradient(ellipse,rgba(0,104,183,0.07) 0%,transparent 65%)",pointerEvents:"none"}}/>
        <img src={LOGO_IMG} alt="ロゴ" style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",marginBottom:6,boxShadow:"0 0 0 3px rgba(0,104,183,0.2),0 4px 16px rgba(0,91,172,0.15)"}}/>
        <div style={{color:G.gold,fontSize:19,fontWeight:900}}>{t.name}</div>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:6,background:isPaid?"rgba(0,104,183,0.08)":"rgba(0,0,0,0.03)",border:`1px solid ${isPaid?"rgba(0,104,183,0.25)":"#D9E8FF"}`,borderRadius:20,padding:"3px 12px"}}>
          <span style={{color:isPaid?G.gold:G.muted,fontSize:11,fontWeight:700}}>{isPaid?`★ ${STRIPE[t.plan]?.label}プラン`:"無料プラン"}</span>
          <span style={{color:"#D9E8FF",fontSize:10}}>|</span>
          <span style={{color:t.participants.length>=t.maxParticipants?"#E60033":"#16A34A",fontSize:11,fontWeight:700}}>{t.participants.length} / {t.maxParticipants}人</span>
        </div>
        {t.deadline&&<div style={{marginTop:6,display:"inline-block",background:deadlinePassed?"rgba(230,0,51,0.08)":"rgba(22,163,74,0.08)",borderRadius:8,padding:"4px 12px"}}>
          <span style={{color:deadlinePassed?"#E60033":"#16A34A",fontSize:12,fontWeight:700}}>{deadlinePassed?"⛔ 予想締め切り済み":"⏰ 締め切り: "+fmtDeadline(t.deadline)}</span>
        </div>}
        <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:14}}>
          <div style={{background:"rgba(0,104,183,0.07)",border:"1px solid rgba(0,104,183,0.2)",borderRadius:14,padding:"10px 20px",textAlign:"center",minWidth:80}}>
            <div style={{color:G.gold,fontWeight:900,fontSize:36,lineHeight:1}}>{t.participants.length}</div>
            <div style={{color:G.muted,fontSize:10,fontWeight:700,letterSpacing:1,marginTop:3}}>PLAYERS</div>
          </div>
          <div style={{display:"flex",alignItems:"center",color:"#C9DDF5",fontSize:24}}>/</div>
          <div style={{background:"rgba(0,104,183,0.04)",border:"1px solid #D9E8FF",borderRadius:14,padding:"10px 20px",textAlign:"center",minWidth:80}}>
            <div style={{color:"#5B6B7A",fontWeight:700,fontSize:28,lineHeight:1}}>{t.maxParticipants}</div>
            <div style={{color:G.muted,fontSize:10,fontWeight:700,letterSpacing:1,marginTop:3}}>MAX</div>
          </div>
        </div>
        <div style={{marginTop:10,display:"inline-flex",alignItems:"center",gap:5,background:"rgba(22,163,74,0.08)",borderRadius:20,padding:"4px 12px"}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"#22C55E",display:"inline-block",animation:"pulseDot 1.5s ease-in-out infinite"}}/>
          <span style={{color:"#16A34A",fontSize:10,fontWeight:700}}>リアルタイム更新中</span>
        </div>
      </div>
      <div style={{padding:"12px 18px 0"}}>
        <div style={{...crd,border:`1.5px solid ${G.gold}44`}}>
          <div style={{color:G.gold,fontWeight:700,marginBottom:10,fontSize:13}}>📣 友達を招待しよう！</div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <input readOnly style={{...inp,flex:1,fontSize:11,color:"#888"}} value={url}/>
            <button onClick={copy} style={{background:G.gold,color:"#FFFFFF",border:"none",borderRadius:10,padding:"0 14px",fontWeight:700,cursor:"pointer",flexShrink:0,fontSize:12}}>{copied?"✓ OK":"コピー"}</button>
          </div>
          <a href={`https://line.me/R/msg/text/?${lineMsg}`} target="_blank" rel="noopener noreferrer" style={{display:"block",background:"linear-gradient(135deg,#06C755,#049A43)",color:"#fff",borderRadius:14,padding:14,textAlign:"center",fontWeight:800,textDecoration:"none",fontSize:15,boxShadow:"0 4px 20px rgba(6,199,85,0.35)",letterSpacing:0.3}}>📱 LINEで友達に送る</a>
          <div style={{marginTop:10,textAlign:"center"}}><div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.04)",border:"1px solid #D9E8FF",borderRadius:12,padding:"6px 16px"}}><span style={{color:G.muted,fontSize:10,fontWeight:700,letterSpacing:1}}>大会ID</span><strong style={{color:G.gold,letterSpacing:3,fontSize:13}}>{t.id}</strong></div></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {deadlinePassed
            ?<div style={{background:"rgba(255,60,60,0.1)",color:"#f88",borderRadius:12,padding:14,textAlign:"center",fontSize:13}}>⛔ 予想の締め切りが終了しました</div>
            :full
              ?<div style={{background:"rgba(255,60,60,0.1)",color:"#f88",borderRadius:12,padding:14,textAlign:"center",fontSize:13}}>参加上限に達しました</div>
              :<button style={btnG} onClick={()=>nav("join")}>✋ 参加する</button>}
          <button style={{...btnG,background:"linear-gradient(135deg,#E60033 0%,#AA0025 100%)",boxShadow:"0 8px 24px rgba(230,0,51,0.28)"}} onClick={()=>nav("matches")}>⚽ 試合予想・ライブランキング</button>
          <button style={btnO} onClick={()=>nav("predictions")}>👥 みんなの予想を見る</button>
          <button style={btnO} onClick={()=>nav("ranking")}>🏆 ランキングを見る</button>
          <button style={btnO} onClick={()=>nav("stats")}>📊 詳細統計を見る</button>
          <button style={btnO} onClick={()=>nav("bracket")}>🏆 トーナメント表・予想マップ</button>
          <button style={{...btnO,borderColor:"#F9731688",color:"#FB923C"}} onClick={()=>{nav("survival");trackEvent("open_survival_check",{tournamentId:t.id});}}>🔥 予想生存チェック</button>
          <button style={btnO} onClick={()=>nav("groups")}>🗂️ グループ表・FIFAランキング</button>
          <button style={btnGr} onClick={()=>nav("admin")}>🔐 管理者用：結果入力・参加者管理</button>
          {(()=>{
            const remaining=t.maxParticipants-t.participants.length;
            const isPaidPlan=t.plan&&t.plan!=="free";
            if(full)return(
              <div style={{background:"rgba(14,165,233,0.07)",border:"1px solid rgba(14,165,233,0.25)",borderRadius:12,padding:"12px 14px"}}>
                <div style={{color:G.muted,fontSize:12,marginBottom:8}}>👥 参加上限に達しました。人数を増やすにはアップグレードが必要です。</div>
                <button style={{...btnG,padding:"11px",fontSize:13}} onClick={()=>nav("upgrade")}>⬆️ 人数を増やす</button>
              </div>
            );
            if(!isPaidPlan&&remaining<=1)return(
              <div style={{background:"rgba(0,91,172,0.06)",border:"1px solid rgba(0,91,172,0.2)",borderRadius:12,padding:"10px 14px"}}>
                <div style={{color:G.gold,fontSize:12,marginBottom:6}}>⚡ もうすぐ参加上限です。人数を増やすならアップグレードできます。</div>
                <button style={{...btnGr,color:G.gold,borderColor:G.gold+"55",padding:"9px"}} onClick={()=>nav("upgrade")}>アップグレードを見る</button>
              </div>
            );
            if(!isPaidPlan)return(
              <button style={{...btnGr,color:G.muted,borderColor:"#C9DDF5",fontSize:12}} onClick={()=>nav("upgrade")}>
                5人まで無料。友達が増えたらアップグレードできます →
              </button>
            );
            return null;
          })()}
        </div>
        <div style={{marginTop:4}}>
          <ChatBox tournamentId={t.id} currentUser={null} title={`${t.name} チャット`} maxHeight={280}/>
        </div>
        <CoffeeSupport compact={true}/>
        <AffiliateBlock title="🏟️ みんなで観戦する準備" keys={["pizza","drink","projector","streaming"]} compact={true}/>
      </div>
    </div>
  );
}

/* ── Join ── */
function PgJoin({tourn:t,nav,update,setMyId}){
  const [nick,setNick]=useState("");const [icon,setIcon]=useState("⚽");const [err,setErr]=useState("");const [showUpgrade,setShowUpgrade]=useState(false);const [loading,setLoading]=useState(false);
  const deadlinePassed=isDeadlinePassed(t.deadline);
  const isLateJoin=deadlinePassed&&t.allowLateJoin;
  const join=async()=>{
    if(deadlinePassed&&!t.allowLateJoin){setErr("予想の締め切りが終了しています");return;}
    if(!nick.trim()){setErr("ニックネームを入力してください");return;}
const fresh=await loadT(t.id);const cur=fresh||t;
    if(isDeadlinePassed(cur.deadline)){setErr("予想の締め切りが終了しています");return;}
if(cur.participants.length>=getPlanLimit(cur.plan)){
      setShowUpgrade(true);
      return;
    }
    setLoading(true);const p={id:genId(),nickname:nick.trim(),icon,predictions:null,points:0,joinedLate:isLateJoin||false,coins:{...COIN_INIT}};
    const updated={...cur,participants:[...cur.participants,p]};
    saveMyJoined(cur.id);
    try{localStorage.setItem("wcup_myid_"+cur.id,p.id);}catch{}
    trackEvent("join_tournament",{tournamentId:cur.id,page:"join"});await update(updated);setMyId(p.id);nav("home");setLoading(false);
  };
  if(deadlinePassed)return(
    <div className="screen">
      <DsBackRow onClick={()=>nav("tournament")}/>
      <div className="wrap section">
        <div className="card lg" style={{textAlign:"center",padding:"32px 20px"}}>
          <div style={{fontSize:40,marginBottom:12}}>⛔</div>
          <div style={{color:"#ff6066",fontWeight:800,fontSize:16,marginBottom:8}}>予想の締め切りが終了しました</div>
          <div style={{color:"var(--muted)",fontSize:13}}>締め切り: {fmtDeadline(t.deadline)}</div>
        </div>
      </div>
    </div>
  );
  return(
    <div className="screen">
      <DsPageHead onBack={()=>nav("tournament")} eyebrow="JOIN TOURNAMENT" title="参加する"/>
      <div className="wrap section tight">
        {t.deadline&&(
          <div className="banner blue" style={{marginBottom:14}}>
            <DsIcon name="clock" size={15}/> ⏰ 締め切り: {fmtDeadline(t.deadline)}
          </div>
        )}
        <div className="card lg">
          <label className="field-lbl">ニックネーム</label>
          <input className="tinput" placeholder="例：サッカー太郎" value={nick} onChange={e=>setNick(e.target.value)} maxLength={20}/>
          <label className="field-lbl" style={{marginTop:22}}>アイコンを選ぶ</label>
          <div className="icon-grid">
            {ICONS.map(ic=>(
              <div key={ic} className={"icpick"+(icon===ic?" on":"")} onClick={()=>setIcon(ic)}>
                <span style={{fontSize:20}}>{ic}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:16,textAlign:"center",padding:"14px",background:"rgba(255,255,255,0.03)",borderRadius:13,border:"1px solid var(--line)"}}>
            <div style={{fontSize:32}}>{icon}</div>
            <div style={{color:"var(--txt)",fontSize:14,fontWeight:700,marginTop:6}}>{nick||"（名前未入力）"}</div>
          </div>
        </div>
      </div>
      {showUpgrade?(
        <div className="wrap section">
          <div className="card">
            <div style={{color:"#ff6066",fontWeight:800,fontSize:14,marginBottom:4}}>⚠️ 参加上限に達しています</div>
            <div style={{color:"var(--muted)",fontSize:12,marginBottom:14}}>この大会は現在のプランの参加上限に達しました。大会作成者がプランをアップグレードすると参加できます。</div>
            {[
              {key:"standard",label:"スタンダード",people:STRIPE.standard.people,price:STRIPE.standard.price,url:STRIPE.standard.url,color:"#0068B7"},
              {key:"premium", label:"プレミアム",  people:STRIPE.premium.people, price:STRIPE.premium.price, url:STRIPE.premium.url, color:"#D4AF37"},
              {key:"group",   label:"グループ",    people:STRIPE.group.people,   price:STRIPE.group.price,   url:STRIPE.group.url,   color:"#005BAC"},
            ].map(plan=>(
              <div key={plan.key} style={{background:"rgba(255,255,255,0.03)",border:`1.5px solid ${plan.color}44`,borderRadius:12,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                <div>
                  <div style={{color:plan.color,fontWeight:800,fontSize:13}}>{plan.label}プラン</div>
                  <div style={{color:"var(--muted)",fontSize:12,marginTop:2}}>{plan.people}人まで参加可能</div>
                  <div style={{color:"var(--gold)",fontSize:15,fontWeight:900,marginTop:2}}>¥{plan.price.toLocaleString()}</div>
                  <div style={{color:"var(--dim)",fontSize:10,marginTop:4}}>カード / Apple Pay / Google Pay</div>
                  <div style={{color:"var(--dim)",fontSize:9,marginTop:1}}>対応端末ではウォレット決済が使えます</div>
                </div>
                <a href={plan.url} target="_blank" rel="noopener noreferrer" style={{background:plan.color,color:plan.key==="premium"?"#0A1400":"#fff",borderRadius:10,padding:"9px 14px",fontWeight:800,fontSize:12,textDecoration:"none",whiteSpace:"nowrap",flexShrink:0,textAlign:"center"}}>かんたん<br/>決済へ進む</a>
              </div>
            ))}
            <button onClick={()=>setShowUpgrade(false)} className="btn btn-dark sm" style={{marginTop:4}}>← 戻る</button>
          </div>
        </div>
      ):(
        <div className="wrap section">
          {err&&<div className="banner blue" style={{marginBottom:12,borderColor:"rgba(255,80,80,.4)",background:"rgba(255,60,60,.1)",color:"#ff8080"}}>⚠️ {err}</div>}
          <button className="btn btn-red lg" onClick={join} disabled={loading}>
            {loading?"参加中...":"参加して予想を入力する"}<DsIcon name="arrowRight" size={20} stroke={2.2}/>
          </button>
          <div className="foot" style={{marginTop:14}}>あとからプロフィールで変更できます</div>
        </div>
      )}
    </div>
  );
}

/* ── Share Cards ── */
function ShareCardBg(){
  return(
    <>
      <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,opacity:0.5,
        backgroundImage:"radial-gradient(1.5px 1.5px at 15% 10%,#fff,transparent),radial-gradient(1.2px 1.2px at 70% 8%,#dce8ff,transparent),radial-gradient(1.5px 1.5px at 42% 20%,#fff,transparent),radial-gradient(1px 1px at 85% 15%,#fff,transparent)"}}/>
      <div style={{position:"absolute",top:-60,left:-60,width:260,height:260,borderRadius:"50%",background:"radial-gradient(circle,rgba(100,160,255,0.25),transparent 65%)"}}/>
      <div style={{position:"absolute",top:-30,right:-50,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(230,0,51,0.2),transparent 65%)"}}/>
    </>
  );
}
function ShareCardMatchPrediction({matchId,pick,tournName}){
  const m=MATCHES.find(x=>x.id===matchId)||{home:"?",away:"?",kickoff:""};
  const pickLabel=pick==="home"?`${m.home} 勝ち`:pick==="away"?`${m.away} 勝ち`:"引き分け";
  const ko=m.kickoff?new Date(m.kickoff).toLocaleString("ja-JP",{month:"numeric",day:"numeric",weekday:"short",hour:"2-digit",minute:"2-digit"}):"";
  return(
    <div style={{width:540,height:960,overflow:"hidden",fontFamily:'"Noto Sans JP",system-ui,sans-serif',display:"flex",flexDirection:"column"}}>
      {/* 上半分: 侍ブルーグラデ */}
      <div style={{height:640,background:"linear-gradient(180deg,#061533 0%,#0a1f4c 50%,#0d2a5e 100%)",color:"#fff",padding:"44px 40px 32px",position:"relative",display:"flex",flexDirection:"column",flexShrink:0}}>
        <ShareCardBg/>
        <div style={{position:"relative",zIndex:2}}>
          <div style={{fontSize:18,letterSpacing:5,fontWeight:800,opacity:0.7}}>FIFA WORLD CUP 2026</div>
          <div style={{fontSize:12,color:"#C9D6EC",marginTop:4}}>北中米3カ国共催・史上初の48カ国</div>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",gap:18,position:"relative",zIndex:2}}>
          {m.stage==="group"&&m.group&&<div style={{color:"#C9D6EC",fontSize:13,fontWeight:700}}>グループ{m.group}ステージ</div>}
          <div style={{display:"flex",alignItems:"center",gap:20,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:20,padding:"20px 32px"}}>
            <div style={{textAlign:"center"}}>
              <FlagImg country={m.home} size={48}/>
              <div style={{color:"#fff",fontWeight:800,fontSize:16,marginTop:8}}>{m.home}</div>
            </div>
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:22,fontWeight:900}}>VS</div>
            <div style={{textAlign:"center"}}>
              <FlagImg country={m.away} size={48}/>
              <div style={{color:"#fff",fontWeight:800,fontSize:16,marginTop:8}}>{m.away}</div>
            </div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{color:"rgba(255,255,255,0.55)",fontSize:13,marginBottom:10,fontWeight:700}}>私の予想</div>
            <div style={{background:"linear-gradient(135deg,#E60033,#AA0025)",color:"#fff",borderRadius:16,padding:"16px 40px",fontSize:22,fontWeight:900,boxShadow:"0 8px 24px rgba(230,0,51,0.45)",letterSpacing:1}}>{pickLabel}</div>
            <div style={{color:"#C9D6EC",fontSize:13,marginTop:12,fontWeight:700}}>当たれば +3pt 🎯</div>
          </div>
          {ko&&<div style={{color:"rgba(255,255,255,0.45)",fontSize:12,fontWeight:600}}>⏰ {ko} KO</div>}
        </div>
      </div>
      {/* 下半分: 薄ネイビー */}
      <div style={{height:320,background:"#f0f4fa",color:"#0a1f4c",padding:"28px 40px",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{flex:1}}>
          {tournName&&<div style={{color:"#005BAC",fontSize:13,fontWeight:700,marginBottom:8}}>🏆 {tournName}</div>}
          <div style={{color:"#5B6B85",fontSize:13,fontWeight:700}}>この試合の予想を一緒にしよう！</div>
        </div>
        <div style={{textAlign:"center",paddingTop:20,borderTop:"1.5px solid #C9D6EC"}}>
          <div style={{fontSize:18,fontWeight:900,color:"#0a1f4c"}}>W杯 2026 予想メーカー</div>
          <div style={{fontSize:12,color:"#5B6B85",marginTop:4}}>xiaokoulu-maker.github.io/wcup-yosou</div>
        </div>
      </div>
    </div>
  );
}
function ShareCardChampion({pred,tournName}){
  const winner=pred?.winner||"？";
  const topScorer=pred?.topScorer;
  const japanResult=pred?.japanResult;
  return(
    <div style={{width:540,height:960,overflow:"hidden",fontFamily:'"Noto Sans JP",system-ui,sans-serif',display:"flex",flexDirection:"column"}}>
      {/* 上半分 */}
      <div style={{height:640,background:"linear-gradient(180deg,#061533 0%,#0a1f4c 50%,#0d2a5e 100%)",color:"#fff",padding:"44px 40px 32px",position:"relative",display:"flex",flexDirection:"column",flexShrink:0}}>
        <ShareCardBg/>
        <div style={{position:"relative",zIndex:2}}>
          <div style={{fontSize:18,letterSpacing:5,fontWeight:800,opacity:0.7}}>FIFA WORLD CUP 2026</div>
          <div style={{fontSize:12,color:"#C9D6EC",marginTop:4}}>北中米3カ国共催・史上初の48カ国</div>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",gap:18,position:"relative",zIndex:2}}>
          <div style={{color:"#F4B400",fontSize:13,fontWeight:800,letterSpacing:4}}>俺の優勝予想は…</div>
          <div style={{fontSize:56,lineHeight:1}}>🏆</div>
          <div style={{textAlign:"center"}}>
            <FlagImg country={winner} size={72}/>
            <div style={{color:"#F4B400",fontWeight:900,fontSize:34,marginTop:10}}>{winner}</div>
            <div style={{color:"#C9D6EC",fontSize:14,marginTop:6}}>が優勝すると予想！</div>
          </div>
          {japanResult&&<div style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:14,padding:"12px 24px",textAlign:"center"}}>
            <div style={{color:"#C9D6EC",fontSize:12,marginBottom:4}}>🇯🇵 日本代表予想</div>
            <div style={{color:"#fff",fontWeight:800,fontSize:16}}>{japanResult}</div>
          </div>}
          {topScorer&&<div style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:14,padding:"12px 24px",textAlign:"center"}}>
            <div style={{color:"#C9D6EC",fontSize:12,marginBottom:4}}>⚽ 得点王予想</div>
            <div style={{color:"#fff",fontWeight:800,fontSize:16}}>{topScorer}</div>
          </div>}
          {tournName&&<div style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>🏆 {tournName}</div>}
        </div>
      </div>
      {/* 下半分 */}
      <div style={{height:320,background:"#f0f4fa",color:"#0a1f4c",padding:"28px 40px",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{flex:1}}>
          <div style={{color:"#5B6B85",fontSize:13,fontWeight:700}}>あなたの優勝予想は？一緒に競おう！</div>
        </div>
        <div style={{textAlign:"center",paddingTop:20,borderTop:"1.5px solid #C9D6EC"}}>
          <div style={{fontSize:18,fontWeight:900,color:"#0a1f4c"}}>W杯 2026 予想メーカー</div>
          <div style={{fontSize:12,color:"#5B6B85",marginTop:4}}>xiaokoulu-maker.github.io/wcup-yosou</div>
        </div>
      </div>
    </div>
  );
}
function ShareCardStats({rank,total,pts,nickname}){
  return(
    <div style={{width:540,height:960,overflow:"hidden",fontFamily:'"Noto Sans JP",system-ui,sans-serif',display:"flex",flexDirection:"column"}}>
      {/* 上半分 */}
      <div style={{height:640,background:"linear-gradient(180deg,#061533 0%,#0a1f4c 50%,#0d2a5e 100%)",color:"#fff",padding:"44px 40px 32px",position:"relative",display:"flex",flexDirection:"column",flexShrink:0}}>
        <ShareCardBg/>
        <div style={{position:"relative",zIndex:2}}>
          <div style={{fontSize:18,letterSpacing:5,fontWeight:800,opacity:0.7}}>FIFA WORLD CUP 2026</div>
          <div style={{fontSize:12,color:"#C9D6EC",marginTop:4}}>北中米3カ国共催・史上初の48カ国</div>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",gap:20,position:"relative",zIndex:2}}>
          {nickname&&<div style={{color:"#C9D6EC",fontSize:15,fontWeight:700}}>{nickname} さんの戦績</div>}
          <div style={{textAlign:"center"}}>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:14,letterSpacing:3,marginBottom:8}}>現在の順位</div>
            <div style={{color:"#F4B400",fontWeight:900,lineHeight:1,fontSize:96}}>{rank}</div>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:18,marginTop:8}}>/ {total} 人中</div>
          </div>
          <div style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:16,padding:"16px 48px",textAlign:"center"}}>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:12,marginBottom:6}}>累計ポイント</div>
            <div style={{color:"#fff",fontWeight:900,fontSize:40}}>{pts} <span style={{fontSize:20,color:"rgba(255,255,255,0.5)"}}>pt</span></div>
          </div>
          <div style={{color:"#C9D6EC",fontSize:14,fontWeight:700}}>一緒に予想しよう →</div>
        </div>
      </div>
      {/* 下半分 */}
      <div style={{height:320,background:"#f0f4fa",color:"#0a1f4c",padding:"28px 40px",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{flex:1}}>
          <div style={{color:"#5B6B85",fontSize:13,fontWeight:700}}>あなたの順位は？W杯 2026 を一緒に予想しよう！</div>
        </div>
        <div style={{textAlign:"center",paddingTop:20,borderTop:"1.5px solid #C9D6EC"}}>
          <div style={{fontSize:18,fontWeight:900,color:"#0a1f4c"}}>W杯 2026 予想メーカー</div>
          <div style={{fontSize:12,color:"#5B6B85",marginTop:4}}>xiaokoulu-maker.github.io/wcup-yosou</div>
        </div>
      </div>
    </div>
  );
}

function ShareCardGlobalRank({rank,total,pts,nickname,icon}){
  return(
    <div style={{width:540,height:960,overflow:"hidden",fontFamily:'"Noto Sans JP",system-ui,sans-serif',display:"flex",flexDirection:"column"}}>
      {/* 上半分 */}
      <div style={{height:640,background:"linear-gradient(180deg,#061533 0%,#0a1f4c 50%,#0d2a5e 100%)",color:"#fff",padding:"44px 40px 32px",position:"relative",display:"flex",flexDirection:"column",flexShrink:0}}>
        <ShareCardBg/>
        <div style={{position:"relative",zIndex:2}}>
          <div style={{fontSize:18,letterSpacing:5,fontWeight:800,opacity:0.7}}>FIFA WORLD CUP 2026</div>
          <div style={{fontSize:12,color:"#C9D6EC",marginTop:4}}>北中米3カ国共催・史上初の48カ国</div>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",gap:20,position:"relative",zIndex:2}}>
          {nickname&&<div style={{color:"#C9D6EC",fontSize:15,fontWeight:700}}>{icon} {nickname} さんの全国順位</div>}
          <div style={{textAlign:"center"}}>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:14,letterSpacing:3,marginBottom:8}}>GLOBAL RANK</div>
            <div style={{color:"#F4B400",fontWeight:900,lineHeight:1,fontSize:88}}>#{rank}</div>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:18,marginTop:8}}>/ {total.toLocaleString()} 人中</div>
          </div>
          <div style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:16,padding:"16px 48px",textAlign:"center"}}>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:12,marginBottom:6}}>累計ポイント</div>
            <div style={{color:"#fff",fontWeight:900,fontSize:40}}>{pts} <span style={{fontSize:20,color:"rgba(255,255,255,0.5)"}}>pt</span></div>
          </div>
          <div style={{color:"#C9D6EC",fontSize:14,fontWeight:700}}>友達と全国上位を目指そう！</div>
        </div>
      </div>
      {/* 下半分 */}
      <div style={{height:320,background:"#f0f4fa",color:"#0a1f4c",padding:"28px 40px",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{flex:1}}>
          <div style={{color:"#5B6B85",fontSize:13,fontWeight:700}}>全国{total.toLocaleString()}人のW杯予想ファンと競おう！</div>
          <div style={{color:"#0a1f4c",fontSize:12,marginTop:4}}>W杯 2026 予想メーカーで今すぐ参加 →</div>
        </div>
        <div style={{textAlign:"center",paddingTop:20,borderTop:"1.5px solid #C9D6EC"}}>
          <div style={{fontSize:18,fontWeight:900,color:"#0a1f4c"}}>W杯 2026 予想メーカー</div>
          <div style={{fontSize:12,color:"#5B6B85",marginTop:4}}>xiaokoulu-maker.github.io/wcup-yosou</div>
        </div>
      </div>
    </div>
  );
}

/* ── 予想完了・共有ボックス ── */
function ShareBox({pred,tournId,nav}){
  const [copied,setCopied]=useState(false);
  const [sharingChamp,setSharingChamp]=useState(false);
  const BASE="https://xiaokoulu-maker.github.io/wcup-yosou/";
  const url=tournId?`${window.location.origin}${window.location.pathname}#t-${tournId}`:BASE;
  const winner=pred?.winner||"？";
  const japanResult=pred?.japanResult||"？";
  const shareText=`私の2026W杯優勝予想は【${winner}】！\n日本代表は【${japanResult}】予想です。\n\nあなたも予想してみて👇\n${url}\n\n#W杯予想 #サッカー日本代表 #WorldCup2026`;
  const xUrl=`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const lineUrl=`https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`;
  const copy=async()=>{
    try{await navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{}
  };
  const doShareChamp=async()=>{
    if(sharingChamp)return;
    setSharingChamp(true);
    await doShareImage(<ShareCardChampion pred={pred} tournName=""/>,"wcup-champion.png","私の2026 W杯優勝予想をシェア！ #W杯予想メーカー");
    setSharingChamp(false);
  };
  return(
    <div>
      <div className="card lg" style={{marginBottom:16}}>
        <div className="eyebrow gold">My Final Pick</div>
        <div className="champ" style={{marginTop:12}}>
          <span className="big-flag" style={{boxShadow:`inset 0 3px 0 ${(TEAMS[winner]||["","#8b93ad"])[1]}, 0 6px 16px rgba(0,0,0,.35)`}}>
            {(TEAMS[winner]||["？","#8b93ad"])[0]}
          </span>
          <div>
            <div className="clbl">優勝予想</div>
            <div className="cnm">{winner}</div>
          </div>
        </div>
        <div className="kv">
          <div><div className="k">日本の成績</div><div className="v">{pred?.japanResult||"—"}</div></div>
          <div><div className="k">応援国</div><div className="v" style={{fontSize:14}}>{pred?.favoriteCountry||"—"}</div></div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        <button className="btn btn-red lg" onClick={doShareChamp} disabled={sharingChamp} style={{opacity:sharingChamp?0.7:1}}>
          <DsIcon name="camera" size={18}/>{sharingChamp?"画像生成中...":"優勝予想を画像でシェア"}
        </button>
        <div style={{display:"flex",gap:9}}>
          <a href={xUrl} target="_blank" rel="noopener noreferrer" className="btn btn-dark md" style={{flex:1,textDecoration:"none"}}>
            <DsIcon name="xLogo" size={17}/> Xで投稿
          </a>
          <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="btn btn-line md" style={{flex:1,textDecoration:"none"}}>
            <span className="lk">L</span> LINEで共有
          </a>
        </div>
        <button className="btn btn-dark md" onClick={copy}>
          <DsIcon name={copied?"check":"link"} size={17}/>{copied?"コピーしました":"URLをコピー"}
        </button>
        <button className="btn btn-dark sm" onClick={()=>nav("predictions")}>みんなの予想を見る →</button>
      </div>
    </div>
  );
}

/* ── Predict ── */
function PgPredict({tourn:t,nav,update,myId}){
  const [pred,setPred]=useState({winner:"",runnerUp:"",topScorer:"",japanResult:"",favoriteCountry:"",comment:""});
  const [err,setErr]=useState("");const [loading,setLoading]=useState(false);const [saved,setSaved]=useState(false);const set=k=>v=>setPred(p=>({...p,[k]:v}));
  if(!t)return(
    <div className="screen">
      <DsBackRow onClick={()=>nav("home")}/>
      <div className="wrap section">
        <div className="card lg" style={{textAlign:"center",padding:"32px 20px"}}>
          <div style={{fontSize:40,marginBottom:12}}>⚽</div>
          <div style={{color:"#37d67a",fontWeight:800,fontSize:16,marginBottom:8}}>まず大会に参加してください</div>
          <div style={{color:"var(--muted)",fontSize:13,lineHeight:1.7}}>大会IDで参加するか、新しい大会を作成してから予想を入力できます。</div>
          <button className="btn btn-dark sm" style={{marginTop:16}} onClick={()=>nav("home")}>← トップへ戻る</button>
        </div>
      </div>
    </div>
  );
  if(isDeadlinePassed(t.deadline))return(
    <div className="screen">
      <DsBackRow onClick={()=>nav("tournament")}/>
      <div className="wrap section">
        <div className="card lg" style={{textAlign:"center",padding:"32px 20px"}}>
          <div style={{fontSize:40,marginBottom:12}}>⛔</div>
          <div style={{color:"#ff6066",fontWeight:800,fontSize:16}}>予想の締め切りが終了しました</div>
        </div>
      </div>
    </div>
  );
  const save=async()=>{
    const s2=getSettings(t);const missing=(s2.winner&&!pred.winner)||(s2.japanResult&&!pred.japanResult)||!pred.favoriteCountry;if(missing){setErr("必須項目を選択してください");return;}
setLoading(true);const fresh=await loadT(t.id);const cur=fresh||t;
    if(isDeadlinePassed(cur.deadline)){setErr("締め切りが終了しています");setLoading(false);return;}
const updated={...cur,participants:cur.participants.map(p=>p.id===myId?{...p,predictions:pred,points:cur.results?calcPts(pred,cur.results):0}:p)};
await update(updated);setSaved(true);setLoading(false);
  };
  return(
    <div className="screen">
      <DsPageHead onBack={()=>nav("tournament")} eyebrow="MY PREDICTION" title="予想を入力する"/>
      <div className="wrap section tight">
        {t.deadline&&(
          <div className="banner gold" style={{marginBottom:14}}>
            <DsIcon name="clock" size={15}/> ⏰ 締め切り: {fmtDeadline(t.deadline)}
          </div>
        )}
        <div className="card lg">
          <div style={{marginBottom:18}}><label className="field-lbl">🥇 優勝国</label><FlagChips opts={COUNTRIES} value={pred.winner} onChange={set("winner")}/></div>
          <div style={{marginBottom:18}}><label className="field-lbl">🥈 準優勝国</label><FlagChips opts={COUNTRIES} value={pred.runnerUp} onChange={set("runnerUp")}/></div>
          <div style={{marginBottom:18}}><label className="field-lbl">⚽ 得点王予想</label><ScorerChips opts={TOP_SCORER_CANDIDATES} value={pred.topScorer} onChange={set("topScorer")}/></div>
          <div style={{marginBottom:18}}><label className="field-lbl">🇯🇵 日本代表の成績</label><Chips opts={JAPAN_RES} value={pred.japanResult} onChange={set("japanResult")}/></div>
          <div style={{marginBottom:18}}><label className="field-lbl">❤️ 応援国</label><FlagChips opts={COUNTRIES} value={pred.favoriteCountry} onChange={set("favoriteCountry")}/></div>
          <div><label className="field-lbl">💬 一言コメント</label><textarea className="tinput" style={{height:72,resize:"none",paddingTop:14,paddingBottom:14}} placeholder="予想の根拠や意気込みを！" value={pred.comment} onChange={e=>set("comment")(e.target.value)}/></div>
        </div>
      </div>
      <div className="wrap section">
        {saved
          ?<ShareBox pred={pred} tournId={t?.id} nav={nav}/>
          :<>
            {err&&<div className="banner blue" style={{marginBottom:12,borderColor:"rgba(255,80,80,.4)",background:"rgba(255,60,60,.1)",color:"#ff8080"}}>⚠️ {err}</div>}
            <button className="btn btn-red lg" onClick={save} disabled={loading}>
              <DsIcon name="check" size={18}/>{loading?"保存中...":"予想を保存する"}
            </button>
          </>
        }
      </div>
    </div>
  );
}

/* ── Predictions ── */
function PgPredictions({tourn:t,setTourn,nav,goCountry}){
  useEffect(()=>{if(!t?.id)return;const unsub=subscribeToTournament(t.id,setTourn);return unsub;},[t?.id]);
  const winCount={};t.participants.forEach(p=>{if(p.predictions?.winner)winCount[p.predictions.winner]=(winCount[p.predictions.winner]||0)+1;});
  const winRank=Object.entries(winCount).sort((a,b)=>b[1]-a[1]);
  return(
    <div style={{padding:"20px 18px 40px"}}><Back onClick={()=>nav("tournament")}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div><div style={{color:G.gold,fontSize:21,fontWeight:900}}>みんなの予想</div><div style={{color:G.muted,fontSize:12,marginTop:2}}>{t.participants.length}人参加中 · 🔄 自動更新中</div></div>
      </div>
      {winRank.length>0&&<div style={{...crd,border:`1px solid ${G.gold}44`}}>
        <div style={{color:G.gold,fontWeight:700,fontSize:12,marginBottom:12,letterSpacing:1}}>🥇 WINNER PREDICTION</div>
        {winRank.map(([c,n],i)=><div key={c} onClick={()=>goCountry(c)} style={{cursor:"pointer",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><FlagImg country={c} size={20}/><span style={{color:G.navy,fontSize:13}}>{c}</span></div>
            <span style={{color:G.gold,fontWeight:700,fontSize:13}}>{n}人</span>
          </div>
          <div style={{background:"rgba(0,91,172,0.1)",borderRadius:6,height:7,overflow:"hidden"}}>
            <div style={{background:i===0?"linear-gradient(90deg,#0068B7,#004C99)":i<3?"#9CA3AF":"#C9DDF5",height:"100%",borderRadius:6,width:(n*100/(t.participants.length||1))+"%"}}/>
          </div>
        </div>)}
      </div>}
      {t.participants.length===0?<div style={{color:G.muted,textAlign:"center",padding:"40px 0"}}>まだ参加者がいません</div>
        :t.participants.map(p=>(
          <div key={p.id} style={{...crd,overflow:"visible"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{fontSize:34,lineHeight:1,filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.4))"}}>{p.icon}</div>
              <div style={{flex:1}}>
                <div style={{color:G.navy,fontWeight:800,fontSize:15}}>{p.nickname}</div>
                {t.results&&<div style={{color:G.gold,fontSize:13,fontWeight:800}}>{p.points}<span style={{fontSize:10,fontWeight:600,marginLeft:2}}>pt</span></div>}
              </div>
              {p.predictions?.winner&&(
                <div onClick={()=>goCountry(p.predictions.winner)} style={{textAlign:"center",background:"rgba(0,104,183,0.06)",borderRadius:12,padding:"6px 10px",border:"1px solid rgba(0,104,183,0.2)",cursor:"pointer",minWidth:52}}>
                  <FlagImg country={p.predictions.winner} size={22}/>
                  <div style={{color:G.gold,fontSize:8,marginTop:3,fontWeight:700,letterSpacing:0.5}}>優勝予想</div>
                </div>
              )}
            </div>
            {p.predictions?(
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                  <Badge label="準優勝" val={p.predictions.runnerUp}/>
                  <Badge label="得点王" val={p.predictions.topScorer||"未入力"}/>
                  <Badge label="日本代表" val={p.predictions.japanResult}/>
                  <Badge label="応援国" val={p.predictions.favoriteCountry}/>
                </div>
                {p.predictions.comment&&(
                  <div style={{marginTop:10,background:G.dark,borderRadius:12,padding:"10px 14px",border:"1px solid #D9E8FF",position:"relative"}}>
                    <div style={{position:"absolute",top:-8,left:16,background:"rgba(0,104,183,0.1)",borderRadius:20,padding:"1px 8px"}}>
                      <span style={{color:G.gold,fontSize:9,fontWeight:700}}>💬 コメント</span>
                    </div>
                    <div style={{color:G.muted,fontSize:12,lineHeight:1.6,fontStyle:"italic",marginTop:2}}>"{p.predictions.comment}"</div>
                  </div>
                )}
              </>
            ):<div style={{color:"#445",fontSize:13,textAlign:"center",padding:"8px 0"}}>予想未入力</div>}
          </div>
        ))}
      <div style={{marginTop:8}}><button style={btnO} onClick={()=>nav("tournament")}>← 大会ページへ戻る</button></div>
    </div>
  );
}

/* ── Ranking ── */
function PgRanking({tourn:t,setTourn,nav,myId}){
  const [rankTab,setRankTab]=useState("match");
  const [sharingStats,setSharingStats]=useState(false);
  const [globalData,setGlobalData]=useState(null);
  const [globalLoading,setGlobalLoading]=useState(false);
  const [globalErr,setGlobalErr]=useState("");
  const [sharingGlobal,setSharingGlobal]=useState(false);
  const lastGlobalFetch=useRef(0);
  useEffect(()=>{if(!t?.id)return;const unsub=subscribeToTournament(t.id,setTourn);return unsub;},[t?.id]);
  useEffect(()=>{
    if(rankTab==="global"&&!globalData){
      loadGlobalRanking();
    }
  },[rankTab]);

  const loadGlobalRanking=async(force=false)=>{
    const now=Date.now();
    if(!force&&now-lastGlobalFetch.current<30000)return;
    lastGlobalFetch.current=now;
    setGlobalLoading(true);setGlobalErr("");
    const res=await fetchGlobalRanking(force);
    if(!res)setGlobalErr("現在ランキングを取得できません。通信を確認して再試行してください。");
    else setGlobalData(res);
    setGlobalLoading(false);
  };
  if(!t)return null;
  const hasRes=!!t.results?.winner;
  const tournRanked=[...t.participants].map(p=>({...p,pts:p.predictions&&hasRes?calcPts(p.predictions,t.results):(p.points||0)})).sort((a,b)=>b.pts-a.pts);
  const matchRanked=[...t.participants].map(p=>({...p,pts:p.totalMatchPoints||0})).sort((a,b)=>b.pts-a.pts);
  const ranked=rankTab==="match"?matchRanked:tournRanked;
  const MEDALS=["🥇","🥈","🥉"];
  const myMatchEntry=myId?matchRanked.find(p=>p.id===myId):null;
  const myRankNum=myMatchEntry?matchRanked.indexOf(myMatchEntry)+1:0;
  const doShareStats=async()=>{
    if(sharingStats||!myMatchEntry)return;
    setSharingStats(true);
    await doShareImage(<ShareCardStats rank={myRankNum} total={matchRanked.length} pts={myMatchEntry.pts} nickname={myMatchEntry.nickname}/>,"wcup-stats.png","W杯予想の成績をシェア！ #W杯予想メーカー");
    setSharingStats(false);
  };
  // 表彰台スロット（共通）
  const PodiumSlot=({rank,p,unitLabel})=>{
    if(!p) return <div className={rank===1?"h-32":"h-24"}/>;
    const isMe=p.id===myId;
    const ringCls=rank===1?"ring-4 shadow-cta-gold"
      :rank===2?"ring-4 ring-gray-300":rank===2?"ring-4 ring-gray-300":"ring-4";
    const ringColor=rank===1?"#F4B400":rank===2?"#C0C0C0":"#A0522D";
    const crownEmoji=rank===1?"👑":rank===2?"🥈":"🥉";
    const baseH=rank===1?"h-32":"h-24";
    const avSize=rank===1?"w-20 h-20":"w-16 h-16";
    return(
      <div className="flex flex-col items-center">
        {rank===1&&<div className="text-2xl mb-1">{crownEmoji}</div>}
        <div className={`${avSize} rounded-full flex items-center justify-center text-3xl border-4 shadow-lg${isMe?" border-hinomaru":" border-transparent"}`}
          style={{outline:`3px solid ${ringColor}`,outlineOffset:1,background:"rgba(255,255,255,0.12)"}}>
          {p.icon||"⚽"}
        </div>
        <div className={`mt-1 text-center leading-tight${rank===1?" text-base font-black":" text-sm font-bold"} text-white`}>
          {rank!==1&&<span className="mr-1">{crownEmoji}</span>}{p.nickname}
          {isMe&&<span className="block text-hinomaru text-[10px] font-black">YOU</span>}
        </div>
        <div className="text-text-on-navy-dim text-xs tabular-nums">{(p.pts||0).toLocaleString()} {unitLabel}</div>
        <div className={`mt-2 w-full ${baseH} rounded-t-card border-t border-white/20 flex items-start justify-center pt-2`}
          style={{background:"linear-gradient(to bottom,rgba(255,255,255,0.12),rgba(255,255,255,0.05))"}}>
          <div className={`${rank===1?"text-3xl":"text-xl"} font-black text-gold tabular-nums`}>{rank}</div>
        </div>
      </div>
    );
  };
  // 表彰台（上位3人）
  const Podium=({list,unitLabel})=>{
    const [first,second,third]=[list[0],list[1],list[2]];
    if(!first) return <div className="text-text-on-navy-dim text-center py-8 text-sm">まだ参加者がいません</div>;
    return(
      <div className="px-5 mt-4 mb-2">
        <div className="grid grid-cols-3 items-end gap-2">
          <PodiumSlot rank={2} p={second} unitLabel={unitLabel}/>
          <PodiumSlot rank={1} p={first}  unitLabel={unitLabel}/>
          <PodiumSlot rank={3} p={third}  unitLabel={unitLabel}/>
        </div>
      </div>
    );
  };
  // リスト行（4位以下）
  const RankRow=({rank,p,unitLabel,unitValue})=>{
    const isMe=p.id===myId;
    return(
      <div className={`flex items-center gap-3 px-4 py-3 rounded-card mb-2${isMe?" bg-white text-text-on-white shadow-data-card border-l-4 border-hinomaru":" bg-white/5 border border-white/10 text-text-on-navy"}`}>
        <div className={`w-8 text-center font-black tabular-nums text-sm${isMe?" text-hinomaru":" text-text-on-navy-dim"}`}>{rank}</div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl${isMe?" bg-hinomaru/10":" bg-white/10"}`}>{p.icon||"⚽"}</div>
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-sm truncate${isMe?" text-text-on-white":" text-white"}`}>
            {p.nickname}
            {isMe&&<span className="ml-1.5 text-[10px] bg-hinomaru text-white rounded-full px-2 py-0.5 font-black">YOU</span>}
          </div>
          {(p.streak?.current||0)>=3&&<span className="text-xs text-gold">🔥 {p.streak.current}</span>}
        </div>
        <div className={`font-black tabular-nums text-sm${isMe?" text-text-on-white":" text-white"}`}>
          {(unitValue??p.pts??0).toLocaleString()} <span className={`text-xs font-normal${isMe?" text-text-on-white-gray":" text-text-on-navy-dim"}`}>{unitLabel}</span>
        </div>
      </div>
    );
  };

  // コインランキング用のリスト
  const coinRanked=[...t.participants].map(p=>({...p,coinBal:getCoins(p).balance})).sort((a,b)=>b.coinBal-a.coinBal);

  return(
    <div className="bg-navy-base min-h-screen pb-12 text-text-on-navy" style={{maxWidth:480,margin:"0 auto"}}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <button onClick={()=>nav("tournament")} className="text-text-on-navy-dim text-2xl font-bold bg-transparent border-0 cursor-pointer leading-none">←</button>
        <div className="text-center">
          <div className="text-white font-black text-lg">ランキング</div>
          <div className="text-text-on-navy-dim text-xs">{t.name}</div>
        </div>
        <div className="w-8"/>
      </div>

      {/* タブバー（横スクロール） */}
      <div className="px-5 flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth:"none"}}>
        {[["match","⚽ 試合予想"],["tournament","🏆 大会予想"],["coin","🪙 コインリッチ"],["global","🌐 全国"]].map(([v,lb])=>(
          <button key={v} onClick={()=>setRankTab(v)}
            className={`whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full border-0 cursor-pointer flex-shrink-0 transition-colors${rankTab===v?" bg-white text-navy-base":" bg-transparent text-text-on-navy-dim border border-white/15"}`}>
            {lb}
          </button>
        ))}
      </div>

      {/* ===== 試合予想 / 大会予想 ===== */}
      {(rankTab==="match"||rankTab==="tournament")&&(()=>{
        const list=ranked.map((p,i)=>({...p,pts:p.pts}));
        const top3=list.slice(0,3);
        const rest=list.slice(3);
        const unitLabel="pt";
        return(
          <div>
            {rankTab==="match"&&<div className="mx-5 mt-3 mb-0"><ScoringRulesCard compact={true}/></div>}
            {rankTab==="tournament"&&hasRes&&(
              <div className="mx-5 mt-3 bg-white/5 border border-white/10 rounded-card p-3">
                <div className="text-gold font-bold text-xs mb-2">📊 確定結果</div>
                <div className="grid grid-cols-2 gap-2">
                  <Badge label="優勝" val={t.results.winner}/>
                  <Badge label="準優勝" val={t.results.runnerUp}/>
                  {t.results.topScorer&&<Badge label="得点王" val={t.results.topScorer}/>}
                  <Badge label="日本代表" val={t.results.japanResult}/>
                </div>
              </div>
            )}
            {rankTab==="tournament"&&!hasRes&&(
              <div className="mx-5 mt-3 bg-white/5 border border-white/10 rounded-card p-3 text-text-on-navy-dim text-xs">
                管理者が結果を入力するとポイントが反映されます
              </div>
            )}
            {list.length===0
              ?<div className="text-text-on-navy-dim text-center py-12 text-sm">まだ参加者がいません</div>
              :<><Podium list={top3} unitLabel={unitLabel}/>
                <div className="px-5 mt-2">
                  {rest.map((p,i)=><RankRow key={p.id} rank={i+4} p={p} unitLabel={unitLabel}/>)}
                </div>
              </>
            }
          </div>
        );
      })()}

      {/* ===== コインリッチ ===== */}
      {rankTab==="coin"&&(()=>{
        const coinList=coinRanked.map((p,i)=>({...p,pts:p.coinBal}));
        const top3=coinList.slice(0,3);
        const rest=coinList.slice(3);
        return(
          <div>
            <div className="mx-5 mt-3 bg-white/5 border border-white/10 rounded-card p-3 text-xs">
              <div className="text-gold font-bold mb-1">🪙 コインリッチランキング</div>
              <div className="text-text-on-navy-dim">ゲーム内コインの残高ランキングです</div>
              <div className="text-hinomaru mt-1 text-[10px]">⚖️ このコインは現実のお金・賞品と一切交換できません</div>
            </div>
            {coinList.length===0
              ?<div className="text-text-on-navy-dim text-center py-12 text-sm">まだ参加者がいません</div>
              :<><Podium list={top3} unitLabel="🪙"/>
                <div className="px-5 mt-2">
                  {rest.map((p,i)=>(
                    <RankRow key={p.id} rank={i+4} p={p} unitLabel="🪙" unitValue={p.coinBal}/>
                  ))}
                </div>
              </>
            }
          </div>
        );
      })()}

      {/* ===== 全国ランキング ===== */}
      {rankTab==="global"&&(()=>{
        const me=t?.participants?.find(p=>p.id===myId);
        const myPts=me?.totalMatchPoints||0;
        const list=globalData?.list||[];
        const total=globalData?.total||0;
        const myEntry=list.find(r=>r.id===myId);
        const myRank=myEntry?.rank??null;
        const inTop100=myEntry!=null&&myEntry.rank<=100;
        const nearby=myEntry&&myEntry.rank>100?list.filter(r=>Math.abs(r.rank-myEntry.rank)<=5):[];
        const top100=list.slice(0,100);
        return(
          <div>
            {/* 自分の全国順位カード */}
            <div className="mx-5 mt-4">
              {myPts>0?(
                <div className="rounded-xl border border-white/10 p-5 text-center" style={{background:"#12244f"}}>
                  <div className="text-[10px] text-text-on-navy-dim tracking-widest font-bold uppercase">YOUR GLOBAL RANK</div>
                  {myRank?(
                    <>
                      <div className="flex items-baseline justify-center gap-1 mt-2">
                        <span className="text-5xl font-black tabular-nums text-gold">#{myRank}</span>
                        <span className="text-text-on-navy-dim text-sm">位</span>
                      </div>
                      <div className="text-text-on-navy-dim text-sm mt-1">/ {total.toLocaleString()} 人中</div>
                    </>
                  ):(
                    <div className="text-text-on-navy-dim text-sm mt-2">圏外（TOP200外）</div>
                  )}
                  <div className="border-t border-white/10 mt-3 pt-3 text-text-on-navy-dim text-sm">
                    累計 <span className="text-white font-black text-xl">{myPts}</span> pt
                  </div>
                </div>
              ):(
                <div className="rounded-xl border border-white/10 p-5 text-center" style={{background:"#12244f"}}>
                  <div className="text-text-on-navy-dim text-sm">あなたはまだランクインしていません</div>
                  <button onClick={()=>nav("matches")}
                    className="mt-3 bg-hinomaru text-white font-bold text-xs px-4 py-2 rounded-full border-0 cursor-pointer">
                    ⚽ 予想して全国ランキングに登場！
                  </button>
                </div>
              )}
            </div>
            {/* ローディング / エラー */}
            {globalLoading&&<div className="text-text-on-navy-dim text-center py-8">🌐 読み込み中...</div>}
            {globalErr&&!globalLoading&&(
              <div className="mx-5 mt-3 bg-hinomaru/10 border border-hinomaru/30 rounded-card p-3">
                <div className="text-hinomaru-light text-xs mb-2">{globalErr}</div>
                <button onClick={()=>loadGlobalRanking(true)} className="bg-white/10 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer">再試行</button>
              </div>
            )}
            {!globalLoading&&!globalErr&&list.length===0&&(
              <div className="text-text-on-navy-dim text-center py-8 text-sm">W杯開幕後にランキング開始！</div>
            )}
            {!globalLoading&&list.length>0&&(
              <div className="px-5 mt-4">
                <div className="text-gold font-bold text-sm mb-2">🏆 TOP {Math.min(100,list.length)}</div>
                {top100.map(r=>{
                  const isMe=r.id===myId;
                  const medal=r.rank===1?"👑":r.rank===2?"🥈":r.rank===3?"🥉":null;
                  return(
                    <div key={r.id+"_"+r.rank}
                      className={`flex items-center gap-3 px-4 py-3 rounded-card mb-2${isMe?" bg-white text-text-on-white shadow-data-card border-l-4 border-hinomaru":" bg-white/5 border border-white/10"}`}>
                      <div className={`w-8 text-center font-black text-sm${r.rank<=3?" text-gold":isMe?" text-hinomaru":" text-text-on-navy-dim"}`}>
                        {medal||r.rank}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg">{r.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-sm truncate${isMe?" text-text-on-white":" text-white"}`}>
                          {isMe&&"★ "}{r.nickname}
                          {isMe&&<span className="ml-1.5 text-[10px] bg-hinomaru text-white rounded-full px-1.5 py-0.5 font-black">YOU</span>}
                        </div>
                      </div>
                      <div className={`font-black tabular-nums text-sm${isMe?" text-text-on-white":" text-white"}`}>{r.points}<span className="text-xs font-normal opacity-60 ml-0.5">pt</span></div>
                    </div>
                  );
                })}
                {!inTop100&&nearby.length>0&&(
                  <>
                    <div className="text-gold font-bold text-sm mt-4 mb-2">📍 あなたの周辺</div>
                    {nearby.map(r=>{
                      const isMe=r.id===myId;
                      return(
                        <div key={r.id+"_nb"}
                          className={`flex items-center gap-3 px-4 py-3 rounded-card mb-2${isMe?" bg-white text-text-on-white shadow-data-card border-l-4 border-hinomaru":" bg-white/5 border border-white/10"}`}>
                          <div className={`w-8 text-center font-bold text-xs${isMe?" text-hinomaru":" text-text-on-navy-dim"}`}>{r.rank}</div>
                          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg">{r.icon}</div>
                          <div className={`flex-1 text-sm font-bold truncate${isMe?" text-text-on-white":" text-white"}`}>
                            {isMe&&"★ "}{r.nickname}
                            {isMe&&<span className="ml-1.5 text-[10px] bg-hinomaru text-white rounded-full px-1.5 py-0.5 font-black">YOU</span>}
                          </div>
                          <div className={`font-black tabular-nums text-sm${isMe?" text-text-on-white":" text-white"}`}>{r.points}<span className="text-xs font-normal opacity-60 ml-0.5">pt</span></div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div className="flex gap-2 mt-4">
                  <button onClick={()=>loadGlobalRanking(true)}
                    className="flex-1 bg-white/10 border border-white/20 text-white text-xs font-bold py-2.5 rounded-card cursor-pointer">
                    🔄 更新
                  </button>
                  {myRank&&myPts>0&&(
                    <button onClick={async()=>{
                      if(sharingGlobal)return;
                      setSharingGlobal(true);
                      const me2=t.participants.find(p=>p.id===myId);
                      await doShareImage(<ShareCardGlobalRank rank={myRank} total={total} pts={myPts} nickname={me2?.nickname||""} icon={me2?.icon||"⚽"}/>,"wcup-global.png","全国ランキング入りしました！ #W杯予想メーカー");
                      setSharingGlobal(false);
                    }} disabled={sharingGlobal}
                      className={`flex-1 bg-hinomaru text-white text-xs font-bold py-2.5 rounded-card shadow-cta-red cursor-pointer border-0${sharingGlobal?" opacity-70":""}`}>
                      {sharingGlobal?"🔄 生成中":"📷 順位をシェア"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* シェア + 戻るボタン */}
      <div className="px-5 mt-6 flex flex-col gap-2">
        {(rankTab==="match"||rankTab==="tournament")&&myMatchEntry&&(
          <button onClick={doShareStats} disabled={sharingStats}
            className={`w-full bg-hinomaru text-white font-bold rounded-card-lg shadow-cta-red py-3.5 border-0 cursor-pointer${sharingStats?" opacity-70":""}`}>
            {sharingStats?"🔄 画像生成中...":"📷 成績を画像でシェア"}
          </button>
        )}
        <button onClick={()=>nav("tournament")}
          className="w-full bg-white/10 border border-white/20 text-white text-sm font-bold py-3 rounded-card cursor-pointer">
          ← 大会ページへ戻る
        </button>
      </div>
    </div>
  );
}

/* ── 詳細統計 ── */
function PgStats({tourn:t,nav}){
  if(!t)return null;
  const preds=t.participants.map(p=>p.predictions).filter(Boolean);
  const count=(key)=>{
    const map={};
    preds.forEach(p=>{if(p[key]){map[p[key]]=(map[p[key]]||0)+1;}});
    return Object.entries(map).map(([label,count])=>({label,count}));
  };
  const scorers=preds.map(p=>p.topScorer).filter(Boolean);
  const scorerMap={};scorers.forEach(s=>{const k=s.trim();if(k)scorerMap[k]=(scorerMap[k]||0)+1;});
  const scorerData=Object.entries(scorerMap).map(([label,count])=>({label,count}));

  return(
    <div style={{paddingBottom:40}}>
      <div style={{background:"linear-gradient(180deg,#061533 0%,#0a1f4c 100%)",padding:"36px 20px 22px",textAlign:"center",position:"relative",overflow:"hidden",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <Back onClick={()=>nav("tournament")}/>
        <div style={{color:G.gold,fontSize:22,fontWeight:900}}>📊 詳細統計</div>
        <div style={{color:G.muted,fontSize:12,marginTop:4}}>{t.name} · {preds.length}人が予想済み</div>
      </div>
      <div style={{padding:"14px 18px 0"}}>
        {preds.length===0
          ?<div style={{...crd,textAlign:"center",padding:32}}><div style={{fontSize:36,marginBottom:12}}>📊</div><div style={{color:G.muted,fontWeight:700}}>まだ予想がありません</div></div>
          :<>
            <div style={crd}><BarChart title="🥇 優勝国予想" data={count("winner")}/></div>
            <div style={crd}><BarChart title="🥈 準優勝国予想" data={count("runnerUp")}/></div>
            {scorerData.length>0&&<div style={crd}><BarChart title="⚽ 得点王予想" data={scorerData}/></div>}
            <div style={crd}><BarChart title="🇯🇵 日本代表成績予想" data={count("japanResult")}/></div>
            <div style={crd}><BarChart title="❤️ 応援国" data={count("favoriteCountry")}/></div>
            <div style={{...crd,background:G.dark}}>
              <div style={{color:G.gold,fontWeight:700,fontSize:13,marginBottom:10}}>💬 みんなのコメント</div>
              {preds.filter(p=>p.comment).map((p,i)=>{
                const participant=t.participants.find(pt=>pt.predictions===p)||t.participants[i];
                return<div key={i} style={{background:G.dark,borderRadius:8,padding:"10px 12px",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <span style={{fontSize:18}}>{participant?.icon||"⚽"}</span>
                    <span style={{color:G.muted,fontSize:11}}>{participant?.nickname||"匿名"}</span>
                  </div>
                  <div style={{color:"#ddd",fontSize:12}}>"{p.comment}"</div>
                </div>;
              })}
            </div>
          </>
        }
        <button style={btnO} onClick={()=>nav("tournament")}>← 大会ページへ戻る</button>
      </div>
    </div>
  );
}

/* ── Admin ── */
function PgAdmin({tourn:t,nav,update,adminOk,setAdminOk}){
  const [pass,setPass]=useState("");const [passErr,setPassErr]=useState("");
  const [res,setRes]=useState(t.results||{winner:"",runnerUp:"",topScorer:"",japanResult:""});
  const [err,setErr]=useState("");const [saved,setSaved]=useState(false);const [loading,setLoading]=useState(false);
  const [editId,setEditId]=useState(null);const [editNick,setEditNick]=useState("");const [tab,setTab]=useState("result");
  const setR=k=>v=>setRes(r=>({...r,[k]:v}));
  const checkPass=()=>{if(pass===t.adminPasscode){setAdminOk(true);setPassErr("");}else setPassErr("パスコードが違います");};
  const save=async()=>{if(!res.winner||!res.runnerUp||!res.japanResult){setErr("必須項目を入力してください");return;}setLoading(true);const fresh=await loadT(t.id);const cur=fresh||t;const updated={...cur,results:res,participants:cur.participants.map(p=>({...p,points:p.predictions?calcPts(p.predictions,res):0}))};await update(updated);setSaved(true);setLoading(false);setTimeout(()=>{setSaved(false);nav("ranking");},1800);};
const deleteP=async(pid)=>{if(!window.confirm("この参加者を削除しますか？"))return;const fresh=await loadT(t.id);const cur=fresh||t;await update({...cur,participants:cur.participants.filter(p=>p.id!==pid)});};
const startEdit=(p)=>{setEditId(p.id);setEditNick(p.nickname);};
const saveEdit=async()=>{const fresh=await loadT(t.id);const cur=fresh||t;await update({...cur,participants:cur.participants.map(p=>p.id===editId?{...p,nickname:editNick}:p)});setEditId(null);};

if(!adminOk)return(
<div style={{padding:"20px 18px 40px"}}><Back onClick={()=>nav("tournament")}/>
<div style={{color:G.gold,fontSize:21,fontWeight:900,marginBottom:4}}>🔐 管理者ページ</div>
<div style={{color:G.muted,fontSize:13,marginBottom:20}}>管理用パスコードを入力してください</div>
<div style={crd}><FInput label="パスコード" placeholder="パスコードを入力" type="password" value={pass} onChange={setPass}/><Err msg={passErr}/><button style={btnG} onClick={checkPass}>認証する</button></div>
</div>
);

  return(
    <div style={{padding:"20px 18px 40px"}}><Back onClick={()=>nav("tournament")}/>
      <div style={{color:G.gold,fontSize:21,fontWeight:900,marginBottom:14}}>🔐 管理者ページ</div>
      {/* タブ */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {[["result","結果入力"],["members","参加者管理"],["eliminated","敗退国管理"],["matches","⚽ 試合結果"]].map(([v,lb])=>(
          <button key={v} onClick={()=>setTab(v)} style={{background:tab===v?G.gold:G.card,color:tab===v?"#111":"#ccc",border:"none",borderRadius:10,padding:"10px",fontSize:13,cursor:"pointer",fontWeight:700}}>{lb}</button>
        ))}
      </div>

      {tab==="result"&&(
        <>
          <div style={crd}>
            {(()=>{const s=getSettings(t);return(<>
            {s.winner&&<div style={{marginBottom:18}}><label style={lbl}>🥇 優勝国 ＊</label><Chips opts={COUNTRIES} value={res.winner} onChange={setR("winner")}/></div>}
            {s.runnerUp&&<div style={{marginBottom:18}}><label style={lbl}>🥈 準優勝国 ＊</label><Chips opts={COUNTRIES} value={res.runnerUp} onChange={setR("runnerUp")}/></div>}
            {s.topScorer&&<div style={{marginBottom:18}}><label style={lbl}>⚽ 得点王</label><input style={inp} placeholder="得点王の名前" value={res.topScorer||""} onChange={e=>setR("topScorer")(e.target.value)}/></div>}
            {s.assistKing&&<div style={{marginBottom:18}}><label style={lbl}>🎯 アシスト王</label><input style={inp} placeholder="アシスト王の名前" value={res.assistKing||""} onChange={e=>setR("assistKing")(e.target.value)}/></div>}
            {s.tournamentMvp&&<div style={{marginBottom:18}}><label style={lbl}>🏅 大会MVP</label><input style={inp} placeholder="大会MVPの名前" value={res.tournamentMvp||""} onChange={e=>setR("tournamentMvp")(e.target.value)}/></div>}
            {s.japanResult&&<div style={{marginBottom:18}}><label style={lbl}>🇯🇵 日本代表の成績 ＊</label><Chips opts={JAPAN_RES} value={res.japanResult} onChange={setR("japanResult")}/></div>}
            {s.japanMvp&&<div style={{marginBottom:18}}><label style={lbl}>🌟 日本代表MVP</label><input style={inp} placeholder="日本代表MVPの名前" value={res.japanMvp||""} onChange={e=>setR("japanMvp")(e.target.value)}/></div>}
            {s.best4&&<div style={{marginBottom:18}}><label style={lbl}>🏆 ベスト4（4チーム）</label><Chips opts={COUNTRIES} value={null} onChange={(c)=>setR("best4")(Array.isArray(res.best4)?res.best4.includes(c)?res.best4.filter(x=>x!==c):[...res.best4.slice(0,3),c]:[c])} cols={3}/>{res.best4?.length>0&&<div style={{color:G.muted,fontSize:11,marginTop:4}}>選択中: {res.best4.join("・")}</div>}</div>}
            {s.japanFirstMatchScore&&<div style={{marginBottom:18}}><label style={lbl}>📊 日本代表初戦スコア（例: 2-1）</label><input style={inp} placeholder="例: 2-1" value={res.japanFirstMatchScore||""} onChange={e=>setR("japanFirstMatchScore")(e.target.value)}/></div>}
          </>);})()}
          </div>
          <Err msg={err}/>
          {saved?<div style={{background:"rgba(22,163,74,0.12)",border:`1px solid ${G.gold}`,borderRadius:14,padding:16,textAlign:"center",color:"#16A34A",fontWeight:700}}>✅ 保存完了！</div>
            :<button style={btnG} onClick={save} disabled={loading}>{loading?"保存中...":"💾 結果を保存してランキング更新"}</button>}
        </>
      )}

      {tab==="members"&&(
        <div>
          <div style={{color:G.muted,fontSize:12,marginBottom:12}}>{t.participants.length}人参加中</div>
          {t.participants.length===0
            ?<div style={{color:G.muted,textAlign:"center",padding:"30px 0"}}>参加者がいません</div>
            :t.participants.map(p=>(
              <div key={p.id} style={{...crd,marginBottom:8}}>
                {editId===p.id
                  ?<div>
                    <div style={{display:"flex",gap:8,marginBottom:8}}>
                      <input style={{...inp,flex:1}} value={editNick} onChange={e=>setEditNick(e.target.value)}/>
                      <button onClick={saveEdit} style={{background:G.gold,color:"#FFFFFF",border:"none",borderRadius:10,padding:"0 14px",fontWeight:700,cursor:"pointer",flexShrink:0}}>保存</button>
                      <button onClick={()=>setEditId(null)} style={{...btnGr,width:"auto",padding:"0 12px"}}>✕</button>
                    </div>
                  </div>
                  :<div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{fontSize:26}}>{p.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{color:"#fff",fontWeight:700,fontSize:14}}>{p.nickname}</div>
                      <div style={{color:G.muted,fontSize:11}}>{p.predictions?"予想済み":"未入力"} · {p.points}pt</div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>startEdit(p)} style={{background:"rgba(0,91,172,0.07)",color:G.gold,border:"1px solid rgba(0,91,172,0.2)",borderRadius:8,padding:"5px 10px",fontSize:11,cursor:"pointer",fontWeight:600}}>編集</button>
                      <button onClick={()=>deleteP(p.id)} style={btnRed}>削除</button>
                    </div>
                  </div>
                }
              </div>
            ))
          }
        </div>
      )}
      {tab==="eliminated"&&(
        <EliminatedManager tourn={t} update={update}/>
      )}
      {tab==="matches"&&(
        <MatchResultAdmin tourn={t} update={update}/>
      )}
    </div>
  );
}

/* ── 試合結果入力コンポーネント ── */
function MatchResultAdmin({tourn:t,update}){
  const [editId,setEditId]=useState(null);
  const [hs,setHs]=useState("");
  const [as_,setAs]=useState("");
  const [jScorers,setJScorers]=useState([]);
  const [saving,setSaving]=useState(false);
  const [autoFetching,setAutoFetching]=useState(false);
  const [autoMsg,setAutoMsg]=useState("");
  const [earnedBadgesA,setEarnedBadgesA]=useState([]);
  const matchResults=t.results?.matchResults||{};
  const lastFetchTs=parseInt(localStorage.getItem("wcup_lastApiFetch")||"0");
  const lastFetchStr=lastFetchTs?new Date(lastFetchTs).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}):"未取得";
  const handleAutoFetch=async()=>{
    setAutoFetching(true);setAutoMsg("");
    const result=await fetchAndApplyResults(t,{force:true,update});
    if(result>0) setAutoMsg(`✅ ${result}件の結果を反映しました`);
    else if(result===0) setAutoMsg("ℹ️ 新しい結果はありませんでした");
    else setAutoMsg("⚠️ 自動取得できませんでした。下から手動で入力してください");
    setAutoFetching(false);
  };
  const now=new Date();
  const relevant=MATCHES.filter(m=>{
    if(matchResults[m.id])return true;
    return new Date(m.kickoff)<=new Date(now.getTime()+14*24*60*60*1000);
  });
  const saveMatchResult=async(matchId)=>{
    const homeS=parseInt(hs),awayS=parseInt(as_);
    if(isNaN(homeS)||isNaN(awayS)||homeS<0||awayS<0){alert("有効なスコアを入力してください");return;}
    setSaving(true);
    try{
      const fresh=await loadT(t.id);const cur=fresh||t;
      const actual=homeS>awayS?"home":homeS<awayS?"away":"draw";
      const extras=jScorers.length>0?{japanScorers:jScorers}:{};
      const updatedParticipants=cur.participants.map(p=>{
        const pred=(p.matchPredictions||{})[matchId];
        const filledMatch={id:matchId,status:"finished",homeScore:homeS,awayScore:awayS};
        const pts=pred!=null?scoreMatch(pred,filledMatch,extras):null;
        const newMP={...(p.matchPredictions||{})};
        if(pred!=null)newMP[matchId]={...pred,points:pts};
        const totalMatchPoints=Object.values(newMP).reduce((s,mp)=>s+(mp?.points||0),0);
        return{...p,matchPredictions:newMP,totalMatchPoints};
      });
      const updatedResults={...(cur.results||{}),matchResults:{...matchResults,[matchId]:{homeScore:homeS,awayScore:awayS,status:"finished",...(jScorers.length>0?{japanScorers:jScorers}:{})}}};
      // ストリーク + バッジチェック
      const myIdLocal=localStorage.getItem("wcup_myid_"+t.id);
      const matchObj=MATCHES.find(m=>m.id===matchId);
      const isJapanMatch=!!(matchObj&&(matchObj.home==="日本"||matchObj.away==="日本"));
      const sortedForRank=[...updatedParticipants].sort((a,b)=>(b.totalMatchPoints||0)-(a.totalMatchPoints||0));
      let badgesForMe=[];
      const withStreakBadges=updatedParticipants.map(p=>{
        try{
          const pred=(p.matchPredictions||{})[matchId];
          if(!pred||pred.points==null) return p;
          const isHit=pred.points>0;
          const ns=updateStreak(p,matchId,isHit);
          const rank=sortedForRank.findIndex(x=>x.id===p.id)+1;
          const withS={...p,streak:ns};
          const nb=checkBadges(withS,{isHit,isJapanMatch,rank});
          const withBadges=nb.length>0?{...withS,badges:[...(p.badges||[]),...nb]}:withS;
          const final=settleBet(withBadges,matchId,isHit);
          if(p.id===myIdLocal) badgesForMe=nb;
          // バッジ獲得チャット投稿
          nb.forEach(badge=>{const bd=BADGES.find(b=>b.id===badge.id);if(bd)postSystemMessage(t.id,`🏆 [${p.nickname}] さんが「${bd.icon} ${bd.name}」バッジを獲得！`).catch(()=>{});});
          return final;
        }catch{return p;}
      });
      await update({...cur,participants:withStreakBadges,results:updatedResults});
      if(badgesForMe.length>0) setEarnedBadgesA(badgesForMe);
      // 自分の予想結果を通知
      try{
        if(myIdLocal){const me=withStreakBadges.find(p=>p.id===myIdLocal);if(me){const pred=(me.matchPredictions||{})[matchId];if(pred)fireResultNotification(matchId,pred,homeS,awayS);}}
      }catch{}
      // 試合結果のシステム投稿（重複防止: 既存の結果投稿チェック）
      try{
        if(db){
          const{data:existing}=await db.from("messages").select("id").eq("tournament_id",t.id).eq("type","system").ilike("body",`%${matchId}%`).limit(1);
          if(!existing||existing.length===0){
            const match=MATCHES.find(m=>m.id===matchId);
            const hits=updatedParticipants.filter(p=>{const pr=(p.matchPredictions||{})[matchId];return pr&&pr.points>0;}).map(p=>p.nickname);
            const misses=updatedParticipants.filter(p=>{const pr=(p.matchPredictions||{})[matchId];return pr&&pr.points===0;}).map(p=>p.nickname);
            const resultLine=`${match?.home||"?"} ${homeS}-${awayS} ${match?.away||"?"}`;
            const hitLine=hits.length>0?`🎯 的中した人: ${hits.join(", ")} (+${SCORING.outcome}pt)`:`🎯 的中者なし`;
            const missLine=misses.length>0?`😢 外した人: ${misses.join(", ")}`:"";
            const body=[`⚽ 試合結果が出ました！(${matchId})`,resultLine,hitLine,missLine].filter(Boolean).join("\n");
            await postSystemMessage(t.id,body);
          }
        }
      }catch{}
      setEditId(null);setHs("");setAs("");
    }finally{setSaving(false);}
  };
  const grouped={};
  relevant.forEach(m=>{
    const key=m.stage==="group"?`グループ${m.group}`:m.stage==="r32"?"ベスト32":m.stage==="r16"?"ベスト16":m.stage==="qf"?"準々決勝":m.stage==="sf"?"準決勝":"決勝系";
    if(!grouped[key])grouped[key]=[];
    grouped[key].push(m);
  });
  if(relevant.length===0)return<div style={{color:G.muted,textAlign:"center",padding:"30px 0"}}>まだ入力可能な試合はありません（キックオフ2週間前から表示）</div>;
  return(
    <>
    <div>
      {/* 自動取得ボタン */}
      <div style={{...crd,padding:"12px 14px",marginBottom:12,background:"rgba(0,91,172,0.04)",border:"1px solid rgba(0,91,172,0.18)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
          <div>
            <div style={{color:G.gold,fontWeight:700,fontSize:13}}>🔄 結果を自動取得</div>
            <div style={{color:G.muted,fontSize:11,marginTop:2}}>ESPN から最新の試合結果を取得します</div>
            <div style={{color:G.muted,fontSize:10,marginTop:1}}>最終取得: {lastFetchStr}</div>
          </div>
          <button onClick={handleAutoFetch} disabled={autoFetching} style={{background:G.gold,color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:autoFetching?"default":"pointer",flexShrink:0,opacity:autoFetching?0.7:1}}>
            {autoFetching?"取得中...":"取得する"}
          </button>
        </div>
        {autoMsg&&<div style={{marginTop:8,fontSize:12,color:autoMsg.startsWith("✅")?"#16A34A":autoMsg.startsWith("ℹ️")?G.muted:G.red,fontWeight:600}}>{autoMsg}</div>}
      </div>
      <ScoringRulesCard compact={true}/>
      <div style={{color:G.muted,fontSize:12,marginBottom:12}}>試合結果を入力すると全参加者の予想が自動採点されます</div>
      {Object.entries(grouped).map(([group,matches])=>(
        <div key={group} style={{marginBottom:16}}>
          <div style={{color:G.gold,fontWeight:700,fontSize:12,marginBottom:8,letterSpacing:1}}>{group}</div>
          {matches.map(m=>{
            const stored=matchResults[m.id];
            const isFinished=!!stored;
            const isEditing=editId===m.id;
            const ko=new Date(m.kickoff).toLocaleDateString("ja-JP",{month:"numeric",day:"numeric"});
            return(
              <div key={m.id} style={{...crd,padding:"12px 14px",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:G.muted,marginBottom:3}}>{ko}</div>
                    <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
                      <FlagImg country={m.home} size={16}/>
                      <span style={{color:"#102A43",fontWeight:700,fontSize:12}}>{m.home}</span>
                      <span style={{color:G.muted,fontSize:11}}>vs</span>
                      <span style={{color:"#102A43",fontWeight:700,fontSize:12}}>{m.away}</span>
                      <FlagImg country={m.away} size={16}/>
                    </div>
                  </div>
                  {isFinished?(
                    <div style={{textAlign:"right"}}>
                      <div style={{color:G.gold,fontWeight:900,fontSize:16}}>{stored.homeScore}-{stored.awayScore}</div>
                      <div style={{marginTop:2}}>
                        {stored.source==="espn-auto"
                          ?<span style={{background:"rgba(22,163,74,0.1)",color:"#16A34A",border:"1px solid rgba(22,163,74,0.3)",borderRadius:8,padding:"1px 6px",fontSize:9,fontWeight:700}}>🔄 自動取得</span>
                          :<span style={{background:"rgba(0,0,0,0.04)",color:G.muted,border:"1px solid #D9E8FF",borderRadius:8,padding:"1px 6px",fontSize:9,fontWeight:600}}>✏️ 手動入力</span>
                        }
                      </div>
                      <button onClick={()=>{setEditId(m.id);setHs(String(stored.homeScore));setAs(String(stored.awayScore));setJScorers(stored.japanScorers||[]);}} style={{...btnRed,padding:"3px 8px",fontSize:10,marginTop:3}}>修正</button>
                    </div>
                  ):(
                    <button onClick={()=>{setEditId(m.id);setHs("");setAs("");setJScorers([]);}} style={{background:G.gold,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>入力</button>
                  )}
                </div>
                {isEditing&&(
                  <div style={{marginTop:10}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                      <input type="number" min="0" max="20" value={hs} onChange={e=>setHs(e.target.value)} style={{...inp,width:56,textAlign:"center",padding:"8px"}} placeholder="H"/>
                      <span style={{color:G.muted,fontWeight:700}}>-</span>
                      <input type="number" min="0" max="20" value={as_} onChange={e=>setAs(e.target.value)} style={{...inp,width:56,textAlign:"center",padding:"8px"}} placeholder="A"/>
                      <button onClick={()=>saveMatchResult(m.id)} disabled={saving} style={{...btnG,width:"auto",padding:"8px 16px",fontSize:12}}>{saving?"…":"保存"}</button>
                      <button onClick={()=>setEditId(null)} style={{...btnGr,width:"auto",padding:"8px 12px",fontSize:12}}>✕</button>
                    </div>
                    {(m.home==="日本"||m.away==="日本")&&(
                      <div>
                        <div style={{color:"#E60033",fontSize:11,fontWeight:700,marginBottom:4}}>🇯🇵 日本の得点者（任意）</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                          {JAPAN_SQUAD.filter(s=>s.id!=="none").map(s=>{
                            const sel=jScorers.includes(s.id);
                            return(
                              <button key={s.id} onClick={()=>setJScorers(prev=>sel?prev.filter(x=>x!==s.id):[...prev,s.id])} style={{
                                background:sel?"#E60033":"rgba(230,0,51,0.06)",color:sel?"#fff":"#E60033",
                                border:`1px solid ${sel?"#E60033":"rgba(230,0,51,0.25)"}`,
                                borderRadius:16,padding:"3px 8px",fontSize:10,fontWeight:sel?700:400,cursor:"pointer",
                              }}>{s.name}</button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
    {earnedBadgesA.length>0&&<BadgeModal badges={earnedBadgesA} onClose={()=>setEarnedBadgesA([])}/>}
    </>
  );
}

/* ── 敗退国管理コンポーネント ── */
function EliminatedManager({tourn,update}){
  const eliminated=(tourn.results?.eliminatedCountries)||[];
  const toggleCountry=async(country)=>{
    const cur=tourn.results||{};
    const list=cur.eliminatedCountries||[];
    const next=list.includes(country)?list.filter(c=>c!==country):[...list,country];
    await update({...tourn,results:{...cur,eliminatedCountries:next}});
  };
  return(
    <div>
      <div style={{color:G.muted,fontSize:12,marginBottom:12}}>敗退した国をタップしてマークしてください。予想生存チェックに反映されます。</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {COUNTRIES.filter(c=>c!=="その他").map(c=>(
          <button key={c} onClick={()=>toggleCountry(c)} style={{display:"flex",alignItems:"center",gap:6,background:eliminated.includes(c)?"rgba(239,68,68,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${eliminated.includes(c)?"rgba(239,68,68,0.5)":"#C9DDF5"}`,borderRadius:10,padding:"6px 10px",cursor:"pointer"}}>
            <FlagImg country={c} size={16}/>
            <span style={{color:eliminated.includes(c)?"#FCA5A5":"#ccc",fontSize:12,fontWeight:eliminated.includes(c)?700:400}}>{c}</span>
            {eliminated.includes(c)&&<span style={{color:"#f77",fontSize:11}}>✕</span>}
          </button>
        ))}
      </div>
      <div style={{marginTop:10,color:G.muted,fontSize:11}}>敗退: {eliminated.length}国 / 残存: {COUNTRIES.filter(c=>c!=="その他").length-eliminated.length}国</div>
    </div>
  );
}

/* ── Upgrade ── */
function PgUpgrade({nav,tourn:t,update}){
  const [unlockCode,setUnlockCode]=useState("");
  const [unlockErr,setUnlockErr]=useState("");
  const [unlocked,setUnlocked]=useState(false);
  const [selPlan,setSelPlan]=useState(null);

  const tryUnlock=async()=>{
    const code=unlockCode.trim().toUpperCase();
    let planKey=null;
    if(code.includes("STANDARD"))planKey="standard";
    else if(code.includes("PREMIUM"))planKey="premium";
    else if(code.includes("GROUP"))planKey="group";
    if(!planKey||!t){setUnlockErr("コードが正しくありません。");return;}
    const plan=STRIPE[planKey];
    const updated={...t,plan:planKey,maxParticipants:plan.people};
    await update(updated);
    setUnlocked(true);
    setTimeout(()=>nav("tournament"),1500);
  };

  const PLANS=[
    {key:"free",   label:"無料",         people:FREE_LIMIT, price:0,    tag:"まずは5人でお試し",      color:"#0068B7", features:["5人まで参加","基本予想","予想一覧","ランキング","ベスト11作成"], note:null},
    {key:"standard",label:"スタンダード",people:10, price:500,  tag:"友達6〜10人で遊ぶならこれ",color:"#0068B7", features:["10人まで参加","詳細統計","予想締切設定","参加者管理","広告なし"], note:"友達グループの定番"},
    {key:"premium", label:"プレミアム",  people:30, price:980,  tag:"サークル・大きめのLINEグループ向け",color:"#D4AF37", features:["30人まで参加","AI優勝候補リスト","ランキング画像生成","ベスト11画像保存","詳細ランキング"], note:"🌟 一番人気"},
    {key:"group",   label:"グループ",    people:50, price:1480, tag:"会社・大人数・イベント向け", color:"#005BAC", features:["50人まで参加","全機能解放","QRコード発行","参加者編集・削除","共有用画像テンプレート"], note:"大規模イベント向け"},
  ];

  const openPayment=(planKey)=>{
    trackEvent("click_upgrade",{plan:planKey,page:"upgrade"});
    const plan=STRIPE[planKey];
    if(!plan.url){alert("このプランのStripe決済ページは準備中です。しばらくお待ちください。");return;}
    window.open(t?`${plan.url}?client_reference_id=${t.id}`:plan.url,"_blank");
  };

  return(
    <div style={{paddingBottom:40}}>
      {/* ヘッダー */}
      <div style={{background:"linear-gradient(180deg,#061533 0%,#0a1f4c 100%)",padding:"36px 20px 24px",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <Back onClick={()=>nav(t?"tournament":"home")}/>
        <div style={{fontSize:44,marginBottom:8}}>🏆</div>
        <div style={{color:G.gold,fontSize:22,fontWeight:900,marginBottom:6}}>プランを選ぶ</div>
        <div style={{color:G.muted,fontSize:13,lineHeight:1.7}}>人数が増えるほど盛り上がる。<br/>ちょうどいいプランを選ぼう。</div>
      </div>

      <div style={{padding:"14px 16px 0"}}>
        {/* 人数早見表 */}
        <div style={{...crd,marginBottom:16}}>
          <div style={{color:G.gold,fontWeight:700,fontSize:12,letterSpacing:1,marginBottom:10}}>👥 何人で遊ぶ？</div>
          <div style={{display:"flex",gap:0,borderRadius:12,overflow:"hidden",border:"1px solid #C9DDF5"}}>
            {[["〜5人","無料","rgba(22,163,74,0.07)"],["〜10人","500円","rgba(0,104,183,0.06)"],["〜30人","980円","rgba(0,91,172,0.08)"],["〜50人","1,480円","rgba(0,61,140,0.1)"]].map(([p,price,bg],i)=>(
              <div key={i} style={{flex:1,background:bg,padding:"8px 4px",textAlign:"center",borderRight:i<4?"1px solid #D9E8FF":"none"}}>
                <div style={{color:"#102A43",fontSize:10,fontWeight:700,marginBottom:2}}>{p}</div>
                <div style={{color:G.gold,fontSize:9,fontWeight:800}}>{price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* プランカード */}
        {PLANS.map((plan,idx)=>{
          const isCurrentPlan=t?.plan===plan.key||(plan.key==="free"&&(!t?.plan||t.plan==="free"));
          const isPremium=plan.key==="premium";
          const isSelectable=plan.key!=="free";
          return(
            <div key={plan.key} style={{...crd,border:isPremium?`2px solid ${plan.color}`:`1px solid ${plan.color}33`,marginBottom:10,position:"relative",opacity:isCurrentPlan?0.7:1}}>
              {plan.note&&<div style={{position:"absolute",top:-11,left:isPremium?"50%":"16px",transform:isPremium?"translateX(-50%)":"none",background:isPremium?`linear-gradient(135deg,${plan.color},#B8922A)`:`${plan.color}22`,border:isPremium?"none":`1px solid ${plan.color}66`,color:isPremium?"#0A1400":plan.color,fontSize:9,fontWeight:800,padding:"2px 12px",borderRadius:20,whiteSpace:"nowrap",boxShadow:isPremium?"0 2px 10px rgba(212,175,55,0.4)":"none"}}>{plan.note}</div>}
              {isCurrentPlan&&<div style={{position:"absolute",top:-11,right:16,background:"#22C55E22",border:"1px solid #22C55E55",color:"#22C55E",fontSize:9,fontWeight:800,padding:"2px 10px",borderRadius:20}}>現在のプラン</div>}

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <div style={{background:`${plan.color}22`,borderRadius:8,padding:"2px 10px"}}>
                      <span style={{color:plan.color,fontSize:13,fontWeight:900}}>{plan.people}人まで</span>
                    </div>
                    <span style={{color:G.navy,fontWeight:800,fontSize:14}}>{plan.label}</span>
                  </div>
                  <div style={{color:G.muted,fontSize:11}}>{plan.tag}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
                  {plan.price===0
                    ?<div style={{color:G.muted,fontWeight:700,fontSize:16}}>無料</div>
                    :<><div style={{color:G.gold,fontWeight:900,fontSize:22,lineHeight:1}}>¥{plan.price.toLocaleString()}</div><div style={{color:G.muted,fontSize:10}}>買い切り</div></>
                  }
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 8px",marginBottom:10}}>
                {plan.features.map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{color:plan.color,fontSize:11,flexShrink:0}}>✓</span>
                    <span style={{color:G.muted,fontSize:11}}>{f}</span>
                  </div>
                ))}
              </div>

              {isSelectable&&!isCurrentPlan&&STRIPE[plan.key]?.url&&(
                <div style={{textAlign:"center",marginBottom:8}}>
                  <div style={{color:G.muted,fontSize:11}}>カード / Apple Pay / Google Pay</div>
                  <div style={{color:G.muted,fontSize:10,marginTop:1}}>対応端末ではウォレット決済が使えます · PayPayは今後対応予定</div>
                </div>
              )}
              {isSelectable&&!isCurrentPlan&&(
                <button onClick={()=>openPayment(plan.key)} style={{...btnG,padding:"11px",fontSize:13}}>
                  {STRIPE[plan.key]?.url?"かんたん決済へ進む":"準備中"}
                </button>
              )}
              {isSelectable&&!isCurrentPlan&&STRIPE[plan.key]?.url&&(
                <div style={{color:G.muted,fontSize:10,textAlign:"center",marginTop:4}}>※現在はテスト決済です。本番公開時に正式リンクへ切り替えます</div>
              )}
            </div>
          );
        })}

        {/* アンロックコード */}
        <div style={{...crd,marginTop:8}}>
          <div style={{color:G.gold,fontWeight:700,fontSize:13,marginBottom:8}}>💳 支払い完了後のアンロック</div>
          <div style={{color:G.muted,fontSize:12,marginBottom:12,lineHeight:1.7}}>決済完了後、メールに記載のアンロックコードを入力してください。</div>
          <div style={{display:"flex",gap:8}}>
            <input style={{...inp,flex:1}} placeholder="アンロックコードを入力" value={unlockCode} onChange={e=>setUnlockCode(e.target.value)}/>
            <button onClick={tryUnlock} style={{background:G.gold,color:"#FFFFFF",border:"none",borderRadius:10,padding:"0 14px",fontWeight:700,cursor:"pointer",flexShrink:0}}>認証</button>
          </div>
          {unlockErr&&<div style={{marginTop:8}}><Err msg={unlockErr}/></div>}
          {unlocked&&<div style={{marginTop:8,color:"#22C55E",fontSize:13,fontWeight:700}}>✅ アンロック完了！</div>}
        </div>
      </div>
    </div>
  );
}



/* ── Groups ── */
function PgGroups({nav,goCountry}){
  const [standings,setStandings]=useState({});const [selGroup,setSelGroup]=useState(null);
  useEffect(()=>{fetchStandings().then(data=>{const map={};data.forEach(group=>{const gName=group.abbreviation||group.name;if(gName&&group.standings?.entries){map[gName]=group.standings.entries.map(e=>({name:ESPN_TO_JP[e.team?.displayName]||e.team?.displayName,w:e.stats?.find(s=>s.name==="wins")?.value||0,d:e.stats?.find(s=>s.name==="ties")?.value||0,l:e.stats?.find(s=>s.name==="losses")?.value||0,gf:e.stats?.find(s=>s.name==="pointsFor")?.value||0,ga:e.stats?.find(s=>s.name==="pointsAgainst")?.value||0,pts:e.stats?.find(s=>s.name==="points")?.value||0}));}});setStandings(map);});},[]);
  return(
    <div style={{paddingBottom:40}}><div style={{background:"linear-gradient(180deg,#061533 0%,#0a1f4c 100%)",padding:"36px 20px 22px",textAlign:"center",position:"relative",overflow:"hidden",borderBottom:"1px solid rgba(255,255,255,0.08)"}}><Back onClick={()=>nav("home")}/><div style={{color:G.gold,fontSize:22,fontWeight:900}}>🗂️ グループ表</div><div style={{color:G.muted,fontSize:12,marginTop:4}}>FIFA ワールドカップ 2026 · 全12グループ</div><div style={{color:G.muted,fontSize:11,marginTop:4}}>FIFAランク: 2026年4月1日最新</div></div>
    <div style={{padding:"12px 18px 0"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4,marginBottom:14}}>{WC_GROUPS.map(g=>(<button key={g.name} onClick={()=>setSelGroup(selGroup===g.name?null:g.name)} style={{background:selGroup===g.name?G.gold:G.card,color:selGroup===g.name?"#111":"#ccc",border:"none",borderRadius:8,padding:"8px 4px",fontSize:13,cursor:"pointer",fontWeight:700}}>{g.name}</button>))}</div>
      {(selGroup?WC_GROUPS.filter(g=>g.name===selGroup):WC_GROUPS).map(group=>{
        const live=standings[`Group ${group.name}`]||standings[group.name]||null;
        return(<div key={group.name} style={{...crd,marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{color:G.gold,fontWeight:900,fontSize:15}}>グループ {group.name}</div>{live&&<div style={{background:"rgba(230,0,51,0.07)",color:"#E60033",fontSize:10,padding:"2px 8px",borderRadius:10,fontWeight:700}}>🔴 LIVE</div>}</div>
          {live?(<div style={{marginBottom:10}}><div style={{display:"grid",gridTemplateColumns:"1fr 28px 28px 28px 28px 28px",gap:4,marginBottom:4}}><div style={{color:G.muted,fontSize:10}}>チーム</div>{["勝","分","負","得失","Pt"].map(h=><div key={h} style={{color:G.muted,fontSize:10,textAlign:"center"}}>{h}</div>)}</div>{live.map((team,i)=>(<div key={i} onClick={()=>goCountry(team.name)} style={{display:"grid",gridTemplateColumns:"1fr 28px 28px 28px 28px 28px",gap:4,marginBottom:4,cursor:"pointer",background:i<2?"rgba(0,104,183,0.06)":"transparent",borderRadius:6,padding:"3px 0"}}><div style={{display:"flex",alignItems:"center",gap:6}}><FlagImg country={team.name} size={18}/><span style={{color:G.navy,fontSize:12}}>{team.name}</span></div>{[team.w,team.d,team.l,`${team.gf}-${team.ga}`].map((v,j)=><div key={j} style={{color:G.muted,fontSize:12,textAlign:"center"}}>{v}</div>)}<div style={{color:G.gold,fontSize:12,textAlign:"center",fontWeight:700}}>{team.pts}</div></div>))}<div style={{color:G.muted,fontSize:10,marginTop:4}}>↑ 上位2チームが決勝T進出</div></div>)
          :(<div style={{display:"flex",flexDirection:"column",gap:6}}>{group.teams.map((team,i)=>{const pct=getAIPct(team.n);const rank=FIFA_RANK[team.n];return(<div key={i} onClick={()=>goCountry(team.n)} style={{display:"flex",alignItems:"center",gap:10,background:G.dark,borderRadius:10,padding:"10px 12px",cursor:"pointer"}}><FlagImg code={team.f} country={team.n} size={28}/><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}><span style={{color:G.navy,fontWeight:600,fontSize:13}}>{team.n}</span>{rank&&<span style={{background:"rgba(0,91,172,0.08)",color:G.gold,fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:10}}>FIFA {rank}位</span>}</div>{pct>0&&<div style={{marginTop:4}}><div style={{background:"rgba(0,91,172,0.1)",borderRadius:4,height:5,overflow:"hidden"}}><div style={{background:pct>=10?G.gold:G.green,width:`${Math.min(pct*5,100)}%`,height:"100%"}}/></div></div>}</div>{pct>0&&<div style={{color:pct>=10?G.gold:G.muted,fontWeight:700,fontSize:13}}>{pct}%</div>}</div>);})}</div>)}
        </div>);
      })}
      <div style={{background:G.dark,borderRadius:10,padding:"12px 14px"}}><div style={{color:G.muted,fontSize:11,lineHeight:1.8}}>※ 優勝確率は世界予想市場データをAIが分析した値です。<br/>※ 開幕（6月11日）後はリアルタイム順位表に切り替わります。</div></div>
    </div></div>
  );
}

/* ── Schedule ── */
function PgSchedule({nav,goCountry}){
  const [matches,setMatches]=useState([]);const [loading,setLoading]=useState(true);const [filter,setFilter]=useState("all");
  useEffect(()=>{fetchMatchRange().then(d=>{setMatches(d);setLoading(false);});},[]);
  const filtered=matches.filter(m=>{const s=m.status?.type?.state;if(filter==="live")return s==="in";if(filter==="done")return s==="post";if(filter==="upcoming")return s==="pre";return true;});
  const grouped={};filtered.forEach(m=>{const date=new Date(m.date).toLocaleDateString("ja-JP",{month:"numeric",day:"numeric",weekday:"short"});if(!grouped[date])grouped[date]=[];grouped[date].push(m);});
  return(
    <div style={{paddingBottom:40}}><div style={{background:"linear-gradient(180deg,#061533 0%,#0a1f4c 100%)",padding:"36px 20px 22px",textAlign:"center",position:"relative",overflow:"hidden",borderBottom:"1px solid rgba(255,255,255,0.08)"}}><Back onClick={()=>nav("home")}/><div style={{color:G.gold,fontSize:22,fontWeight:900}}>📅 試合日程・結果</div><div style={{color:G.muted,fontSize:12,marginTop:4}}>FIFA ワールドカップ 2026</div></div>
    <div style={{padding:"14px 18px 0"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:14}}>{[["all","すべて"],["live","試合中"],["upcoming","予定"],["done","結果"]].map(([v,lb])=>(<button key={v} onClick={()=>setFilter(v)} style={{background:filter===v?G.gold:G.card,color:filter===v?"#111":"#ccc",border:"none",borderRadius:10,padding:"8px 4px",fontSize:12,cursor:"pointer",fontWeight:filter===v?700:400}}>{lb}</button>))}</div>
      {loading?<div style={{color:G.muted,textAlign:"center",padding:"40px 0"}}>⚽ 試合データ取得中...</div>
        :Object.keys(grouped).length===0
          ?<div style={{background:G.card,borderRadius:14,padding:24,textAlign:"center"}}><div style={{fontSize:36,marginBottom:12}}>📅</div><div style={{color:"#fff",fontWeight:700,marginBottom:8}}>W杯開幕まで もうすぐ！</div><div style={{color:G.muted,fontSize:13,lineHeight:1.8}}>2026年6月11日（木）開幕<br/>グループステージ〜決勝（7月19日）</div><div style={{marginTop:16}}><button style={btnO} onClick={()=>nav("groups")}>🗂️ グループ表を見る</button></div></div>
          :Object.entries(grouped).map(([date,ms])=>(<div key={date}><div style={{color:G.muted,fontSize:12,fontWeight:700,padding:"10px 4px 6px",letterSpacing:1}}>{date}</div>{ms.map(m=>{const comps=m.competitions?.[0]?.competitors||[];const home=comps.find(c=>c.homeAway==="home")||comps[0];const away=comps.find(c=>c.homeAway==="away")||comps[1];const status=m.status?.type?.state;const isLive=status==="in";const isDone=status==="post";const homeJp=ESPN_TO_JP[home?.team?.displayName]||home?.team?.displayName;const awayJp=ESPN_TO_JP[away?.team?.displayName]||away?.team?.displayName;const time=new Date(m.date).toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"});const homeRank=FIFA_RANK[homeJp];const awayRank=FIFA_RANK[awayJp];return(<div key={m.id} style={{...crd,marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,textAlign:"right"}}><div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6,cursor:"pointer"}} onClick={()=>homeJp&&goCountry(homeJp)}><div><div style={{color:"#fff",fontSize:13,fontWeight:600}}>{homeJp||"?"}</div>{homeRank&&<div style={{color:G.gold,fontSize:10,textAlign:"right"}}>FIFA {homeRank}位</div>}</div>{homeJp&&<FlagImg country={homeJp} size={22}/>}</div>{isDone&&<div style={{color:G.gold,fontWeight:900,fontSize:20,textAlign:"right",marginTop:2}}>{home?.score}</div>}</div><div style={{textAlign:"center",minWidth:50}}>{isLive?<div style={{background:"#c00",color:"#fff",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:700}}>LIVE</div>:isDone?<div style={{color:G.muted,fontSize:12}}>終了</div>:<div style={{color:G.muted,fontSize:12}}>{time}</div>}</div><div style={{flex:1,textAlign:"left"}}><div style={{display:"flex",alignItems:"center",justifyContent:"flex-start",gap:6,cursor:"pointer"}} onClick={()=>awayJp&&goCountry(awayJp)}>{awayJp&&<FlagImg country={awayJp} size={22}/>}<div><div style={{color:"#fff",fontSize:13,fontWeight:600}}>{awayJp||"?"}</div>{awayRank&&<div style={{color:G.gold,fontSize:10}}>FIFA {awayRank}位</div>}</div></div>{isDone&&<div style={{color:G.gold,fontWeight:900,fontSize:20,marginTop:2}}>{away?.score}</div>}</div></div>{m.name&&<div style={{color:"#445",fontSize:10,textAlign:"center",marginTop:6}}>{m.name}</div>}</div>);})}</div>))}
    </div></div>
  );
}

/* ── Country ── */
function PgCountry({nav,country,goCountry}){
  const [matches,setMatches]=useState([]);const [loading,setLoading]=useState(true);
  const ai=AI_DATA.find(d=>d.country===country);const rank=FIFA_RANK[country];
  const group=WC_GROUPS.find(g=>g.teams.some(t=>t.n===country));const teamData=group?.teams.find(t=>t.n===country);
  useEffect(()=>{if(!country)return;setLoading(true);fetchMatchRange().then(data=>{const name=Object.entries(ESPN_TO_JP).find(([,jp])=>jp===country)?.[0];const filtered=name?data.filter(m=>m.competitions?.[0]?.competitors?.some(c=>c.team?.displayName===name)):[];setMatches(filtered);setLoading(false);});},[country]);
  if(!country)return null;
  return(
    <div style={{paddingBottom:40}}><div style={{background:"linear-gradient(180deg,#061533 0%,#0a1f4c 100%)",padding:"36px 20px 26px",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.08)"}}><Back onClick={()=>nav("ai")}/><div style={{marginBottom:10}}><FlagImg code={teamData?.f} country={country} size={56}/></div><div style={{color:G.gold,fontSize:22,fontWeight:900}}>{country}</div><div style={{display:"flex",justifyContent:"center",gap:12,marginTop:10,flexWrap:"wrap"}}>{rank&&<div style={{background:"rgba(0,104,183,0.07)",borderRadius:10,padding:"6px 14px",textAlign:"center",border:"1px solid rgba(0,104,183,0.15)"}}><div style={{color:G.gold,fontWeight:900,fontSize:18}}>FIFA {rank}位</div><div style={{color:G.muted,fontSize:10}}>2026年4月時点</div></div>}{ai&&<div style={{background:"rgba(0,104,183,0.07)",borderRadius:10,padding:"6px 14px",textAlign:"center",border:"1px solid rgba(0,104,183,0.15)"}}><div style={{color:G.gold,fontWeight:900,fontSize:18}}>{ai.pct}%</div><div style={{color:G.muted,fontSize:10}}>優勝予想確率 {ai.trend}</div></div>}{group&&<div style={{background:"rgba(0,104,183,0.07)",borderRadius:10,padding:"6px 14px",textAlign:"center",border:"1px solid rgba(0,104,183,0.15)"}}><div style={{color:"#102A43",fontWeight:900,fontSize:18}}>グループ {group.name}</div><div style={{color:G.muted,fontSize:10}}>所属グループ</div></div>}</div>{ai&&<div style={{color:G.muted,fontSize:12,marginTop:12,lineHeight:1.6,padding:"0 20px"}}>{ai.reason}</div>}</div>
    <div style={{padding:"14px 18px 0"}}>
      {group&&<div style={{...crd,marginBottom:14}}><div style={{color:G.gold,fontWeight:700,fontSize:13,marginBottom:10}}>🗂️ グループ {group.name} の対戦相手</div>{group.teams.filter(t=>t.n!==country).map((t,i)=>(<div key={i} onClick={()=>goCountry(t.n)} style={{display:"flex",alignItems:"center",gap:10,background:"#FFFFFF",borderRadius:8,padding:"8px 12px",marginBottom:6,cursor:"pointer",border:"1px solid #D9E8FF"}}><FlagImg code={t.f} country={t.n} size={24}/><span style={{color:"#102A43",fontSize:13,flex:1}}>{t.n}</span>{FIFA_RANK[t.n]&&<span style={{color:G.gold,fontSize:11}}>FIFA {FIFA_RANK[t.n]}位</span>}{getAIPct(t.n)>0&&<span style={{color:G.muted,fontSize:11}}>{getAIPct(t.n)}%</span>}</div>))}</div>}
      <div style={{color:G.gold,fontWeight:700,fontSize:14,marginBottom:12}}>📅 試合情報</div>
      {loading?<div style={{color:G.muted,textAlign:"center",padding:"30px 0"}}>取得中...</div>
        :matches.length===0?<div style={{...crd,textAlign:"center"}}><div style={{fontSize:32,marginBottom:10}}>📅</div><div style={{color:"#fff",fontWeight:700,marginBottom:6}}>試合データなし</div><div style={{color:G.muted,fontSize:13,lineHeight:1.8}}>開幕（6月11日）後に表示されます</div></div>
        :matches.map(m=>{const comps=m.competitions?.[0]?.competitors||[];const home=comps.find(c=>c.homeAway==="home")||comps[0];const away=comps.find(c=>c.homeAway==="away")||comps[1];const homeJp=ESPN_TO_JP[home?.team?.displayName]||home?.team?.displayName;const awayJp=ESPN_TO_JP[away?.team?.displayName]||away?.team?.displayName;const isDone=m.status?.type?.state==="post";const isLive=m.status?.type?.state==="in";const date=new Date(m.date).toLocaleDateString("ja-JP",{month:"numeric",day:"numeric"});const time=new Date(m.date).toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"});return(<div key={m.id} style={{...crd,marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{color:G.muted,fontSize:12}}>{date} {time}</div>{isLive&&<div style={{background:"#c00",color:"#fff",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>LIVE</div>}{isDone&&<div style={{color:G.muted,fontSize:12}}>終了</div>}</div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{textAlign:"center",flex:1,cursor:"pointer"}} onClick={()=>homeJp&&goCountry(homeJp)}><FlagImg country={homeJp} size={28}/><div style={{color:"#fff",fontSize:12,marginTop:4,fontWeight:600}}>{homeJp}</div>{FIFA_RANK[homeJp]&&<div style={{color:G.gold,fontSize:10}}>FIFA {FIFA_RANK[homeJp]}位</div>}</div><div style={{textAlign:"center",minWidth:60}}>{isDone?<div style={{color:G.gold,fontWeight:900,fontSize:22}}>{home?.score} - {away?.score}</div>:<div style={{color:G.muted,fontSize:14}}>vs</div>}</div><div style={{textAlign:"center",flex:1,cursor:"pointer"}} onClick={()=>awayJp&&goCountry(awayJp)}><FlagImg country={awayJp} size={28}/><div style={{color:"#fff",fontSize:12,marginTop:4,fontWeight:600}}>{awayJp}</div>{FIFA_RANK[awayJp]&&<div style={{color:G.gold,fontSize:10}}>FIFA {FIFA_RANK[awayJp]}位</div>}</div></div></div>);})}
      <div style={{marginTop:12}}><button style={btnO} onClick={()=>nav("groups")}>← グループ表に戻る</button></div>
    </div></div>
  );
}


/* ═══════════════════════════════════════════
   BEST 11 MAKER（自由配置・日本語名対応）
═══════════════════════════════════════════ */

const PLAYERS = [
  {id:1,nameJa:"三笘 薫",nameEn:"Kaoru Mitoma",short:"三笘",country:"日本",nat:"日本",natCode:"jp",club:"ブライトン",position:"FW"},
  {id:2,nameJa:"久保 建英",nameEn:"Takefusa Kubo",short:"久保",country:"日本",nat:"日本",natCode:"jp",club:"レアル・ソシエダ",position:"MF"},
  {id:3,nameJa:"冨安 健洋",nameEn:"Takehiro Tomiyasu",short:"冨安",country:"日本",nat:"日本",natCode:"jp",club:"アヤックス",position:"DF"},
  {id:4,nameJa:"遠藤 航",nameEn:"Wataru Endo",short:"遠藤",country:"日本",nat:"日本",natCode:"jp",club:"リバプール",position:"MF"},
  {id:5,nameJa:"上田 綺世",nameEn:"Ayase Ueda",short:"上田",country:"日本",nat:"日本",natCode:"jp",club:"フェイエノールト",position:"FW"},
  {id:6,nameJa:"リオネル・メッシ",nameEn:"Lionel Messi",short:"メッシ",country:"アルゼンチン",nat:"アルゼンチン",natCode:"ar",club:"インテル・マイアミ",position:"FW"},
  {id:7,nameJa:"ラウタロ・マルティネス",nameEn:"Lautaro Martinez",short:"ラウタロ",country:"アルゼンチン",nat:"アルゼンチン",natCode:"ar",club:"インテル",position:"FW"},
  {id:8,nameJa:"フリアン・アルバレス",nameEn:"Julian Alvarez",short:"アルバレス",country:"アルゼンチン",nat:"アルゼンチン",natCode:"ar",club:"アトレティコ・マドリード",position:"FW"},
  {id:9,nameJa:"エンソ・フェルナンデス",nameEn:"Enzo Fernandez",short:"エンソ",country:"アルゼンチン",nat:"アルゼンチン",natCode:"ar",club:"チェルシー",position:"MF"},
  {id:10,nameJa:"エミリアーノ・マルティネス",nameEn:"Emiliano Martinez",short:"E.マルティネス",country:"アルゼンチン",nat:"アルゼンチン",natCode:"ar",club:"アストン・ヴィラ",position:"GK"},
  {id:11,nameJa:"ヴィニシウス・ジュニオール",nameEn:"Vinicius Junior",short:"ヴィニシウス",country:"ブラジル",nat:"ブラジル",natCode:"br",club:"レアル・マドリード",position:"FW"},
  {id:12,nameJa:"ロドリゴ",nameEn:"Rodrygo",short:"ロドリゴ",country:"ブラジル",nat:"ブラジル",natCode:"br",club:"レアル・マドリード",position:"FW"},
  {id:13,nameJa:"ハフィーニャ",nameEn:"Raphinha",short:"ハフィーニャ",country:"ブラジル",nat:"ブラジル",natCode:"br",club:"バルセロナ",position:"FW"},
  {id:14,nameJa:"ブルーノ・ギマランイス",nameEn:"Bruno Guimaraes",short:"ギマランイス",country:"ブラジル",nat:"ブラジル",natCode:"br",club:"ニューカッスル",position:"MF"},
  {id:15,nameJa:"アリソン",nameEn:"Alisson",short:"アリソン",country:"ブラジル",nat:"ブラジル",natCode:"br",club:"リバプール",position:"GK"},
  {id:16,nameJa:"マルキーニョス",nameEn:"Marquinhos",short:"マルキーニョス",country:"ブラジル",nat:"ブラジル",natCode:"br",club:"パリ・サンジェルマン",position:"DF"},
  {id:17,nameJa:"キリアン・エムバペ",nameEn:"Kylian Mbappe",short:"エムバペ",country:"フランス",nat:"フランス",natCode:"fr",club:"レアル・マドリード",position:"FW"},
  {id:18,nameJa:"アントワーヌ・グリーズマン",nameEn:"Antoine Griezmann",short:"グリーズマン",country:"フランス",nat:"フランス",natCode:"fr",club:"アトレティコ・マドリード",position:"MF"},
  {id:19,nameJa:"ウスマン・デンベレ",nameEn:"Ousmane Dembele",short:"デンベレ",country:"フランス",nat:"フランス",natCode:"fr",club:"パリ・サンジェルマン",position:"FW"},
  {id:20,nameJa:"オーレリアン・チュアメニ",nameEn:"Aurelien Tchouameni",short:"チュアメニ",country:"フランス",nat:"フランス",natCode:"fr",club:"レアル・マドリード",position:"MF"},
  {id:21,nameJa:"マイク・メニャン",nameEn:"Mike Maignan",short:"メニャン",country:"フランス",nat:"フランス",natCode:"fr",club:"ACミラン",position:"GK"},
  {id:22,nameJa:"ジュード・ベリンガム",nameEn:"Jude Bellingham",short:"ベリンガム",country:"イングランド",nat:"イングランド",natCode:"gb-eng",club:"レアル・マドリード",position:"MF"},
  {id:23,nameJa:"ハリー・ケイン",nameEn:"Harry Kane",short:"ケイン",country:"イングランド",nat:"イングランド",natCode:"gb-eng",club:"バイエルン",position:"FW"},
  {id:24,nameJa:"ブカヨ・サカ",nameEn:"Bukayo Saka",short:"サカ",country:"イングランド",nat:"イングランド",natCode:"gb-eng",club:"アーセナル",position:"FW"},
  {id:25,nameJa:"フィル・フォーデン",nameEn:"Phil Foden",short:"フォーデン",country:"イングランド",nat:"イングランド",natCode:"gb-eng",club:"マン・シティ",position:"MF"},
  {id:26,nameJa:"デクラン・ライス",nameEn:"Declan Rice",short:"ライス",country:"イングランド",nat:"イングランド",natCode:"gb-eng",club:"アーセナル",position:"MF"},
  {id:27,nameJa:"ラミン・ヤマル",nameEn:"Lamine Yamal",short:"ヤマル",country:"スペイン",nat:"スペイン",natCode:"es",club:"バルセロナ",position:"FW"},
  {id:28,nameJa:"ペドリ",nameEn:"Pedri",short:"ペドリ",country:"スペイン",nat:"スペイン",natCode:"es",club:"バルセロナ",position:"MF"},
  {id:29,nameJa:"ロドリ",nameEn:"Rodri",short:"ロドリ",country:"スペイン",nat:"スペイン",natCode:"es",club:"マン・シティ",position:"MF"},
  {id:30,nameJa:"ガビ",nameEn:"Gavi",short:"ガビ",country:"スペイン",nat:"スペイン",natCode:"es",club:"バルセロナ",position:"MF"},
  {id:31,nameJa:"ニコ・ウィリアムズ",nameEn:"Nico Williams",short:"N.ウィリアムズ",country:"スペイン",nat:"スペイン",natCode:"es",club:"アスレティック・ビルバオ",position:"FW"},
  {id:32,nameJa:"クリスティアーノ・ロナウド",nameEn:"Cristiano Ronaldo",short:"ロナウド",country:"ポルトガル",nat:"ポルトガル",natCode:"pt",club:"アル・ナスル",position:"FW"},
  {id:33,nameJa:"ブルーノ・フェルナンデス",nameEn:"Bruno Fernandes",short:"B.フェルナンデス",country:"ポルトガル",nat:"ポルトガル",natCode:"pt",club:"マンチェスター・ユナイテッド",position:"MF"},
  {id:34,nameJa:"ベルナルド・シウバ",nameEn:"Bernardo Silva",short:"シウバ",country:"ポルトガル",nat:"ポルトガル",natCode:"pt",club:"マン・シティ",position:"MF"},
  {id:35,nameJa:"ラファエル・レオン",nameEn:"Rafael Leao",short:"レオン",country:"ポルトガル",nat:"ポルトガル",natCode:"pt",club:"ACミラン",position:"FW"},
  {id:36,nameJa:"ジャマル・ムシアラ",nameEn:"Jamal Musiala",short:"ムシアラ",country:"ドイツ",nat:"ドイツ",natCode:"de",club:"バイエルン",position:"MF"},
  {id:37,nameJa:"フロリアン・ヴィルツ",nameEn:"Florian Wirtz",short:"ヴィルツ",country:"ドイツ",nat:"ドイツ",natCode:"de",club:"レヴァークーゼン",position:"MF"},
  {id:38,nameJa:"ヨシュア・キミッヒ",nameEn:"Joshua Kimmich",short:"キミッヒ",country:"ドイツ",nat:"ドイツ",natCode:"de",club:"バイエルン",position:"MF"},
  {id:39,nameJa:"カイ・ハフェルツ",nameEn:"Kai Havertz",short:"ハフェルツ",country:"ドイツ",nat:"ドイツ",natCode:"de",club:"アーセナル",position:"FW"},
  {id:40,nameJa:"マヌエル・ノイアー",nameEn:"Manuel Neuer",short:"ノイアー",country:"ドイツ",nat:"ドイツ",natCode:"de",club:"バイエルン",position:"GK"},
  {id:41,nameJa:"フィルジル・ファン・ダイク",nameEn:"Virgil van Dijk",short:"ファン・ダイク",country:"オランダ",nat:"オランダ",natCode:"nl",club:"リバプール",position:"DF"},
  {id:42,nameJa:"フレンキー・デ・ヨング",nameEn:"Frenkie de Jong",short:"デ・ヨング",country:"オランダ",nat:"オランダ",natCode:"nl",club:"バルセロナ",position:"MF"},
  {id:43,nameJa:"コーディ・ガクポ",nameEn:"Cody Gakpo",short:"ガクポ",country:"オランダ",nat:"オランダ",natCode:"nl",club:"リバプール",position:"FW"},
  {id:44,nameJa:"シャビ・シモンズ",nameEn:"Xavi Simons",short:"シモンズ",country:"オランダ",nat:"オランダ",natCode:"nl",club:"パリ・サンジェルマン",position:"MF"},
  {id:45,nameJa:"ケヴィン・デ・ブライネ",nameEn:"Kevin De Bruyne",short:"デ・ブライネ",country:"ベルギー",nat:"ベルギー",natCode:"be",club:"マン・シティ",position:"MF"},
  {id:46,nameJa:"ロメル・ルカク",nameEn:"Romelu Lukaku",short:"ルカク",country:"ベルギー",nat:"ベルギー",natCode:"be",club:"ナポリ",position:"FW"},
  {id:47,nameJa:"ティボー・クルトワ",nameEn:"Thibaut Courtois",short:"クルトワ",country:"ベルギー",nat:"ベルギー",natCode:"be",club:"レアル・マドリード",position:"GK"},
  {id:48,nameJa:"ルカ・モドリッチ",nameEn:"Luka Modric",short:"モドリッチ",country:"クロアチア",nat:"クロアチア",natCode:"hr",club:"レアル・マドリード",position:"MF"},
  {id:49,nameJa:"マテオ・コバチッチ",nameEn:"Mateo Kovacic",short:"コバチッチ",country:"クロアチア",nat:"クロアチア",natCode:"hr",club:"マン・シティ",position:"MF"},
  {id:50,nameJa:"ヨシュコ・グヴァルディオル",nameEn:"Josko Gvardiol",short:"グヴァルディオル",country:"クロアチア",nat:"クロアチア",natCode:"hr",club:"マン・シティ",position:"DF"},
  {id:51,nameJa:"ダルウィン・ヌニェス",nameEn:"Darwin Nunez",short:"ヌニェス",country:"ウルグアイ",nat:"ウルグアイ",natCode:"uy",club:"リバプール",position:"FW"},
  {id:52,nameJa:"フェデリコ・バルベルデ",nameEn:"Federico Valverde",short:"バルベルデ",country:"ウルグアイ",nat:"ウルグアイ",natCode:"uy",club:"レアル・マドリード",position:"MF"},
  {id:53,nameJa:"ルイス・ディアス",nameEn:"Luis Diaz",short:"L.ディアス",country:"コロンビア",nat:"コロンビア",natCode:"co",club:"リバプール",position:"FW"},
  {id:54,nameJa:"ハメス・ロドリゲス",nameEn:"James Rodriguez",short:"ハメス",country:"コロンビア",nat:"コロンビア",natCode:"co",club:"ラシン",position:"MF"},
  {id:55,nameJa:"アクラフ・ハキミ",nameEn:"Achraf Hakimi",short:"ハキミ",country:"モロッコ",nat:"モロッコ",natCode:"ma",club:"パリ・サンジェルマン",position:"DF"},
  {id:56,nameJa:"ハキム・ツィエク",nameEn:"Hakim Ziyech",short:"ツィエク",country:"モロッコ",nat:"モロッコ",natCode:"ma",club:"ガラタサライ",position:"MF"},
  {id:57,nameJa:"サディオ・マネ",nameEn:"Sadio Mane",short:"マネ",country:"セネガル",nat:"セネガル",natCode:"sn",club:"アル・ナスル",position:"FW"},
  {id:58,nameJa:"カリドゥ・クリバリ",nameEn:"Kalidou Koulibaly",short:"クリバリ",country:"セネガル",nat:"セネガル",natCode:"sn",club:"アル・ヒラル",position:"DF"},
  {id:59,nameJa:"クリスチャン・プリシッチ",nameEn:"Christian Pulisic",short:"プリシッチ",country:"アメリカ",nat:"アメリカ",natCode:"us",club:"ACミラン",position:"FW"},
  {id:60,nameJa:"ウェストン・マッケニー",nameEn:"Weston McKennie",short:"マッケニー",country:"アメリカ",nat:"アメリカ",natCode:"us",club:"ユベントス",position:"MF"},
  {id:61,nameJa:"サンティアゴ・ヒメネス",nameEn:"Santiago Gimenez",short:"S.ヒメネス",country:"メキシコ",nat:"メキシコ",natCode:"mx",club:"ACミラン",position:"FW"},
  {id:62,nameJa:"イルビング・ロサノ",nameEn:"Hirving Lozano",short:"ロサノ",country:"メキシコ",nat:"メキシコ",natCode:"mx",club:"PSV",position:"FW"},
  {id:63,nameJa:"アルフォンソ・デイヴィス",nameEn:"Alphonso Davies",short:"デイヴィス",country:"カナダ",nat:"カナダ",natCode:"ca",club:"バイエルン",position:"DF"},
  {id:64,nameJa:"ジョナサン・デイヴィッド",nameEn:"Jonathan David",short:"J.デイヴィッド",country:"カナダ",nat:"カナダ",natCode:"ca",club:"リール",position:"FW"},
  {id:65,nameJa:"ソン・フンミン",nameEn:"Son Heung-min",short:"ソン",country:"韓国",nat:"韓国",natCode:"kr",club:"トッテナム",position:"FW"},
  {id:66,nameJa:"キム・ミンジェ",nameEn:"Kim Min-jae",short:"キム",country:"韓国",nat:"韓国",natCode:"kr",club:"バイエルン",position:"DF"},
  {id:67,nameJa:"イ・ガンイン",nameEn:"Lee Kang-in",short:"イ",country:"韓国",nat:"韓国",natCode:"kr",club:"パリ・サンジェルマン",position:"MF"},
  {id:68,nameJa:"アーリング・ハーランド",nameEn:"Erling Haaland",short:"ハーランド",country:"ノルウェー",nat:"ノルウェー",natCode:"no",club:"マン・シティ",position:"FW"},
  {id:69,nameJa:"マルティン・ウーデゴール",nameEn:"Martin Odegaard",short:"ウーデゴール",country:"ノルウェー",nat:"ノルウェー",natCode:"no",club:"アーセナル",position:"MF"},
  {id:70,nameJa:"マシュー・ライアン",nameEn:"Mathew Ryan",short:"ライアン",country:"オーストラリア",nat:"オーストラリア",natCode:"au",club:"コペンハーゲン",position:"GK"},
  {id:71,nameJa:"ジャクソン・アーバイン",nameEn:"Jackson Irvine",short:"アーバイン",country:"オーストラリア",nat:"オーストラリア",natCode:"au",club:"セントパウリ",position:"MF"},
];

// フォーメーションプリセット（位置の初期値として使用）
const FORMATIONS = {
  "4-3-3":[
    {pos:"GK",x:50,y:87},{pos:"LB",x:12,y:70},{pos:"LCB",x:34,y:70},{pos:"RCB",x:66,y:70},{pos:"RB",x:88,y:70},
    {pos:"LCM",x:22,y:50},{pos:"CM",x:50,y:47},{pos:"RCM",x:78,y:50},
    {pos:"LW",x:14,y:22},{pos:"ST",x:50,y:17},{pos:"RW",x:86,y:22},
  ],
  "4-4-2":[
    {pos:"GK",x:50,y:87},{pos:"LB",x:12,y:70},{pos:"LCB",x:34,y:70},{pos:"RCB",x:66,y:70},{pos:"RB",x:88,y:70},
    {pos:"LM",x:12,y:50},{pos:"LCM",x:36,y:50},{pos:"RCM",x:64,y:50},{pos:"RM",x:88,y:50},
    {pos:"LS",x:34,y:20},{pos:"RS",x:66,y:20},
  ],
  "3-5-2":[
    {pos:"GK",x:50,y:87},{pos:"LCB",x:22,y:70},{pos:"CB",x:50,y:70},{pos:"RCB",x:78,y:70},
    {pos:"LM",x:8,y:50},{pos:"LCM",x:28,y:50},{pos:"CM",x:50,y:50},{pos:"RCM",x:72,y:50},{pos:"RM",x:92,y:50},
    {pos:"LS",x:34,y:20},{pos:"RS",x:66,y:20},
  ],
  "4-2-3-1":[
    {pos:"GK",x:50,y:87},{pos:"LB",x:12,y:72},{pos:"LCB",x:34,y:72},{pos:"RCB",x:66,y:72},{pos:"RB",x:88,y:72},
    {pos:"LDM",x:34,y:58},{pos:"RDM",x:66,y:58},
    {pos:"LW",x:14,y:38},{pos:"AM",x:50,y:38},{pos:"RW",x:86,y:38},
    {pos:"ST",x:50,y:18},
  ],
};

const NAT_BG={"日本":"#003087","アルゼンチン":"#6bbfff","ポルトガル":"#006600","ブラジル":"#009c3b","フランス":"#002395","ノルウェー":"#ef2b2d","イングランド":"#cf091e","スペイン":"#aa151b","ベルギー":"#c00","オランダ":"#e77d00","ドイツ":"#222","クロアチア":"#003366","ウルグアイ":"#5cb8e4","コロンビア":"#fcd116","モロッコ":"#c1272d","セネガル":"#00853f","アメリカ":"#bf0a30","メキシコ":"#006847","カナダ":"#ff0000","韓国":"#003478","オーストラリア":"#00008b"};

function PlayerAvatar({player,size=42,preview=false}){
  const bg=NAT_BG[player.nat]||"#444";
  const initials=player.short.slice(0,2);
  return(
    <div style={{position:"relative",display:"inline-block"}}>
      <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.28,fontWeight:900,border:"2.5px solid rgba(255,255,255,0.9)",boxShadow:"0 2px 8px rgba(0,0,0,0.5)",flexShrink:0,letterSpacing:-0.5}}>
        {initials}
      </div>
      {!preview&&<img src={`https://flagcdn.com/w20/${player.natCode}.png`} alt={player.nat} style={{position:"absolute",bottom:-2,right:-4,width:14,height:10,borderRadius:2,border:"1px solid #fff",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>}
    </div>
  );
}

function PitchFree({placed,onPitchTap,onPlayerTap,movingUid,preview=false,onPlayerDrag}){
  const pitchRef=useRef(null);
  const dragRef=useRef(null); // {uid, isDragging, timer, startX, startY}
  const rafRef=useRef(null);
  const pitchH=preview?300:360;

  const getXY=useCallback((clientX,clientY)=>{
    if(!pitchRef.current)return{x:50,y:50};
    const r=pitchRef.current.getBoundingClientRect();
    return{x:Math.min(Math.max(((clientX-r.left)/r.width)*100,3),97),y:Math.min(Math.max(((clientY-r.top)/r.height)*100,3),97)};
  },[]);

  // ノンパッシブtouchmoveをuseEffectで登録（preventDefault可能）
  useEffect(()=>{
    const el=pitchRef.current;
    if(!el||preview)return;
    const handleMove=(e)=>{
      if(!dragRef.current)return;
      const touch=e.touches[0];
      const dx=Math.abs(touch.clientX-(dragRef.current.startX||0));
      const dy=Math.abs(touch.clientY-(dragRef.current.startY||0));
      if(!dragRef.current.isDragging){
        if(dx>10||dy>10){clearTimeout(dragRef.current.timer);dragRef.current=null;}
        return;
      }
      e.preventDefault();
      if(rafRef.current)cancelAnimationFrame(rafRef.current);
      const cx=touch.clientX,cy=touch.clientY;
      rafRef.current=requestAnimationFrame(()=>{
        if(!dragRef.current||!onPlayerDrag)return;
        const{x,y}=getXY(cx,cy);
        onPlayerDrag(dragRef.current.uid,x,y);
      });
    };
    el.addEventListener("touchmove",handleMove,{passive:false});
    return()=>el.removeEventListener("touchmove",handleMove);
  },[preview,getXY,onPlayerDrag]);

  const onPlayerTouchStart=useCallback((e,slot)=>{
    if(preview)return;
    e.stopPropagation();
    const touch=e.touches[0];
    const timer=setTimeout(()=>{
      if(dragRef.current&&dragRef.current.uid===slot.uid){
        dragRef.current.isDragging=true;
        try{navigator.vibrate&&navigator.vibrate(40);}catch{}
      }
    },320);
    dragRef.current={uid:slot.uid,timer,isDragging:false,startX:touch.clientX,startY:touch.clientY};
  },[preview]);

  const onPlayerTouchEnd=useCallback((e,slot)=>{
    if(preview)return;
    const was=dragRef.current?.isDragging;
    if(dragRef.current?.timer)clearTimeout(dragRef.current.timer);
    dragRef.current=null;
    if(!was)onPlayerTap&&onPlayerTap(slot);
  },[preview,onPlayerTap]);

  // マウス（PC）用
  const onPlayerMouseDown=useCallback((e,slot)=>{
    if(preview)return;
    e.stopPropagation();e.preventDefault();
    const startX=e.clientX,startY=e.clientY;
    dragRef.current={uid:slot.uid,timer:null,isDragging:false};
    const onMove=(ev)=>{
      const dx=Math.abs(ev.clientX-startX),dy=Math.abs(ev.clientY-startY);
      if(dx>6||dy>6){if(dragRef.current)dragRef.current.isDragging=true;}
      if(!dragRef.current?.isDragging)return;
      if(rafRef.current)cancelAnimationFrame(rafRef.current);
      const cx=ev.clientX,cy=ev.clientY;
      rafRef.current=requestAnimationFrame(()=>{
        if(!dragRef.current||!onPlayerDrag)return;
        const{x,y}=getXY(cx,cy);
        onPlayerDrag(dragRef.current.uid,x,y);
      });
    };
    const onUp=()=>{
      const was=dragRef.current?.isDragging;
      dragRef.current=null;
      document.removeEventListener("mousemove",onMove);
      document.removeEventListener("mouseup",onUp);
      if(!was)onPlayerTap&&onPlayerTap(slot);
    };
    document.addEventListener("mousemove",onMove);
    document.addEventListener("mouseup",onUp);
  },[preview,getXY,onPlayerDrag,onPlayerTap]);

  const handlePitchClick=useCallback((e)=>{
    if(preview||!onPitchTap||dragRef.current)return;
    const{x,y}=getXY(e.clientX,e.clientY);
    onPitchTap(x,y);
  },[preview,onPitchTap,getXY]);

  return(
    <div ref={pitchRef} onClick={handlePitchClick}
      style={{position:"relative",width:"100%",height:pitchH,background:"linear-gradient(180deg,#1E8040 0%,#2DB558 25%,#1E8040 50%,#2DB558 75%,#1E8040 100%)",borderRadius:preview?8:12,overflow:"hidden",flexShrink:0,cursor:movingUid?"crosshair":"default",userSelect:"none",WebkitUserSelect:"none"}}>
      <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="3" y="2" width="94" height="96" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6"/>
        <line x1="3" y1="50" x2="97" y2="50" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
        <ellipse cx="50" cy="50" rx="12" ry="9" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
        <circle cx="50" cy="50" r="0.8" fill="rgba(255,255,255,0.7)"/>
        <rect x="24" y="2" width="52" height="18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5"/>
        <rect x="37" y="2" width="26" height="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
        <rect x="24" y="80" width="52" height="18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5"/>
        <rect x="37" y="90" width="26" height="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
        <circle cx="50" cy="13" r="0.8" fill="rgba(255,255,255,0.6)"/>
        <circle cx="50" cy="87" r="0.8" fill="rgba(255,255,255,0.6)"/>
      </svg>
      {placed.map(slot=>{
        const isMoving=movingUid===slot.uid;
        const nameStr=slot.player?slot.player.short:(slot.posLabel||"+");
        return(
          <div key={slot.uid}
            onTouchStart={e=>onPlayerTouchStart(e,slot)}
            onTouchEnd={e=>onPlayerTouchEnd(e,slot)}
            onMouseDown={e=>onPlayerMouseDown(e,slot)}
            onClick={e=>e.stopPropagation()}
            style={{position:"absolute",left:`${slot.x}%`,top:`${slot.y}%`,transform:"translate(-50%,-50%)",textAlign:"center",cursor:"grab",zIndex:10,outline:isMoving?`3px solid ${G.gold}`:"none",borderRadius:50,padding:2,touchAction:"none",WebkitTouchCallout:"none"}}>
            {slot.player
              ?<PlayerAvatar player={slot.player} size={preview?28:38} preview={preview}/>
              :<div style={{width:preview?26:36,height:preview?26:36,borderRadius:"50%",background:"rgba(255,255,255,0.15)",border:"2px dashed rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:preview?13:18,fontWeight:700,margin:"0 auto"}}>+</div>
            }
            <div style={{color:"#fff",fontSize:preview?7.5:9,fontWeight:700,textShadow:"0 1px 4px rgba(0,0,0,0.9)",marginTop:2,maxWidth:preview?40:52,lineHeight:1.2,overflow:"hidden",whiteSpace:"nowrap"}}>
              {nameStr}
            </div>
          </div>
        );
      })}
      {movingUid&&!preview&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(0,0,0,0.7)",borderRadius:10,padding:"6px 14px",pointerEvents:"none"}}><div style={{color:G.gold,fontSize:11,fontWeight:700}}>タップして移動先を指定</div></div>}
      {!preview&&placed.length<11&&!movingUid&&<div style={{position:"absolute",bottom:8,left:0,right:0,textAlign:"center",color:"rgba(255,255,255,0.4)",fontSize:10,pointerEvents:"none"}}>ピッチをタップして追加 / 長押しでドラッグ移動</div>}
    </div>
  );
}

function PlayerSelectModal({open,onSelect,onClose,title="選手を選ぶ"}){
  const [search,setSearch]=useState("");
  if(!open)return null;
  const filtered=PLAYERS.filter(p=>p.nameJa.includes(search)||p.short.includes(search)||p.nat.includes(search)||p.club.includes(search));
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:G.card,borderRadius:"20px 20px 0 0",padding:20,width:"100%",maxWidth:480,maxHeight:"82vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{color:G.gold,fontWeight:700,fontSize:15}}>⚽ {title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:G.muted,cursor:"pointer",fontSize:22,lineHeight:1}}>✕</button>
        </div>
        <input style={{...inp,marginBottom:10}} placeholder="選手名・国籍・クラブで検索..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus/>
        <div style={{overflowY:"auto",flex:1}}>
          {filtered.map(p=>(
            <div key={p.id} onClick={()=>onSelect(p)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 8px",borderBottom:"1px solid #1a3a28",cursor:"pointer",borderRadius:8}}>
              <PlayerAvatar player={p} size={36}/>
              <div style={{flex:1}}>
                <div style={{color:"#fff",fontWeight:700,fontSize:13}}>{p.nameJa}</div>
                <div style={{color:G.muted,fontSize:11}}>{p.club} · {p.country} <span style={{color:"#666",fontSize:10}}>{p.position}</span></div>
              </div>
              <img src={`https://flagcdn.com/w20/${p.natCode}.png`} alt={p.nat} style={{width:20,height:14,borderRadius:2,objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
            </div>
          ))}
          {filtered.length===0&&<div style={{color:G.muted,textAlign:"center",padding:"30px 0"}}>見つかりませんでした</div>}
        </div>
      </div>
    </div>
  );
}

function PlayerOptionsModal({open,slot,onChangePlayer,onDelete,onMove,onClose}){
  if(!open||!slot)return null;
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:G.card,borderRadius:"20px 20px 0 0",padding:20,width:"100%",maxWidth:480}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          {slot.player&&<PlayerAvatar player={slot.player} size={44}/>}
          <div>
            <div style={{color:"#fff",fontWeight:700,fontSize:15}}>{slot.player?slot.player.nameJa:slot.posLabel||"空きポジション"}</div>
            {slot.player&&<div style={{color:G.muted,fontSize:12}}>{slot.player.club} · {slot.player.nat}</div>}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {slot.player?(
            <>
              <button onClick={onChangePlayer} style={{...btnO,padding:"12px"}}>🔄 選手を変更する</button>
              <button onClick={onMove} style={{...btnO,padding:"12px"}}>↔️ 位置を移動する（タップで移動先指定）</button>
              <button onClick={onDelete} style={{background:"transparent",color:"#f77",fontWeight:700,borderRadius:14,padding:"12px",fontSize:14,border:"2px solid #f774",cursor:"pointer",width:"100%"}}>🗑️ 外す</button>
            </>
          ):(
            <>
              <button onClick={onChangePlayer} style={{...btnG,padding:"12px"}}>⚽ 選手を追加する</button>
              <button onClick={onMove} style={{...btnO,padding:"12px"}}>↔️ 位置を移動する</button>
              <button onClick={onDelete} style={{background:"transparent",color:"#f77",fontWeight:700,borderRadius:14,padding:"12px",fontSize:14,border:"2px solid #f774",cursor:"pointer",width:"100%"}}>🗑️ このスロットを削除</button>
            </>
          )}
          <button onClick={onClose} style={{...btnGr,padding:"11px"}}>キャンセル</button>
        </div>
      </div>
    </div>
  );
}

function PgBest11({nav}){
  const [b11page,setB11page]=useState("top");
  const [teamName,setTeamName]=useState("");
  const [formLabel,setFormLabel]=useState("4-3-3");
  const [placed,setPlaced]=useState([]);
  const [modal,setModal]=useState(null);
  const [movingUid,setMovingUid]=useState(null);
  const [saving,setSaving]=useState(false);
  const previewRef=useRef(null);

  const filledCount=placed.filter(s=>s.player).length;

  const loadFormation=(f)=>{
    setFormLabel(f);
    setPlaced(FORMATIONS[f].map((pos,i)=>({uid:"f"+i,player:null,x:pos.x,y:pos.y,posLabel:pos.pos})));
    setMovingUid(null);
  };

  const handlePlayerDrag=useCallback((uid,x,y)=>{
    setPlaced(p=>p.map(s=>s.uid===uid?{...s,x,y}:s));
  },[]);

  const handlePitchTap=(x,y)=>{
    if(movingUid){
      setPlaced(p=>p.map(s=>s.uid===movingUid?{...s,x,y}:s));
      setMovingUid(null);
      return;
    }
    if(placed.length>=11&&placed.every(s=>s.player))return;
    if(placed.length>=11)return;
    setModal({type:"addPlayer",x,y});
  };

  const handlePlayerTap=(slot)=>{
    if(movingUid){
      if(movingUid===slot.uid){setMovingUid(null);return;}
      setPlaced(p=>p.map(s=>s.uid===movingUid?{...s,x:slot.x,y:slot.y}:s));
      setMovingUid(null);
      return;
    }
    setModal({type:"editPlayer",slot});
  };

  const addPlayerToPos=(player)=>{
    const {x,y}=modal;
    setPlaced(p=>[...p,{uid:genId(),player,x,y,posLabel:""}]);
    setModal(null);
  };

  const changePlayer=(player)=>{
    setPlaced(p=>p.map(s=>s.uid===modal.slot.uid?{...s,player}:s));
    setModal(null);
  };

  const removeSlot=()=>{
    setPlaced(p=>p.filter(s=>s.uid!==modal.slot.uid));
    setModal(null);
  };

  const startMove=()=>{
    setMovingUid(modal.slot.uid);
    setModal(null);
  };

  const saveImage=async()=>{
    if(!previewRef.current){alert("プレビューが見つかりません");return;}
    setSaving(true);
    try{
      const html2canvas=await loadHtml2Canvas();
      const canvas=await html2canvas(previewRef.current,{useCORS:true,allowTaint:true,scale:2,backgroundColor:"#08200f"});
      const link=document.createElement("a");
      link.download=`${teamName||"best11"}.png`;
      link.href=canvas.toDataURL("image/png");
      link.click();
    }catch(e){
      alert("画像の保存に失敗しました。\n画面をスクリーンショットして保存してください。");
    }
    setSaving(false);
  };

  // TOP
  if(b11page==="top")return(
    <div style={{paddingBottom:40}}>
      <div style={{background:"linear-gradient(180deg,#061533 0%,#0a1f4c 100%)",padding:"50px 22px 40px",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <img src={LOGO_IMG} alt="ロゴ" style={{width:72,height:72,borderRadius:"50%",objectFit:"cover",marginBottom:10,boxShadow:"0 0 0 3px rgba(0,104,183,0.2),0 4px 20px rgba(0,91,172,0.15)"}}/>
        <div style={{color:G.gold,fontSize:24,fontWeight:900,letterSpacing:1,marginBottom:4}}>ベスト11メーカー</div>
        <div style={{color:"#102A43",fontSize:13,marginTop:12,lineHeight:1.9}}>あなたの最強スタメンを作ろう。</div>
        <div style={{color:G.muted,fontSize:12,marginTop:6,lineHeight:1.9}}>フォーメーションを選んで選手を自由に配置、<br/>ストーリー用画像として保存できます。</div>
        <div style={{marginTop:26,display:"flex",flexDirection:"column",gap:12}}>
          <button style={btnG} onClick={()=>setB11page("team")}>🚀 今すぐ作る</button>
          <button style={btnGr} onClick={()=>nav("home")}>← トップに戻る</button>
        </div>
      </div>
      <div style={{padding:"20px 18px 0"}}>
        {[["🏟️","フォーメーションから始める","4-3-3など選ぶと位置を自動配置。その後自由に動かせます"],["⚽","選手を自由に配置","ピッチをタップして好きな場所に選手を追加。ドラッグ感覚で移動可能"],["📱","ストーリー用に保存","縦長カードを生成してインスタやXに投稿できます"]].map(([ic,t,d])=>(
          <div key={t} style={{...crd,display:"flex",gap:14,alignItems:"flex-start"}}><div style={{fontSize:22,flexShrink:0}}>{ic}</div><div><div style={{color:"#fff",fontWeight:700,fontSize:13}}>{t}</div><div style={{color:G.muted,fontSize:12,marginTop:4,lineHeight:1.6}}>{d}</div></div></div>
        ))}
      </div>
    </div>
  );

  // TEAM NAME
  if(b11page==="team")return(
    <div style={{padding:"20px 18px 40px"}}>
      <Back onClick={()=>setB11page("top")}/>
      <div style={{color:G.gold,fontSize:21,fontWeight:900,marginBottom:4}}>チーム名を決めよう</div>
      <div style={{color:G.muted,fontSize:13,marginBottom:20}}>あなたのベスト11のチーム名を入力してください</div>
      <div style={crd}><FInput label="チーム名" placeholder="例: 俺のW杯ベスト11" value={teamName} onChange={setTeamName}/></div>
      <button style={btnG} onClick={()=>{if(!teamName.trim()){alert("チーム名を入力してください");return;}setB11page("formation");}}>次へ →</button>
    </div>
  );

  // FORMATION
  if(b11page==="formation")return(
    <div style={{padding:"20px 18px 40px"}}>
      <Back onClick={()=>setB11page("team")}/>
      <div style={{color:G.gold,fontSize:21,fontWeight:900,marginBottom:4}}>スタート位置を選ぶ</div>
      <div style={{color:G.muted,fontSize:13,marginBottom:20}}>フォーメーションを選ぶと位置が自動配置されます。<br/>あとから自由に動かせます。</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
        {Object.keys(FORMATIONS).map(f=>(
          <div key={f} onClick={()=>setFormLabel(f)} style={{...crd,border:`2px solid ${formLabel===f?G.gold:"transparent"}`,cursor:"pointer",marginBottom:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{color:formLabel===f?G.gold:"#fff",fontWeight:700,fontSize:18}}>{f}</div>
              <div style={{color:G.muted,fontSize:12,marginTop:2}}>{{
                "4-3-3":"攻撃的・ウィングを活かす",
                "4-4-2":"バランス型・古典的布陣",
                "3-5-2":"中盤支配・ウィングバック",
                "4-2-3-1":"守備的ミッドフィールダー2枚",
              }[f]}</div>
            </div>
            {formLabel===f&&<div style={{color:G.gold,fontSize:20}}>✓</div>}
          </div>
        ))}
      </div>
      <button style={btnG} onClick={()=>{loadFormation(formLabel);setB11page("pitch");}}>この布陣で開始 →</button>
      <div style={{marginTop:10}}><button style={btnO} onClick={()=>{setPlaced([]);setMovingUid(null);setB11page("pitch");}}>空白から自由に配置する</button></div>
    </div>
  );

  // PITCH
  if(b11page==="pitch")return(
    <div style={{paddingBottom:40}}>
      <div style={{padding:"14px 18px 0"}}><Back onClick={()=>setB11page("formation")}/></div>
      <div style={{background:"linear-gradient(180deg,#061533 0%,#0a1f4c 100%)",padding:"10px 20px 14px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{color:G.gold,fontSize:17,fontWeight:900}}>{teamName}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <input value={formLabel} onChange={e=>setFormLabel(e.target.value)} style={{background:"#FFFFFF",border:`1px solid rgba(0,104,183,0.3)`,borderRadius:8,color:G.gold,fontSize:11,fontWeight:700,padding:"3px 8px",width:60,textAlign:"center",outline:"none"}}/>
            <span style={{color:G.muted,fontSize:12}}>{filledCount}/11人</span>
          </div>
        </div>
        {movingUid&&<div style={{color:G.gold,fontSize:11,textAlign:"center",marginTop:6,fontWeight:700}}>↔️ 移動先のピッチをタップしてください</div>}
      </div>
      <div style={{padding:"10px 14px 0"}}>
        <PitchFree placed={placed} onPitchTap={handlePitchTap} onPlayerTap={handlePlayerTap} movingUid={movingUid} onPlayerDrag={handlePlayerDrag}/>
        <div style={{marginTop:12,display:"flex",gap:8}}>
          <button style={{...btnO,flex:1,padding:"11px 8px",fontSize:13}} onClick={()=>setB11page("formation")}>🔄 布陣変更</button>
          <button style={{...btnGr,flex:1,padding:"11px 8px",fontSize:13}} onClick={()=>{if(window.confirm("全選手を削除しますか？")){setPlaced([]);setMovingUid(null);}}}>🗑️ リセット</button>
        </div>
        <div style={{marginTop:10}}><button style={btnG} onClick={()=>setB11page("preview")}>📱 プレビューを見る</button></div>
      </div>
      {/* Add player modal */}
      <PlayerSelectModal open={modal?.type==="addPlayer"} title="追加する選手を選ぶ" onSelect={addPlayerToPos} onClose={()=>setModal(null)}/>
      {/* Edit player options modal */}
      <PlayerOptionsModal open={modal?.type==="editPlayer"} slot={modal?.slot}
        onChangePlayer={()=>setModal({...modal,type:"changePlayer"})}
        onDelete={removeSlot} onMove={startMove} onClose={()=>setModal(null)}/>
      <PlayerSelectModal open={modal?.type==="changePlayer"} title="選手を変更する" onSelect={changePlayer} onClose={()=>setModal(null)}/>
    </div>
  );

  // PREVIEW
  if(b11page==="preview")return(
    <div style={{paddingBottom:40}}>
      <div style={{padding:"14px 18px 0"}}><Back onClick={()=>setB11page("pitch")}/></div>
      <div style={{color:G.gold,fontSize:18,fontWeight:900,textAlign:"center",marginBottom:14}}>📱 ストーリープレビュー</div>
      <div ref={previewRef} style={{margin:"0 auto",width:"min(340px,90vw)",background:"linear-gradient(180deg,#061A0D 0%,#0A2E14 40%,#061A0D 100%)",borderRadius:22,overflow:"hidden",boxShadow:"0 12px 48px rgba(0,0,0,0.7),0 0 0 1px rgba(247,201,72,0.15)",border:`1.5px solid rgba(247,201,72,0.25)`}}>
        <div style={{padding:"22px 20px 14px",textAlign:"center"}}>
          <div style={{color:G.gold,fontSize:11,fontWeight:700,letterSpacing:3,marginBottom:6}}>MY BEST XI</div>
          <div style={{color:"#fff",fontSize:20,fontWeight:900,marginBottom:6}}>{teamName}</div>
          <span style={{background:G.gold,color:"#FFFFFF",fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:20}}>{formLabel}</span>
        </div>
        <div style={{padding:"0 14px"}}>
          <PitchFree placed={placed} onPitchTap={null} onPlayerTap={null} movingUid={null} preview={true}/>
        </div>
        <div style={{padding:"12px 16px 0"}}>
          <div style={{color:G.muted,fontSize:10,fontWeight:700,letterSpacing:2,marginBottom:8,textAlign:"center"}}>SQUAD</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
            {placed.filter(s=>s.player).map((slot,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.05)",borderRadius:8,padding:"6px 8px"}}>
                <PlayerAvatar player={slot.player} size={22} preview={true}/>
                <div style={{overflow:"hidden"}}>
                  <div style={{color:"#fff",fontSize:9,fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{slot.player.short}</div>
                  <div style={{color:G.muted,fontSize:8}}>{slot.posLabel||"FP"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:"12px 20px",textAlign:"center",borderTop:`1px solid ${G.gold}22`,marginTop:12}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><img src={LOGO_IMG} alt="ロゴ" style={{width:22,height:22,borderRadius:"50%",objectFit:"cover"}}/><span style={{color:G.gold,fontSize:11,fontWeight:700}}>W杯予想メーカー</span></div>
          <div style={{color:"#334",fontSize:9,marginTop:2}}>W杯予想メーカーで作成</div>
        </div>
      </div>
      <div style={{padding:"16px 18px 0",display:"flex",flexDirection:"column",gap:10}}>
        <button style={btnG} onClick={saveImage} disabled={saving}>{saving?"保存中...":"💾 画像として保存する"}</button>
        <div style={{background:"rgba(247,201,72,0.08)",borderRadius:12,padding:"12px 16px"}}>
          <div style={{color:G.muted,fontSize:12,lineHeight:1.8}}>📸 <strong style={{color:"#fff"}}>スクリーンショットで保存する場合</strong><br/>上のカードを長押し（iOS）またはスクリーンショットで保存して、そのままInstagramストーリーに投稿できます。</div>
        </div>
        <button style={btnO} onClick={()=>setB11page("pitch")}>✏️ 編集に戻る</button>
        <button style={btnGr} onClick={()=>{if(window.confirm("最初からやり直しますか?")){setB11page("top");setTeamName("");setFormLabel("4-3-3");setPlaced([]);setMovingUid(null);}}}>🔄 最初からやり直す</button>
        <AffiliateBlock title="👕 推し選手をもっと楽しむ" keys={["uniform","goods","bar","towel"]} compact={true}/>
      </div>
    </div>
  );

  return null;
}

/* ── ベスト16予想 ── */
function PgBest16({nav}){
  const DEADLINE=new Date("2026-06-11T18:00:00+09:00");
  const isPast=Date.now()>=DEADLINE.getTime();

  const [selected,setSelected]=useState(()=>{
    try{const s=localStorage.getItem("wcup_best16");return s?JSON.parse(s):[];}catch{return[];}
  });
  const [saveState,setSaveState]=useState("idle"); // "idle"|"saved"|"error"

  const toggle=(name)=>{
    if(isPast)return;
    setSelected(prev=>{
      setSaveState("idle");
      return prev.includes(name)?prev.filter(n=>n!==name):[...prev,name];
    });
  };

  const canSave=selected.length===16&&!isPast&&saveState!=="saved";

  const save=()=>{
    if(!canSave)return;
    try{
      localStorage.setItem("wcup_best16",JSON.stringify(selected));
      setSaveState("saved");
    }catch{
      setSaveState("error");
    }
  };

  const remaining=16-selected.length;

  return(
    <div style={{paddingBottom:60}}>
      {/* ヘッダー */}
      <div style={{background:"linear-gradient(180deg,#061533 0%,#0a1f4c 100%)",padding:"36px 20px 22px",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <Back onClick={()=>nav("home")}/>
        <div style={{color:G.gold,fontSize:22,fontWeight:900}}>🎯 ベスト16予想</div>
        <div style={{color:G.muted,fontSize:12,marginTop:4}}>ベスト16に進出する16チームを予想しよう</div>
      </div>

      {/* 選択カウンター（sticky） */}
      <div style={{position:"sticky",top:0,zIndex:10,background:"#0a1f4c",borderBottom:"1px solid rgba(255,255,255,0.1)",padding:"10px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <div style={{display:"flex",alignItems:"baseline",gap:4}}>
          <span style={{color:selected.length===16?G.gold:"#fff",fontWeight:900,fontSize:22,fontVariantNumeric:"tabular-nums"}}>{selected.length}</span>
          <span style={{color:G.muted,fontSize:13}}> / 16 チーム</span>
          {selected.length>16&&<span style={{color:G.red,fontSize:11,marginLeft:6,fontWeight:700}}>超過</span>}
        </div>
        <button onClick={save} disabled={!canSave} style={{
          background:canSave?G.gold:"rgba(255,255,255,0.08)",
          color:canSave?"#111":G.muted,
          fontWeight:900,fontSize:13,borderRadius:10,
          padding:"8px 16px",border:"none",
          cursor:canSave?"pointer":"not-allowed",
          transition:"all .15s",whiteSpace:"nowrap",
        }}>
          {saveState==="saved"?"✅ 保存済み":"保存する"}
        </button>
      </div>

      {isPast&&(
        <div style={{margin:"12px 18px 0",background:"rgba(230,0,51,0.08)",border:"1px solid rgba(230,0,51,0.25)",borderRadius:12,padding:"10px 14px",color:"#FF8080",fontSize:12}}>
          ⛔ 締め切り済み（2026年6月11日 開幕）。予想の変更はできません。
        </div>
      )}

      {/* グループ一覧 */}
      <div style={{padding:"12px 18px 0"}}>
        {WC_GROUPS.map(group=>(
          <div key={group.name} style={{...crd,marginBottom:12}}>
            <div style={{color:G.gold,fontWeight:900,fontSize:14,marginBottom:10}}>グループ {group.name}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {group.teams.map(team=>{
                const isSel=selected.includes(team.n);
                const isDisabled=!isSel&&selected.length>=16&&!isPast;
                return(
                  <button key={team.n} onClick={()=>toggle(team.n)}
                    disabled={isPast||isDisabled}
                    style={{
                      display:"flex",alignItems:"center",gap:10,
                      background:isSel?"rgba(0,104,183,0.22)":"rgba(255,255,255,0.03)",
                      border:isSel?"1.5px solid rgba(63,107,255,0.6)":"1px solid rgba(255,255,255,0.08)",
                      borderRadius:10,padding:"10px 12px",
                      cursor:isPast||isDisabled?"default":"pointer",
                      textAlign:"left",width:"100%",
                      opacity:isDisabled?0.45:1,
                      transition:"all .12s",
                    }}>
                    <FlagImg code={team.f} country={team.n} size={26}/>
                    <div style={{flex:1,color:isSel?"#7DD3FC":"#ccc",fontSize:13,fontWeight:isSel?700:400}}>
                      {team.n}
                    </div>
                    {isSel&&(
                      <div style={{background:"rgba(63,107,255,0.9)",color:"#fff",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,flexShrink:0}}>✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* 下部保存ボタン */}
        <button onClick={save} disabled={!canSave} style={{
          width:"100%",marginTop:4,marginBottom:8,
          background:canSave?`linear-gradient(180deg,${G.gold},#b8902a)`:"rgba(255,255,255,0.08)",
          color:canSave?"#111":G.muted,
          fontWeight:900,fontSize:16,borderRadius:16,padding:"16px",
          border:"none",cursor:canSave?"pointer":"not-allowed",
          transition:"all .15s",
        }}>
          {saveState==="saved"?"✅ 保存しました！"
            :selected.length===16?"16チームで予想を保存する"
            :remaining>0?`あと ${remaining} チーム選んでください`
            :"16チームを超えています — 選び直してください"}
        </button>
        {saveState==="error"&&(
          <div style={{color:"#FF8080",fontSize:12,textAlign:"center",marginBottom:8}}>
            保存に失敗しました。もう一度お試しください。
          </div>
        )}
      </div>
    </div>
  );
}

/* ── トーナメント表 ── */
function PgBracket({nav,tourn}){
  const [tab,setTab]=useState("bracket");
  const participants=tourn?.participants||[];
  const myId=null; // tournament pageからmyIdが渡されないのでlocalで処理

  // 予想集計
  const winCount={};
  participants.forEach(p=>{
    if(p.predictions?.winner){
      const c=p.predictions.winner;
      if(!winCount[c])winCount[c]=[];
      winCount[c].push(p.nickname);
    }
  });
  const getWinners=(country)=>winCount[country]||[];
  const getWinCount=(country)=>getWinners(country).length;
  const totalPred=participants.filter(p=>p.predictions?.winner).length;

  // チーム表示コンポーネント
  const TeamBox=({name,isHome=false,highlight=false,score=null})=>{
    const winners=name?getWinners(name):[];
    const count=winners.length;
    const isPopular=count>=2;
    const hasFlag=WC_GROUPS.flatMap(g=>g.teams).find(t=>t.n===name);
    const isPlaceholder=!name||name.includes("位")||name.includes("勝者")||name.includes("敗者")||name.includes("通過");
    return(
      <div style={{flex:1,minWidth:0}}>
        <div style={{
          display:"flex",alignItems:"center",gap:5,
          background:count>0?"rgba(14,165,233,0.08)":highlight?"rgba(0,91,172,0.06)":"rgba(255,255,255,0.03)",
          borderRadius:8,padding:"5px 8px",
          border:count>0?`1px solid rgba(14,165,233,0.3)`:highlight?`1px solid ${G.gold}44`:"1px solid rgba(255,255,255,0.07)",
          minHeight:34,
        }}>
          {!isPlaceholder&&hasFlag&&<FlagImg country={name} size={18}/>}
          {isPlaceholder&&<span style={{fontSize:14,opacity:0.4}}>🏳️</span>}
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:isPlaceholder?"#445":count>0?"#7DD3FC":highlight?G.gold:"#ccc",fontSize:isPlaceholder?9:11,fontWeight:count>0||highlight?700:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {name||"TBD"}
            </div>
            {count>0&&<div style={{color:"#7DD3FC",fontSize:8,marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {winners.slice(0,3).join("・")}{winners.length>3&&"..."}
            </div>}
          </div>
          {count>0&&<div style={{background:"#0EA5E9",color:"#fff",borderRadius:20,padding:"1px 5px",fontSize:8,fontWeight:800,flexShrink:0}}>{count}人</div>}
          {score!==null&&<div style={{color:G.gold,fontWeight:800,fontSize:13,flexShrink:0,marginLeft:2}}>{score??"-"}</div>}
        </div>
      </div>
    );
  };

  // 試合カードコンポーネント
  const MatchCard=({match,size="normal"})=>{
    if(!match)return<div style={{height:size==="final"?60:48,background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px dashed #C9DDF5"}}/>;
    const isDone=match.homeScore!==null;
    const homeWon=isDone&&match.winner==="home";
    const awayWon=isDone&&match.winner==="away";
    return(
      <div style={{background:"#FFFFFF",borderRadius:10,border:`1px solid ${isDone?"rgba(0,104,183,0.25)":"#D9E8FF"}`,overflow:"hidden",marginBottom:2,boxShadow:"0 1px 6px rgba(0,91,172,0.06)"}}>
        <div style={{padding:"5px 8px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(0,104,183,0.03)"}}>
          <span style={{color:G.muted,fontSize:8}}>{match.date||"日程TBD"}</span>
          {isDone&&<span style={{background:"rgba(0,104,183,0.1)",color:G.gold,fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:6}}>終了</span>}
        </div>
        <div style={{padding:"4px 6px",display:"flex",alignItems:"center",gap:4}}>
          <TeamBox name={match.home} isHome={true} highlight={homeWon} score={isDone?match.homeScore:null}/>
          <div style={{color:"#334",fontSize:9,flexShrink:0,padding:"0 2px"}}>vs</div>
          <TeamBox name={match.away} isHome={false} highlight={awayWon} score={isDone?match.awayScore:null}/>
        </div>
      </div>
    );
  };

  // ラウンドヘッダー
  const RoundHeader=({label,count})=>(
    <div style={{color:G.gold,fontSize:9,fontWeight:800,letterSpacing:1,textAlign:"center",marginBottom:6,padding:"4px 0",borderBottom:`1px solid ${G.gold}33`,whiteSpace:"nowrap"}}>
      {label}<div style={{color:"#334",fontSize:8,fontWeight:400,marginTop:1}}>{count}試合</div>
    </div>
  );

  // ブラケットビュー（横スクロール）
  const BracketView=()=>(
    <div style={{overflowX:"auto",paddingBottom:8}}>
      <div style={{display:"flex",gap:8,minWidth:900,padding:"0 4px"}}>
        {/* ベスト32 - 左半分 */}
        <div style={{minWidth:180,flex:"0 0 180px"}}>
          <RoundHeader label="ベスト32" count={16}/>
          {BRACKET_DATA.r32.slice(0,8).map(m=><MatchCard key={m.id} match={m}/>)}
        </div>
        {/* ベスト16 - 左 */}
        <div style={{minWidth:172,flex:"0 0 172px",paddingTop:38}}>
          <RoundHeader label="ベスト16" count={8}/>
          {BRACKET_DATA.r16.slice(0,4).map(m=><MatchCard key={m.id} match={m}/>)}
        </div>
        {/* 準々決勝 - 左 */}
        <div style={{minWidth:164,flex:"0 0 164px",paddingTop:76}}>
          <RoundHeader label="準々決勝" count={4}/>
          {BRACKET_DATA.qf.slice(0,2).map(m=><MatchCard key={m.id} match={m}/>)}
        </div>
        {/* 準決勝＋決勝＋3位 - 中央 */}
        <div style={{minWidth:170,flex:"0 0 170px",paddingTop:152}}>
          <RoundHeader label="準決勝" count={2}/>
          {BRACKET_DATA.sf.map(m=><MatchCard key={m.id} match={m}/>)}
          <div style={{marginTop:8}}>
            <div style={{color:G.gold,fontSize:9,fontWeight:800,textAlign:"center",marginBottom:6,padding:"4px 0",borderBottom:`1px solid ${G.gold}33`}}>🏆 決勝 7/22</div>
            <MatchCard match={BRACKET_DATA.final}/>
          </div>
          <div style={{marginTop:8}}>
            <div style={{color:"#888",fontSize:9,fontWeight:700,textAlign:"center",marginBottom:4,padding:"2px 0",borderBottom:"1px solid #C9DDF5"}}>🥉 3位決定戦 7/21</div>
            <MatchCard match={BRACKET_DATA.third}/>
          </div>
        </div>
        {/* 準々決勝 - 右 */}
        <div style={{minWidth:164,flex:"0 0 164px",paddingTop:76}}>
          <RoundHeader label="準々決勝" count={4}/>
          {BRACKET_DATA.qf.slice(2,4).map(m=><MatchCard key={m.id} match={m}/>)}
        </div>
        {/* ベスト16 - 右 */}
        <div style={{minWidth:172,flex:"0 0 172px",paddingTop:38}}>
          <RoundHeader label="ベスト16" count={8}/>
          {BRACKET_DATA.r16.slice(4,8).map(m=><MatchCard key={m.id} match={m}/>)}
        </div>
        {/* ベスト32 - 右半分 */}
        <div style={{minWidth:180,flex:"0 0 180px"}}>
          <RoundHeader label="ベスト32" count={16}/>
          {BRACKET_DATA.r32.slice(8,16).map(m=><MatchCard key={m.id} match={m}/>)}
        </div>
      </div>
    </div>
  );

  // 予想集計ビュー
  const PredView=()=>{
    const sorted=Object.entries(winCount).sort((a,b)=>b[1].length-a[1].length);
    const maxCount=sorted[0]?.[1]?.length||1;
    return(
      <div>
        {sorted.length===0
          ?<div style={{color:G.muted,textAlign:"center",padding:"40px 0",fontSize:13}}>まだ予想が入力されていません</div>
          :sorted.map(([country,names],i)=>(
            <div key={country} style={{...crd,marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{minWidth:28,textAlign:"center"}}>{i<3?["🥇","🥈","🥉"][i]:<span style={{color:"#666",fontWeight:700}}>{i+1}</span>}</div>
                <FlagImg country={country} size={32}/>
                <div style={{flex:1}}>
                  <div style={{color:"#fff",fontWeight:700,fontSize:14}}>{country}</div>
                  <div style={{color:G.muted,fontSize:11,marginTop:2}}>{names.join("・")}</div>
                  <div style={{background:"#0a1f0f",borderRadius:4,height:5,marginTop:5,overflow:"hidden"}}>
                    <div style={{background:i===0?G.gold:i<3?"#4caf50":G.green,height:"100%",width:`${(names.length/maxCount)*100}%`,borderRadius:4}}/>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{color:G.gold,fontWeight:900,fontSize:20}}>{names.length}</div>
                  <div style={{color:G.muted,fontSize:10}}>人</div>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    );
  };

  // 個人予想ビュー
  const PersonView=({filterFn,empty})=>{
    const preds=participants.filter(filterFn);
    if(preds.length===0)return<div style={{color:G.muted,textAlign:"center",padding:"40px 0",fontSize:13}}>{empty}</div>;
    return(
      <div>
        {preds.map(p=>(
          <div key={p.id} style={crd}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{fontSize:28}}>{p.icon}</div>
              <div style={{flex:1}}><div style={{color:"#fff",fontWeight:700}}>{p.nickname}</div></div>
              {p.points>0&&<div style={{color:G.gold,fontWeight:800}}>{p.points}pt</div>}
            </div>
            {p.predictions?(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                <div style={{background:`${G.gold}11`,borderRadius:8,padding:"8px 10px",border:`1px solid ${G.gold}33`}}>
                  <div style={{color:G.muted,fontSize:9,fontWeight:700,marginBottom:3}}>🥇 優勝予想</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {p.predictions.winner&&<FlagImg country={p.predictions.winner} size={18}/>}
                    <span style={{color:G.gold,fontWeight:700,fontSize:12}}>{p.predictions.winner||"未入力"}</span>
                  </div>
                </div>
                <div style={{background:"rgba(14,165,233,0.07)",borderRadius:8,padding:"8px 10px",border:"1px solid rgba(14,165,233,0.2)"}}>
                  <div style={{color:G.muted,fontSize:9,fontWeight:700,marginBottom:3}}>🥈 準優勝予想</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {p.predictions.runnerUp&&<FlagImg country={p.predictions.runnerUp} size={18}/>}
                    <span style={{color:"#7DD3FC",fontWeight:700,fontSize:12}}>{p.predictions.runnerUp||"未入力"}</span>
                  </div>
                </div>
                <Badge label="🇯🇵 日本代表" val={p.predictions.japanResult}/>
                <Badge label="❤️ 応援国" val={p.predictions.favoriteCountry}/>
              </div>
            ):<div style={{color:"#445",fontSize:12}}>予想未入力</div>}
          </div>
        ))}
      </div>
    );
  };

  return(
    <div style={{paddingBottom:40}}>
      {/* ヘッダー */}
      <div style={{background:"linear-gradient(180deg,#061533 0%,#0a1f4c 100%)",padding:"36px 20px 20px",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <Back onClick={()=>nav(tourn?"tournament":"home")}/>
        <div style={{color:G.gold,fontSize:22,fontWeight:900}}>🏆 トーナメント表</div>
        <div style={{color:G.muted,fontSize:12,marginTop:4,lineHeight:1.7}}>
          自分と友達がどの国を予想しているか一目で確認。<br/>
          <span style={{color:G.muted,fontSize:10}}>※ 開幕後に実際の組み合わせに更新されます</span>
        </div>
        {participants.length>0&&<div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:6,background:"rgba(0,104,183,0.07)",borderRadius:20,padding:"4px 12px"}}>
          <span style={{color:G.gold,fontSize:11,fontWeight:700}}>{totalPred}人が優勝予想済み</span>
        </div>}
      </div>

      {/* タブ */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,padding:"12px 14px 0"}}>
        {[["bracket","🏆 表"],["pred","📊 集計"],["mine","👤 自分"],["friends","👥 友達"]].map(([v,lb])=>(
          <button key={v} onClick={()=>setTab(v)} style={{background:tab===v?G.gold:G.card,color:tab===v?"#111":"#ccc",border:"none",borderRadius:10,padding:"9px 4px",fontSize:11,cursor:"pointer",fontWeight:tab===v?800:400}}>{lb}</button>
        ))}
      </div>

      <div style={{padding:"12px 14px 0"}}>
        {/* 凡例 */}
        {tab==="bracket"&&participants.length>0&&(
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(14,165,233,0.1)",borderRadius:8,padding:"3px 8px"}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#0EA5E9",display:"inline-block"}}/>
              <span style={{color:"#7DD3FC",fontSize:10}}>予想あり</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4,background:`${G.gold}11`,borderRadius:8,padding:"3px 8px"}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:G.gold,display:"inline-block"}}/>
              <span style={{color:G.gold,fontSize:10}}>勝者（確定済み）</span>
            </div>
          </div>
        )}

        {tab==="bracket"&&(
          <>
            <BracketView/>
            <div style={{background:G.dark,borderRadius:10,padding:"10px 14px",marginTop:10}}>
              <div style={{color:G.muted,fontSize:10,lineHeight:1.8}}>
                ※ 現在は仮の組み合わせです。開幕後に実際の組み合わせに更新されます。<br/>
                ※ 青いカードは大会参加者が優勝予想している国です。
              </div>
            </div>
          </>
        )}
        {tab==="pred"&&<PredView/>}
        {tab==="mine"&&(
          <>
            <div style={{color:G.muted,fontSize:12,marginBottom:10}}>大会参加者全員の予想一覧です</div>
            <PersonView filterFn={p=>!!p.predictions} empty="まだ予想がありません"/>
          </>
        )}
        {tab==="friends"&&(
          <>
            <div style={{color:G.muted,fontSize:12,marginBottom:10}}>友達の優勝予想と詳細を確認できます</div>
            <PersonView filterFn={p=>!!p.predictions?.winner} empty="まだ優勝予想が入力されていません"/>
          </>
        )}

        <div style={{marginTop:12}}><button style={btnO} onClick={()=>nav("tournament")}>← 大会ページへ戻る</button></div>
      </div>
    </div>
  );
}


/* ── カウントダウンコンポーネント ── */
function useCountdown(targetDate){
  const calc=()=>{
    if(!targetDate)return null;
    const diff=new Date(targetDate)-new Date();
    if(diff<=0)return{done:true,d:0,h:0,m:0,s:0};
    return{done:false,d:Math.floor(diff/86400000),h:Math.floor((diff%86400000)/3600000),m:Math.floor((diff%3600000)/60000),s:Math.floor((diff%60000)/1000)};
  };
  const [t,setT]=useState(calc);
  useEffect(()=>{
    if(!targetDate){setT(null);return;}
    const id=setInterval(()=>setT(calc()),1000);
    return()=>clearInterval(id);
  },[targetDate]);
  return t;
}

function Countdown({targetDate,label,color="#FACC15",doneLabel="開幕！",compact=false}){
  const t=useCountdown(targetDate);
  if(!targetDate)return(
    <div style={{textAlign:"center",background:`${color}08`,border:`1px solid ${color}22`,borderRadius:14,padding:"12px 16px"}}>
      <div style={{color:color,fontSize:11,fontWeight:700,marginBottom:4}}>{label}</div>
      <div style={{color:"#445",fontSize:11}}>日程が確定次第、カウントダウンを表示します</div>
    </div>
  );
  if(!t)return null;
  if(t.done)return(
    <div style={{textAlign:"center",background:`${color}18`,border:`1px solid ${color}55`,borderRadius:16,padding:"16px 20px"}}>
      <div style={{color:color,fontSize:13,fontWeight:700,marginBottom:2}}>{label}</div>
      <div style={{color:"#fff",fontWeight:900,fontSize:22,textShadow:`0 0 20px ${color}88`}}>{doneLabel}</div>
    </div>
  );
  if(compact)return(
    <div style={{textAlign:"center",background:`${color}0D`,border:`1px solid ${color}33`,borderRadius:12,padding:"10px 14px"}}>
      <div style={{color:color,fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:4}}>{label}</div>
      <div style={{color:"#fff",fontWeight:800,fontSize:18}}>あと {t.d}日 {String(t.h).padStart(2,"0")}時間</div>
    </div>
  );
  return(
    <div style={{textAlign:"center",background:`${color}0D`,border:`1px solid ${color}33`,borderRadius:16,padding:"16px 20px"}}>
      <div style={{color:color,fontSize:11,fontWeight:700,letterSpacing:2,marginBottom:10}}>{label}</div>
      <div style={{display:"flex",justifyContent:"center",alignItems:"flex-end",gap:6,marginBottom:4}}>
        {[[t.d,"日"],[t.h,"時間"],[t.m,"分"],[t.s,"秒"]].map(([v,unit],i)=>(
          <React.Fragment key={i}>
            {i>0&&<div style={{color:`${color}55`,fontSize:18,fontWeight:900,paddingBottom:8}}>:</div>}
            <div style={{textAlign:"center"}}>
              <div style={{color:"#fff",fontWeight:900,fontSize:i===0?40:32,lineHeight:1,textShadow:`0 0 20px ${color}66`,minWidth:i===0?56:40,fontVariantNumeric:"tabular-nums"}}>{i===0?t.d:String(v).padStart(2,"0")}</div>
              <div style={{color:color,fontSize:9,fontWeight:700,marginTop:3,letterSpacing:0.5}}>{unit}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ── ワールドモード ── */
function PgWorldMode({nav,tourn,goCountry}){
  const participants=tourn?.participants||[];
  const winCount={};
  participants.forEach(p=>{if(p.predictions?.winner)winCount[p.predictions.winner]=(winCount[p.predictions.winner]||0)+1;});
  const topWin=Object.entries(winCount).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const now=new Date();
  const wcDate=new Date(WC_START_DATE);
  const started=now>=wcDate;

  return(
    <div style={{paddingBottom:40}}>
      <div style={{background:"linear-gradient(180deg,#061533 0%,#0a1f4c 100%)",padding:"36px 20px 24px",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <Back onClick={()=>nav("home")}/>
        <div style={{color:"#E60033",fontSize:11,fontWeight:800,letterSpacing:3,marginBottom:4}}>WORLD MODE</div>
        <div style={{color:G.gold,fontSize:22,fontWeight:900,marginBottom:6}}>🌍 ワールドモード</div>
        <div style={{color:G.muted,fontSize:12}}>W杯全体の予想・情報・分析</div>
      </div>
      <div style={{padding:"14px 16px 0"}}>
        {/* カウントダウン */}
        {!started
          ?<div style={{marginBottom:14}}><Countdown targetDate={WC_START_DATE} label="🏆 W杯開幕まで" color="#005BAC" doneLabel="🏆 W杯開幕！"/></div>
          :<div style={{...crd,textAlign:"center",marginBottom:14}}><div style={{color:"#22C55E",fontSize:14,fontWeight:700}}>🟢 W杯開幕中！</div></div>
        }
        {/* 大会内の優勝予想 */}
        {tourn&&topWin.length>0&&<div style={{...crd,marginBottom:14}}>
          <div style={{color:G.gold,fontWeight:700,fontSize:13,marginBottom:10}}>👥 この大会の優勝予想トップ</div>
          {topWin.map(([c,n],i)=>(
            <div key={c} onClick={()=>goCountry(c)} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,cursor:"pointer"}}>
              <span style={{fontSize:18}}>{"🥇🥈🥉"[i]}</span>
              <FlagImg country={c} size={24}/>
              <span style={{color:"#fff",flex:1,fontSize:13}}>{c}</span>
              <span style={{color:G.gold,fontWeight:700}}>{n}人</span>
            </div>
          ))}
        </div>}
        {/* 機能一覧 */}
        <div style={{color:G.muted,fontSize:11,fontWeight:700,letterSpacing:1,marginBottom:8}}>MENU</div>
        {[
          {icon:"🏆",label:"トーナメント表",sub:"決勝トーナメントの組み合わせと予想マップ",action:()=>nav("bracket")},
          {icon:"🗂️",label:"グループ表",sub:"全12グループのチームと順位",action:()=>nav("groups")},
          {icon:"📅",label:"試合日程",sub:"全試合のスケジュールと結果",action:()=>nav("schedule")},
          {icon:"⚽",label:"ベスト11メーカー",sub:"あなたの最強スタメンを作成",action:()=>nav("best11")},
          {icon:"💬",label:"みんなのチャット",sub:"W杯について語ろう",action:()=>nav("globalchat")},
        ].map((item,i)=>(
          <div key={i} onClick={item.action} style={{...crd,display:"flex",alignItems:"center",gap:12,cursor:"pointer",marginBottom:8}}>
            <span style={{fontSize:24,flexShrink:0}}>{item.icon}</span>
            <div style={{flex:1}}>
              <div style={{color:"#fff",fontWeight:700,fontSize:13}}>{item.label}</div>
              <div style={{color:G.muted,fontSize:11,marginTop:2}}>{item.sub}</div>
            </div>
            <span style={{color:G.muted,fontSize:14}}>→</span>
          </div>
        ))}
        {!tourn&&<div style={{...crd,textAlign:"center",marginTop:8}}>
          <div style={{color:G.muted,fontSize:12,marginBottom:10}}>大会を作って友達と予想バトル</div>
          <button style={btnG} onClick={()=>nav("create")}>🏆 無料で予想大会を作る</button>
        </div>}
      </div>
    </div>
  );
}

/* ── 日本代表モード ── */
function PgJapanMode({nav,tourn}){
  const [tab,setTab]=useState("top");
  const [nowTs,setNowTs]=useState(Date.now());
  const [globalScorerData,setGlobalScorerData]=useState(null);
  const participants=tourn?.participants||[];

  // 日本成績予想集計
  const japanResCount={};
  participants.forEach(p=>{if(p.predictions?.japanResult)japanResCount[p.predictions.japanResult]=(japanResCount[p.predictions.japanResult]||0)+1;});
  const japanResTotal=Object.values(japanResCount).reduce((a,b)=>a+b,0);

  // 日本MVP予想集計
  const mvpCount={};
  participants.forEach(p=>{if(p.predictions?.japanMvp){const k=p.predictions.japanMvp.trim();if(k)mvpCount[k]=(mvpCount[k]||0)+1;}});
  const mvpRank=Object.entries(mvpCount).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // 応援コメント
  const comments=participants.filter(p=>p.predictions?.comment).map(p=>({nick:p.nickname,icon:p.icon,text:p.predictions.comment}));

  // 1秒カウントダウン
  useEffect(()=>{const iv=setInterval(()=>setNowTs(Date.now()),1000);return()=>clearInterval(iv);},[]);

  // spec-14: 次の日本戦の全国得点者予想を読み込む（matchId変化時のみ）
  const _nextJapanMatchIdForEffect=useMemo(()=>
    MATCHES.filter(m=>(m.home==="日本"||m.away==="日本")&&new Date(m.kickoff).getTime()>Date.now())
      .sort((a,b)=>new Date(a.kickoff)-new Date(b.kickoff))[0]?.id
  ,[]);
  useEffect(()=>{
    if(!_nextJapanMatchIdForEffect) return;
    loadGlobalJapanScorerVotes(_nextJapanMatchIdForEffect).then(d=>{if(d)setGlobalScorerData(d);}).catch(()=>{});
  },[_nextJapanMatchIdForEffect]);

  // 次の日本戦
  const nextJapanMatch=useMemo(()=>
    MATCHES.filter(m=>(m.home==="日本"||m.away==="日本")&&new Date(m.kickoff).getTime()>nowTs)
      .sort((a,b)=>new Date(a.kickoff)-new Date(b.kickoff))[0]
  ,[nowTs]);

  // ライブ日本戦（キックオフ後2時間以内、未終了）
  const liveJapanMatch=useMemo(()=>{
    const matchResults=tourn?.results?.matchResults||{};
    return MATCHES.find(m=>{
      if(m.home!=="日本"&&m.away!=="日本") return false;
      const ko=new Date(m.kickoff).getTime();
      return nowTs>=ko&&nowTs<=ko+7200000&&matchResults[m.id]?.status!=="finished";
    })||null;
  },[nowTs,tourn]);

  // 日本戦時間帯（1h前〜2h後）
  const isJapanMatchTime=useMemo(()=>
    MATCHES.some(m=>{
      if(m.home!=="日本"&&m.away!=="日本") return false;
      const ko=new Date(m.kickoff).getTime();
      return nowTs>=ko-3600000&&nowTs<=ko+7200000;
    })
  ,[nowTs]);

  // 得点者投票集計
  const scorerVotes=useMemo(()=>{
    const counts={};let total=0;
    participants.forEach(p=>{
      Object.values(p.matchPredictions||{}).forEach(mp=>{
        if(mp.japanScorer&&mp.japanScorer!=="none"){counts[mp.japanScorer]=(counts[mp.japanScorer]||0)+1;total++;}
      });
    });
    return{counts,total};
  },[participants]);

  // カウントダウン計算
  const diff=nextJapanMatch?Math.max(0,new Date(nextJapanMatch.kickoff).getTime()-nowTs):0;
  const cd={d:Math.floor(diff/86400000),h:Math.floor((diff/3600000)%24),m:Math.floor((diff/60000)%60)};

  // 日付フォーマット
  const fmtKO=(kickoff)=>{
    const d=new Date(kickoff);
    const days=["日","月","火","水","木","金","土"];
    return `${d.getMonth()+1}/${d.getDate()} (${days[d.getDay()]}) ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")} KO`;
  };

  const top4Scorers=JAPAN_SQUAD.filter(s=>s.id!=="none").slice(0,4);
  const CHEER_QUICK=["🔥 がんばれ日本！","⚽ ゴール！","😭 惜しい！","🙏 守れ！"];

  return(
    <div className="bg-navy-base text-text-on-navy min-h-screen pb-10">
      {/* ── ヘッダー ── */}
      <div className="bg-navy-hero px-5 pt-4 pb-4 flex items-center gap-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none" style={{background:"radial-gradient(circle,rgba(230,0,51,0.25),transparent 65%)",transform:"translate(30%,-30%)"}}/>
        <button onClick={()=>nav("home")} className="text-white text-2xl font-bold bg-transparent border-0 cursor-pointer leading-none z-10 active:scale-90 transition-transform">←</button>
        <div className="flex-1 text-center z-10">
          <div className="text-white font-black text-lg">🇯🇵 日本代表モード</div>
        </div>
        <div className="z-10">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{background:"rgba(255,255,255,0.1)",color:"#C9D6EC"}}>SAMURAI BLUE</span>
        </div>
      </div>

      {/* ── ライブバナー（試合中のみ） ── */}
      {liveJapanMatch&&(
        <div className="mx-5 mt-2 bg-hinomaru text-white rounded-card flex items-center gap-2 px-4 py-2 shadow-cta-red">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse flex-shrink-0"/>
          <span className="font-bold text-sm">LIVE</span>
          <span className="text-sm flex-1">🇯🇵 日本 vs {liveJapanMatch.home==="日本"?liveJapanMatch.away:liveJapanMatch.home}</span>
          <span className="text-xs text-white/80">試合中</span>
        </div>
      )}

      {/* ── 次の日本戦カードバナー ── */}
      <div className="px-5 mt-4">
        {nextJapanMatch?(
          <button onClick={()=>nav("matches")}
            className="w-full bg-gradient-to-br from-gold/30 to-gold/10 border-2 border-gold rounded-card-lg p-5 text-left shadow-cta-gold active:scale-[.99] transition-transform">
            <div className="text-xs text-gold font-bold tracking-widest">次の日本戦まで</div>
            <div className="mt-3 text-xl font-black text-text-on-navy">
              🇯🇵 日本 <span className="text-text-on-navy-dim text-lg">vs</span> {nextJapanMatch.home==="日本"?nextJapanMatch.away:nextJapanMatch.home}
            </div>
            <div className="mt-4 flex items-baseline gap-3 justify-center font-black tabular-nums text-gold">
              <div><span className="text-5xl">{cd.d}</span><span className="text-sm ml-1">日</span></div>
              <div><span className="text-5xl">{String(cd.h).padStart(2,"0")}</span><span className="text-sm ml-1">時</span></div>
              <div><span className="text-5xl">{String(cd.m).padStart(2,"0")}</span><span className="text-sm ml-1">分</span></div>
            </div>
            <div className="mt-3 text-sm text-text-on-navy-dim text-center">{fmtKO(nextJapanMatch.kickoff)}</div>
          </button>
        ):(
          <div className="w-full bg-white/5 border border-white/10 rounded-card-lg p-5 text-center text-text-on-navy-dim">
            🇯🇵 日本代表お疲れ様でした
          </div>
        )}
      </div>

      {/* ── 応援クイック投稿（日本戦時間帯のみ） ── */}
      {isJapanMatchTime&&(
        <div className="mx-5 mt-4 bg-white/5 border border-white/10 rounded-card p-3">
          <div className="text-hinomaru text-xs font-bold mb-2">🇯🇵 応援メッセージを送ろう！</div>
          <div className="grid grid-cols-2 gap-1.5">
            {CHEER_QUICK.map(msg=>(
              <button key={msg}
                className="bg-hinomaru/10 text-hinomaru border border-hinomaru/30 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer active:scale-[.98] transition-transform text-center">
                {msg}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 得点者予想ミニ ── */}
      {nextJapanMatch&&(
        <div className="mx-5 mt-4">
          <div className="flex items-baseline justify-between mb-2">
            <div className="font-bold text-text-on-navy text-sm">日本の得点者を予想 <span className="text-gold text-xs">+5pt</span></div>
            <button onClick={()=>nav("matches")} className="text-xs text-text-on-navy-dim bg-transparent border-0 cursor-pointer">全選手を見る ›</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {top4Scorers.map(p=>{
              const votes=scorerVotes.counts[p.id]||0;
              const pct=scorerVotes.total>0?Math.round((votes/scorerVotes.total)*100):null;
              return(
                <button key={p.id} onClick={()=>nav("matches")}
                  className="bg-white/5 border border-white/15 rounded-card p-3 text-left active:scale-[.98] transition">
                  <div className="flex items-baseline justify-between">
                    <div className="text-xs text-text-on-navy-dim">#{p.number} {p.pos}</div>
                    {pct!==null&&<div className="text-xs text-text-on-navy-weak">本命 {pct}%</div>}
                  </div>
                  <div className="mt-1 font-bold text-text-on-navy text-sm">{p.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 全国注目選手予想（spec-14） */}
      <GlobalJapanScorerPicks data={globalScorerData}/>

      {/* ── タブ ── */}
      <div className="px-5 mt-4">
        <div className="grid grid-cols-4 gap-1 mb-4">
          {[["top","🇯🇵 概要"],["stats","📊 予想"],["players","⚽ 選手"],["route","🗺️ 展望"]].map(([v,lb])=>(
            <button key={v} onClick={()=>setTab(v)}
              className={`rounded-xl py-2 text-[10px] font-bold cursor-pointer border transition-colors${tab===v?" bg-navy-elevated border-hinomaru/40 text-white":" bg-white/5 border-white/10 text-text-on-navy-dim"}`}>
              {lb}
            </button>
          ))}
        </div>

        {/* 概要タブ */}
        {tab==="top"&&(
          <>
            <div className="bg-white/5 border border-white/10 rounded-card p-4 mb-3">
              <div className="text-gold font-bold text-sm mb-3">🏆 グループF - 日本代表</div>
              {WC_GROUPS.find(g=>g.name==="F")?.teams.map((t,i)=>(
                <div key={i} className={`flex items-center gap-3 py-2 px-2 rounded-lg mb-1${t.n==="日本"?" bg-hinomaru/10":""}`}>
                  <FlagImg code={t.f} country={t.n} size={24}/>
                  <span className={`flex-1 text-sm${t.n==="日本"?" text-gold font-bold":" text-text-on-navy-dim font-normal"}`}>{t.n}</span>
                  {FIFA_RANK[t.n]&&<span className="text-text-on-navy-weak text-xs">FIFA {FIFA_RANK[t.n]}位</span>}
                </div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-card p-4">
              <div className="text-gold font-bold text-sm mb-3">💬 みんなの応援コメント</div>
              {comments.length===0
                ?<div className="text-text-on-navy-dim text-xs text-center py-4">大会に参加すると応援コメントが表示されます</div>
                :comments.slice(0,5).map((c,i)=>(
                  <div key={i} className="flex gap-2 mb-2">
                    <span className="text-xl flex-shrink-0">{c.icon}</span>
                    <div className="bg-white/5 rounded-xl p-2 flex-1">
                      <div className="text-text-on-navy-weak text-[10px] mb-1">{c.nick}</div>
                      <div className="text-text-on-navy-dim text-xs">"{c.text}"</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </>
        )}

        {/* 予想統計タブ */}
        {tab==="stats"&&(
          <>
            <div className="bg-white/5 border border-white/10 rounded-card p-4 mb-3">
              <div className="text-gold font-bold text-sm mb-2">🇯🇵 日本代表成績予想の分布</div>
              {tourn
                ?<div className="text-text-on-navy-dim text-xs mb-3">「この大会のみんな」は日本をここまで行くと予想しています</div>
                :<div className="text-text-on-navy-dim text-xs mb-3">大会を選択すると予想データが表示されます</div>
              }
              {japanResTotal>0
                ?JAPAN_RES.filter(r=>japanResCount[r]).sort((a,b)=>(japanResCount[b]||0)-(japanResCount[a]||0)).map(r=>{
                  const n=japanResCount[r]||0;
                  const pct=Math.round(n/japanResTotal*100);
                  return(
                    <div key={r} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-text-on-navy text-xs">{r}</span>
                        <span className="text-gold font-bold text-xs">{n}人 ({pct}%)</span>
                      </div>
                      <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-hinomaru to-hinomaru/60" style={{width:`${pct}%`}}/>
                      </div>
                    </div>
                  );
                })
                :<div className="text-text-on-navy-dim text-xs text-center py-5">予想が集まると表示されます</div>
              }
            </div>
            <div className="bg-white/5 border border-white/10 rounded-card p-4">
              <div className="text-gold font-bold text-sm mb-3">🌟 みんなが期待している選手</div>
              {mvpRank.length>0
                ?mvpRank.map(([name,n],i)=>{
                  const player=JAPAN_PLAYERS.find(p=>p.name.replace(" ","")===name.replace(" ","")||p.name.includes(name)||name.includes(p.name.split(" ")[0]));
                  return(
                    <div key={i} className={`flex items-center gap-3 p-2 rounded-lg mb-1${i===0?" bg-gold/10":""}`}>
                      <span className="text-lg flex-shrink-0">{"🥇🥈🥉🏅🏅"[i]}</span>
                      <div className="flex-1">
                        <div className="text-text-on-navy font-bold text-sm">{name}</div>
                        {player&&<div className="text-text-on-navy-weak text-xs">{player.pos} · {player.club}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-gold font-black text-base">{n}</div>
                        <div className="text-text-on-navy-weak text-[10px]">票</div>
                      </div>
                    </div>
                  );
                })
                :<div className="text-text-on-navy-dim text-xs text-center py-5">予想が集まると表示されます</div>
              }
            </div>
          </>
        )}

        {/* 選手タブ */}
        {tab==="players"&&(
          <div>
            <div className="text-text-on-navy-weak text-xs mb-3">日本代表候補選手 · 顔写真は使用していません</div>
            {JAPAN_PLAYERS.map((p,i)=>(
              <div key={i} className="bg-white/5 border border-white/10 rounded-card p-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{background:"linear-gradient(135deg,#0d2a5e,#1a3f7a)",border:"2px solid rgba(0,91,172,0.5)"}}>
                    <span className="text-white font-black text-sm">{(i+1).toString().padStart(2,"0")}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-text-on-navy font-bold text-sm">{p.name}</span>
                      <span className="bg-navy-elevated text-text-on-navy-dim text-[9px] font-bold px-1.5 py-0.5 rounded-md">{p.pos}</span>
                    </div>
                    <div className="text-text-on-navy-weak text-xs mb-1">{p.club}</div>
                    <div className="flex flex-wrap gap-1">
                      {p.tags.map((tag,j)=><span key={j} className="bg-white/5 text-text-on-navy-weak text-[9px] px-1.5 py-0.5 rounded">{tag}</span>)}
                    </div>
                  </div>
                </div>
                <div className="text-text-on-navy-dim text-xs mt-2 pl-14">💡 {p.note}</div>
              </div>
            ))}
          </div>
        )}

        {/* 展望タブ */}
        {tab==="route"&&(
          <div>
            <div className="bg-hinomaru/10 border border-hinomaru/20 rounded-xl p-3 mb-3">
              <div className="text-hinomaru/80 text-xs">⚠️ 以下はすべて仮想ルートです。実際の組み合わせは開幕後に確定します。</div>
            </div>
            {[
              {label:"1位通過の場合",color:"#22C55E",bgCls:"bg-success/5",borderCls:"border-success/20",matches:["ベスト32: グループH2位と対戦（仮）","ベスト16: グループG1位の勝者と対戦（仮）","準々決勝: 上位シード国と対戦（仮）"]},
              {label:"2位通過の場合",color:"#0068B7",bgCls:"bg-white/5",borderCls:"border-white/10",matches:["ベスト32: グループE1位と対戦（仮）","ベスト16: グループF1位の勝者と対戦（仮）","準々決勝: 反対山の強豪と対戦（仮）"]},
              {label:"3位通過の場合",color:"#F97316",bgCls:"bg-white/5",borderCls:"border-orange-500/20",matches:["ベスト32: 勝ち上がり相手は抽選次第（仮）","ベスト16: 各グループの強豪と対戦（仮）","準々決勝: 上位シードと対戦（仮）"]},
            ].map((route,i)=>(
              <div key={i} className={`${route.bgCls} border ${route.borderCls} rounded-card p-4 mb-3`}>
                <div className="font-bold text-sm mb-3" style={{color:route.color}}>🇯🇵 {route.label}の仮想ルート</div>
                {route.matches.map((m,j)=>(
                  <div key={j} className="flex items-start gap-2 mb-1.5">
                    <span className="text-xs flex-shrink-0 mt-0.5" style={{color:route.color}}>▷</span>
                    <span className="text-text-on-navy-dim text-xs leading-relaxed">{m}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="bg-white/5 rounded-xl p-3">
              <div className="text-text-on-navy-dim text-xs leading-relaxed">
                ※ グループFの実際の組み合わせ: 日本・オランダ・チュニジア・スウェーデン<br/>
                ※ 決勝トーナメントの具体的な組み合わせは開幕後に確定します
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


/* ── 予想生存チェック ── */
function PgSurvival({nav,tourn,update}){
  if(!tourn)return<div style={{padding:"20px 18px"}}><Back onClick={()=>nav("home")}/><div style={{color:G.muted,textAlign:"center",padding:"40px 0"}}>大会が選択されていません</div></div>;
  const eliminated=(tourn.results?.eliminatedCountries)||[];
  const hasRes=!!tourn.results?.winner;
  const url=`${window.location.origin}${window.location.pathname}#t-${tourn.id}`;
  const lineMsg=encodeURIComponent(`【予想生存チェック】\nW杯予想の生存状況を確認しよう👇\n${url}`);
  const copy=async()=>{try{await navigator.clipboard.writeText(url);}catch{}};

  const getSurvivalStatus=(country,field="winner")=>{
    if(!country||country==="その他")return"unknown";
    if(hasRes&&tourn.results?.[field]===country)return"hit";
    if(hasRes&&tourn.results?.[field]&&tourn.results[field]!==country)return"miss";
    if(eliminated.includes(country))return"eliminated";
    return"alive";
  };

  const STATUS_STYLE={
    alive:  {color:"#22C55E",bg:"rgba(34,197,94,0.1)", border:"rgba(34,197,94,0.3)", label:"🟢 生存中"},
    hit:    {color:"#FACC15",bg:"rgba(250,204,21,0.15)",border:"rgba(250,204,21,0.4)",label:"🎯 的中！"},
    miss:   {color:"#6B7280",bg:"rgba(107,114,128,0.1)",border:"rgba(107,114,128,0.2)",label:"❌ 外れ"},
    eliminated:{color:"#EF4444",bg:"rgba(239,68,68,0.08)",border:"rgba(239,68,68,0.2)",label:"⚰️ 敗退"},
    unknown:{color:"#6B7280",bg:"rgba(107,114,128,0.05)",border:"rgba(107,114,128,0.1)",label:"❓ 未確定"},
  };

  const ranked=[...tourn.participants].filter(p=>p.predictions?.winner).map(p=>{
    const st=getSurvivalStatus(p.predictions.winner);
    return{...p,survivalStatus:st};
  }).sort((a,b)=>{
    const order={hit:0,alive:1,eliminated:2,miss:3,unknown:4};
    return (order[a.survivalStatus]||4)-(order[b.survivalStatus]||4);
  });

  const aliveCount=ranked.filter(p=>p.survivalStatus==="alive"||p.survivalStatus==="hit").length;

  return(
    <div style={{paddingBottom:40}}>
      <div style={{background:"linear-gradient(180deg,#061533 0%,#0a1f4c 100%)",padding:"36px 20px 22px",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <Back onClick={()=>nav("tournament")}/>
        <div style={{fontSize:40,marginBottom:6}}>🔥</div>
        <div style={{color:"#E05A00",fontSize:22,fontWeight:900}}>予想生存チェック</div>
        <div style={{color:G.muted,fontSize:12,marginTop:4}}>{tourn.name}</div>
        <div style={{marginTop:10,display:"inline-flex",alignItems:"center",gap:8,background:"rgba(249,115,22,0.08)",borderRadius:20,padding:"6px 14px",border:"1px solid rgba(249,115,22,0.25)"}}>
          <span style={{color:"#16A34A",fontWeight:700}}>生存中: {aliveCount}人</span>
          <span style={{color:G.muted}}>/</span>
          <span style={{color:G.muted}}>{ranked.length}人</span>
        </div>
      </div>
      <div style={{padding:"12px 16px 0"}}>
        {/* 共有ボタン */}
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <button onClick={copy} style={{flex:1,...btnGr,padding:"10px",fontSize:12,color:G.muted}}>🔗 URLをコピー</button>
          <a href={`https://line.me/R/msg/text/?${lineMsg}`} target="_blank" rel="noopener noreferrer" onClick={()=>trackEvent("click_share_survival",{tournamentId:tourn.id})} style={{flex:1,display:"block",background:"#06C755",color:"#fff",borderRadius:14,padding:"10px",textAlign:"center",fontWeight:700,textDecoration:"none",fontSize:12}}>📱 LINEで共有</a>
        </div>

        {/* 敗退国情報 */}
        {eliminated.length>0&&<div style={{...crd,marginBottom:10,background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)"}}>
          <div style={{color:"#FCA5A5",fontWeight:700,fontSize:12,marginBottom:8}}>⚰️ 敗退確定国（管理者設定）</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {eliminated.map(c=><span key={c} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"3px 8px"}}><FlagImg country={c} size={14}/><span style={{color:"#FCA5A5",fontSize:11}}>{c}</span></span>)}
          </div>
        </div>}

        {/* 参加者ごとの生存状況 */}
        {ranked.length===0
          ?<div style={{color:G.muted,textAlign:"center",padding:"40px 0"}}>まだ優勝予想が入力されていません</div>
          :ranked.map((p,i)=>{
            const st=STATUS_STYLE[p.survivalStatus];
            const japanSt=p.predictions?.japanResult?getSurvivalStatus(p.predictions.japanResult,"japanResult"):"unknown";
            const jpSt=STATUS_STYLE[japanSt];
            return(
              <div key={p.id} style={{...crd,background:st.bg,border:`1px solid ${st.border}`,marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:28,flexShrink:0}}>{p.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:4}}>
                      <span style={{color:"#fff",fontWeight:700,fontSize:14}}>{p.nickname}</span>
                      {p.joinedLate&&<span style={{background:"rgba(14,165,233,0.2)",color:"#7DD3FC",fontSize:9,padding:"1px 6px",borderRadius:10}}>途中参加</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <FlagImg country={p.predictions.winner} size={18}/>
                      <span style={{color:"#ccc",fontSize:12}}>{p.predictions.winner} 優勝予想</span>
                    </div>
                  </div>
                  <div style={{textAlign:"center",background:st.bg,borderRadius:10,padding:"6px 10px",border:`1px solid ${st.border}`}}>
                    <div style={{color:st.color,fontSize:11,fontWeight:700}}>{st.label}</div>
                  </div>
                </div>
                {p.predictions?.japanResult&&(
                  <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:14}}>🇯🇵</span>
                    <span style={{color:G.muted,fontSize:11}}>{p.predictions.japanResult}予想</span>
                    <span style={{color:jpSt.color,fontSize:10,fontWeight:700}}>{jpSt.label}</span>
                  </div>
                )}
              </div>
            );
          })
        }
        {/* 注意書き */}
        {eliminated.length===0&&!hasRes&&<div style={{background:G.dark,borderRadius:10,padding:"10px 14px",marginTop:8}}><div style={{color:G.muted,fontSize:11,lineHeight:1.8}}>※ 管理者が「敗退国管理」で国をマークすると生存状況が更新されます。<br/>※ 管理者ページ → 敗退国管理 から設定できます。</div></div>}
        <div style={{marginTop:12}}><button style={btnO} onClick={()=>nav("tournament")}>← 大会ページへ戻る</button></div>
      </div>
    </div>
  );
}

/* ── 日本戦単発予想 ── */
function PgSinglePred({nav,tourn,update,myId}){
  const [pred,setPred]=useState({result:"",score:"",firstGoal:"",japanMvp:""});
  const [loading,setLoading]=useState(false);
  const [saved,setSaved]=useState(false);
  const set=k=>v=>setPred(p=>({...p,[k]:v}));

  const save=async()=>{
    if(!pred.result){alert("勝敗予想を選択してください");return;}
    setLoading(true);
    const fresh=await loadT(tourn.id);const cur=fresh||tourn;
    const updated={...cur,participants:cur.participants.map(p=>{
      if(p.id!==myId)return p;
      return{...p,predictions:{...(p.predictions||{}),singleMatchPredictions:{japanNextMatch:{...pred}}}};
    })};
    await update(updated);
    trackEvent("submit_single_match_prediction",{tournamentId:tourn.id,participantId:myId});
    setSaved(true);setLoading(false);
    setTimeout(()=>nav("tournament"),1500);
  };

  return(
    <div style={{padding:"20px 18px 40px"}}>
      <Back onClick={()=>nav("tournament")}/>
      <div style={{color:"#7DD3FC",fontSize:21,fontWeight:900,marginBottom:4}}>🇯🇵 日本戦単発予想</div>
      {JAPAN_NEXT_OPPONENT
        ?<div style={{color:G.muted,fontSize:13,marginBottom:16}}>日本 vs {JAPAN_NEXT_OPPONENT}の予想</div>
        :<div style={{color:G.muted,fontSize:13,marginBottom:16}}>次の日本戦の予想</div>
      }
      {!JAPAN_NEXT_MATCH
        ?<div style={{background:"rgba(0,91,172,0.1)",border:"1px solid rgba(0,91,172,0.3)",borderRadius:14,padding:20,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:10}}>🇯🇵</div>
          <div style={{color:"#7DD3FC",fontWeight:700,fontSize:14,marginBottom:8}}>日本代表の試合日程が確定次第、単発予想を表示します</div>
        </div>
        :<div style={crd}>
          <div style={{marginBottom:18}}>
            <label style={lbl}>⚽ 勝敗予想 ＊</label>
            <Chips opts={["日本勝利","引き分け","日本敗戦"]} value={pred.result} onChange={set("result")} cols={3}/>
          </div>
          <div style={{marginBottom:18}}>
            <label style={lbl}>📊 スコア予想（例: 2-1）</label>
            <input style={inp} placeholder="例: 2-1" value={pred.score} onChange={e=>set("score")(e.target.value)}/>
          </div>
          <div style={{marginBottom:18}}>
            <label style={lbl}>🥅 先制点（チーム）</label>
            <Chips opts={["日本","相手国","なし（0-0）"]} value={pred.firstGoal} onChange={set("firstGoal")} cols={3}/>
          </div>
          <div style={{marginBottom:18}}>
            <label style={lbl}>🌟 日本代表MVP（選手名）</label>
            <input style={inp} placeholder="例: 久保 建英" value={pred.japanMvp} onChange={e=>set("japanMvp")(e.target.value)}/>
          </div>
          {saved
            ?<div style={{background:"#1a4730",border:`1px solid ${G.gold}`,borderRadius:14,padding:14,textAlign:"center",color:"#fff",fontWeight:700}}>✅ 予想を保存しました！</div>
            :<button style={btnG} onClick={save} disabled={loading}>{loading?"保存中...":"🇯🇵 予想を保存する"}</button>
          }
        </div>
      }
    </div>
  );
}


/* ── 全体チャット ── */
function PgGlobalChat({nav}){
  return(
    <div style={{paddingBottom:40}}>
      <div style={{background:"linear-gradient(180deg,#061533 0%,#0a1f4c 100%)",padding:"36px 20px 22px",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <Back onClick={()=>nav("home")}/>
        <div style={{color:"#0068B7",fontSize:11,fontWeight:800,letterSpacing:3,marginBottom:4}}>GLOBAL CHAT</div>
        <div style={{color:G.gold,fontSize:22,fontWeight:900}}>💬 みんなの全体チャット</div>
        <div style={{color:G.muted,fontSize:12,marginTop:6,lineHeight:1.7}}>
          W杯について、誰とでも話せるチャットです。<br/>予想・応援・感想を投稿しよう。
        </div>
      </div>
      <div style={{padding:"14px 16px 0"}}>
        <ChatBox tournamentId={null} currentUser={null} title="全体チャット" maxHeight={480}/>
        <div style={{marginTop:10,background:"rgba(239,68,68,0.06)",borderRadius:10,padding:"8px 14px"}}>
          <div style={{color:"#FCA5A5",fontSize:11}}>⚠️ 個人情報・誹謗中傷・スパムは禁止です。楽しくご利用ください。</div>
        </div>
      </div>
    </div>
  );
}


/* ── GlobalStats BarRow（外部コンポーネント） ── */
function GsBarRow({label,count,pct,flag}){
  return(
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {flag&&<FlagImg country={label} size={18}/>}
          <span style={{color:"#eee",fontSize:13}}>{label}</span>
        </div>
        <span style={{color:G.gold,fontWeight:700,fontSize:13}}>{count}人</span>
      </div>
      <div style={{background:"rgba(0,91,172,0.1)",borderRadius:6,height:7,overflow:"hidden"}}>
        <div style={{background:"linear-gradient(90deg,#005BAC,#0068B7)",height:"100%",borderRadius:6,width:pct+"%"}}/>
      </div>
    </div>
  );
}
/* ── GlobalStats ── */
function PgGlobalStats({nav}){
  const [stats,setStats]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    (async()=>{const s=await fetchGlobalStats();setStats(s);setLoading(false);})();
  },[]);
  return(
    <div style={{paddingBottom:40}}>
      <div style={{background:"linear-gradient(180deg,#061533 0%,#0a1f4c 100%)",padding:"36px 20px 22px",textAlign:"center",position:"relative",overflow:"hidden",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <Back onClick={()=>nav("home")}/>
        <div style={{color:G.gold,fontSize:22,fontWeight:900}}>📊 みんなの予想データ</div>
        <div style={{color:G.muted,fontSize:12,marginTop:4}}>全体の匿名集計データ</div>
      </div>
      <div style={{padding:"14px 16px"}}>
        {loading?(
          <div style={{color:G.muted,textAlign:"center",padding:"40px 0"}}>読み込み中...</div>
        ):(!stats?(
          <div style={{color:G.muted,textAlign:"center",padding:"24px 0",fontSize:13}}>まだ予想データがありません</div>
        ):(
          <>
            <div style={{...crd,marginBottom:14,textAlign:"center"}}>
              <div style={{color:G.muted,fontSize:12,marginBottom:4}}>総予想数</div>
              <div style={{color:G.gold,fontSize:36,fontWeight:900}}>{stats.total}<span style={{fontSize:16,color:G.muted,fontWeight:400}}> 件</span></div>
            </div>
            <div style={{...crd,marginBottom:14}}>
              <div style={{color:G.gold,fontWeight:700,fontSize:13,marginBottom:12,letterSpacing:1}}>🥇 優勝予想ランキング</div>
              {stats.champRank.length===0?(
                <div style={{color:G.muted,textAlign:"center",padding:"24px 0",fontSize:13}}>まだ予想データがありません</div>
              ):stats.champRank.slice(0,10).map(([c,n])=>(
                <GsBarRow key={c} label={c} count={n} pct={Math.round(n*100/stats.total)} flag={true}/>
              ))}
            </div>
            <div style={{...crd,marginBottom:14}}>
              <div style={{color:G.gold,fontWeight:700,fontSize:13,marginBottom:12,letterSpacing:1}}>🇯🇵 日本代表成績予想ランキング</div>
              {stats.japRank.length===0?(
                <div style={{color:G.muted,textAlign:"center",padding:"24px 0",fontSize:13}}>まだ予想データがありません</div>
              ):stats.japRank.map(([r,n])=>(
                <GsBarRow key={r} label={r} count={n} pct={Math.round(n*100/stats.total)} flag={false}/>
              ))}
            </div>
            {stats.playerRank.length>0?(
              <div style={{...crd,marginBottom:14}}>
                <div style={{color:G.gold,fontWeight:700,fontSize:13,marginBottom:12,letterSpacing:1}}>🌟 期待されている日本代表選手ランキング</div>
                {stats.playerRank.slice(0,10).map(([name,n])=>(
                  <GsBarRow key={name} label={name} count={n} pct={Math.round(n*100/stats.playerRank[0][1])} flag={false}/>
                ))}
              </div>
            ):null}
          </>
        ))}
      </div>
    </div>
  );
}

/* ── もっと見るメニュー ── */
function PgMoreMenu({nav}){
  const MORE=[
    {icon:"🗂️",label:"グループ表",  sub:"全12グループ・FIFAランク",   action:()=>nav("groups"),   color:"#0068B7",bg:"rgba(0,104,183,0.07)",border:"rgba(0,104,183,0.2)"},
    {icon:"🎖️",label:"トーナメント",sub:"決勝T表・予想マップ",         action:()=>nav("bracket"),  color:"#005BAC",bg:"rgba(0,91,172,0.07)", border:"rgba(0,91,172,0.2)"},
    {icon:"🇯🇵",label:"日本代表特集",sub:"選手・成績・展望データ",      action:()=>{nav("japan");trackEvent("open_japan_mode",{page:"moremenu"});},color:"#7DD3FC",bg:"rgba(0,91,172,0.12)",border:"rgba(14,165,233,0.3)"},
    {icon:"💬",label:"全体チャット",sub:"W杯について語ろう",           action:()=>nav("globalchat"),color:"#A78BFA",bg:"rgba(139,92,246,0.1)",border:"rgba(139,92,246,0.25)"},
  ];
  return(
    <div style={{padding:"20px 16px 40px"}}>
      <Back onClick={()=>nav("home")}/>
      <div style={{color:G.gold,fontSize:21,fontWeight:900,marginBottom:4}}>📋 もっと見る</div>
      <div style={{color:G.muted,fontSize:13,marginBottom:16}}>その他のコンテンツ・情報</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {MORE.map((m,i)=>(
          <div key={i} onClick={m.action} style={{background:"#FFFFFF",border:`1px solid ${m.border}`,borderRadius:16,padding:"16px 14px",cursor:"pointer",boxShadow:"0 4px 16px rgba(0,91,172,0.08)"}}>
            <div style={{width:38,height:38,borderRadius:10,background:m.bg,border:`1px solid ${m.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:10,boxShadow:`0 0 12px ${m.color}33`}}>{m.icon}</div>
            <div style={{color:"#fff",fontWeight:700,fontSize:13,marginBottom:3}}>{m.label}</div>
            <div style={{color:G.muted,fontSize:10,lineHeight:1.4}}>{m.sub}</div>
            <div style={{color:m.color,fontSize:10,marginTop:6,fontWeight:600}}>→ 開く</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 個人予想モード ── */
function PgSoloPredict({nav}){
  const SOLO_KEY="soloPrediction";
  const initPred=()=>{try{const s=localStorage.getItem(SOLO_KEY);return s?JSON.parse(s):{winner:"",japanResult:"",japanPlayer:""};}catch{return{winner:"",japanResult:"",japanPlayer:""};} };
  const initDone=()=>{try{const s=localStorage.getItem(SOLO_KEY);const d=s?JSON.parse(s):{};return!!(d.winner&&d.japanResult);}catch{return false;} };
  const [pred,setPred]=useState(initPred);
  const [done,setDone]=useState(initDone);
  const [err,setErr]=useState("");
  const [copied,setCopied]=useState(false);
  const set=k=>v=>setPred(p=>({...p,[k]:v}));
  const save=()=>{
    if(!pred.winner||!pred.japanResult){setErr("優勝予想と日本代表成績は必須です");return;}
    try{localStorage.setItem(SOLO_KEY,JSON.stringify(pred));}catch{}
    setDone(true);
  };
  const reset=()=>{
    try{localStorage.removeItem(SOLO_KEY);}catch{}
    setPred({winner:"",japanResult:"",japanPlayer:""});
    setErr("");
    setDone(false);
  };
  const BASE="https://xiaokoulu-maker.github.io/wcup-yosou/";
  const shareText=`私の2026W杯優勝予想は【${pred.winner}】！\n日本代表は【${pred.japanResult}】予想です。${pred.japanPlayer?"\n期待の選手は【"+pred.japanPlayer+"】！":""}\n\nあなたも予想してみて👇\n${BASE}\n\n#W杯予想 #サッカー日本代表 #WorldCup2026`;
  const xUrl=`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const lineUrl=`https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`;
  const copy=async()=>{try{await navigator.clipboard.writeText(BASE);setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{}};

  if(done)return(
    <div style={{padding:"20px 18px 40px"}}>
      <Back onClick={()=>nav("home")}/>
      <div style={{color:G.gold,fontSize:21,fontWeight:900,marginBottom:16}}>⚽ 私のW杯予想</div>
      <div style={{...crd,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <FlagImg country={pred.winner} size={36}/>
          <div>
            <div style={{color:G.muted,fontSize:10,fontWeight:700,letterSpacing:1}}>優勝予想</div>
            <div style={{color:"#fff",fontWeight:900,fontSize:20}}>{pred.winner}</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <Badge label="🇯🇵 日本代表" val={pred.japanResult}/>
          {pred.japanPlayer&&<Badge label="🌟 期待選手" val={pred.japanPlayer}/>}
        </div>
      </div>
      <div style={{color:G.muted,fontSize:11,fontWeight:700,letterSpacing:1,marginBottom:8}}>📤 シェアする</div>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <a href={xUrl} target="_blank" rel="noopener noreferrer"
          style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,
            background:"#000",color:"#fff",borderRadius:12,padding:"11px 6px",
            fontWeight:700,textDecoration:"none",fontSize:13}}>𝕏 で投稿</a>
        <a href={lineUrl} target="_blank" rel="noopener noreferrer"
          style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,
            background:"#06C755",color:"#fff",borderRadius:12,padding:"11px 6px",
            fontWeight:700,textDecoration:"none",fontSize:13}}>📱 LINEで共有</a>
      </div>
      <button onClick={copy} style={{...btnGr,padding:"11px 20px",fontSize:13,marginBottom:10,
        color:copied?"#22C55E":G.muted,borderColor:copied?"rgba(34,197,94,0.4)":"#D9E8FF"}}>
        {copied?"✅ コピーしました":"🔗 URLをコピー"}
      </button>
      <button style={{...btnG,marginBottom:8}} onClick={()=>nav("create")}>🏆 友達と大会を作る</button>
      <button style={btnO} onClick={reset}>🔄 予想を作り直す</button>
    </div>
  );

  return(
    <div style={{padding:"20px 18px 40px"}}>
      <Back onClick={()=>nav("home")}/>
      <div style={{color:G.gold,fontSize:21,fontWeight:900,marginBottom:4}}>⚽ 今すぐ予想する</div>
      <div style={{color:G.muted,fontSize:13,marginBottom:16}}>大会に参加せずに自分だけのW杯予想を作れます</div>
      <div style={crd}>
        <div style={{marginBottom:18}}><label style={lbl}>🥇 優勝予想 ＊</label><FlagChips opts={COUNTRIES} value={pred.winner} onChange={set("winner")}/></div>
        <div style={{marginBottom:18}}><label style={lbl}>🇯🇵 日本代表の成績 ＊</label><Chips opts={JAPAN_RES} value={pred.japanResult} onChange={set("japanResult")}/></div>
        <div>
          <label style={lbl}>🌟 期待する日本代表選手（任意）</label>
          <PlayerChips opts={JAPAN_PLAYERS} value={pred.japanPlayer} onChange={set("japanPlayer")}/>
        </div>
      </div>
      <Err msg={err}/>
      <button style={btnG} onClick={save}>⚽ 予想を確定する</button>
    </div>
  );
}


/* ── 採点ルールカード（共通コンポーネント） ── */
function ScoringRulesCard({defaultOpen=false,compact=false}){
  const [open,setOpen]=useState(defaultOpen);
  if(compact)return(
    <div style={{background:"rgba(0,104,183,0.04)",border:"1px solid #D9E8FF",borderRadius:10,padding:"8px 14px",display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
      <span style={{color:G.gold,fontSize:13}}>ⓘ</span>
      <span style={{color:G.muted,fontSize:12}}>採点ルール: 勝敗的中 <strong style={{color:G.gold}}>+{SCORING.outcome}pt</strong>　スコア完全的中 <strong style={{color:G.gold}}>+{SCORING.outcome+SCORING.exact}pt</strong><span style={{fontSize:10,opacity:0.6}}>（Phase B）</span></span>
    </div>
  );
  return(
    <div style={{...crd,marginBottom:10,padding:"12px 16px"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",userSelect:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{color:G.gold,fontSize:15}}>ⓘ</span>
          <span style={{color:G.navy,fontWeight:700,fontSize:13}}>採点のしくみ</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {!open&&<span style={{color:G.muted,fontSize:12}}>勝敗的中で <strong style={{color:G.gold}}>+{SCORING.outcome}pt</strong></span>}
          <span style={{color:G.muted,fontSize:12,lineHeight:1}}>{open?"▲":"▼"}</span>
        </div>
      </div>
      {open&&(
        <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid #EAF3FF"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:12}}>
            <span style={{fontSize:18,flexShrink:0}}>✅</span>
            <div>
              <div style={{color:G.navy,fontWeight:700,fontSize:13}}>勝敗を当てる<span style={{color:G.gold,marginLeft:8,fontWeight:900}}>+{SCORING.outcome}pt</span></div>
              <div style={{color:G.muted,fontSize:11,marginTop:4,lineHeight:1.6}}>ホーム勝ち・引き分け・アウェイ勝ちの<br/>3択から正解を選ぶ</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"flex-start",gap:10,opacity:0.55}}>
            <span style={{fontSize:18,flexShrink:0}}>🎯</span>
            <div>
              <div style={{color:G.muted,fontWeight:700,fontSize:13}}>スコアまで完全的中<span style={{color:G.muted,marginLeft:8}}>+{SCORING.outcome+SCORING.exact}pt 合計</span></div>
              <div style={{color:G.muted,fontSize:11,marginTop:4}}>Phase B で実装予定（スコア予想で追加 +{SCORING.exact}pt）</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 試合予想ページ (Phase A) ── */
function PgMatches({tourn:t,setTourn,nav,update,myId}){
  const [tab,setTab]=useState("upcoming");
  const [savingId,setSavingId]=useState(null);
  const [expandedId,setExpandedId]=useState(null);
  const [showDoneModal,setShowDoneModal]=useState(null);
  const [sharingMatch,setSharingMatch]=useState(false);
  const [postingCard,setPostingCard]=useState(false);
  const [cardPosted,setCardPosted]=useState(false);
  const [saveErr,setSaveErr]=useState("");
  const [earnedBadgesM,setEarnedBadgesM]=useState([]);
  const [betInput,setBetInput]=useState(10);
  const [submittingBet,setSubmittingBet]=useState(false);
  const [showCoinDisclaimer,setShowCoinDisclaimer]=useState(false);
  useEffect(()=>{if(!t?.id)return;const unsub=subscribeToTournament(t.id,setTourn);return unsub;},[t?.id]);
  useEffect(()=>{setBetInput(10);},[expandedId]);

  const submitBet=async(matchId,amount)=>{
    if(!myId||submittingBet)return;
    const discShown=localStorage.getItem("wcup_coinDisclaimerShown");
    if(!discShown){setShowCoinDisclaimer(true);return;}
    setSubmittingBet(true);
    try{
      const fresh=await loadT(t.id);const cur=fresh||t;
      const participant=cur.participants.find(p=>p.id===myId);if(!participant)return;
      const pred=(participant.matchPredictions||{})[matchId];if(!pred?.pick)return;
      const c=getCoins(participant);
      if(amount>c.balance||amount<=0)return;
      const odds=calculateOdds(cur.participants,matchId,pred.pick);
      const newCoins={...c,balance:c.balance-amount,
        transactions:[{matchId,type:"bet",amount,at:new Date().toISOString()},...(c.transactions||[])].slice(0,20)};
      const newPred={...pred,betAmount:amount,odds};
      const updated={...cur,participants:cur.participants.map(p=>p.id===myId?{...p,coins:newCoins,matchPredictions:{...(p.matchPredictions||{}),[matchId]:newPred}}:p)};
      await update(updated);
    }catch(e){console.error("[submitBet]",e);}
    finally{setSubmittingBet(false);}
  };

  const saveScorer=async(matchId,scorerId)=>{
    if(!myId||savingId)return;
    setSavingId(matchId+"_sc");
    try{
      const fresh=await loadT(t.id);const cur=fresh||t;
      const p=cur.participants.find(x=>x.id===myId);if(!p)return;
      const existing=(p.matchPredictions||{})[matchId];if(!existing)return;
      const newScorer=existing.japanScorer===scorerId?null:scorerId;
      const updated={...cur,participants:cur.participants.map(x=>x.id===myId?{...x,matchPredictions:{...(x.matchPredictions||{}),[matchId]:{...existing,japanScorer:newScorer}}}:x)};
      await update(updated);
    }catch(e){console.error("[saveScorer]",e);}
    finally{setSavingId(null);}
  };
  useEffect(()=>{if(showDoneModal){setCardPosted(false);setSharingMatch(false);}},[showDoneModal]);
  if(!t)return null;
  const me=t.participants.find(p=>p.id===myId);
  const myPreds=me?.matchPredictions||{};
  const now=new Date();
  const matchResults=t.results?.matchResults||{};
  const enriched=MATCHES.map(m=>{
    const stored=matchResults[m.id];
    if(stored)return{...m,homeScore:stored.homeScore,awayScore:stored.awayScore,status:"finished"};
    return{...m,status:new Date(m.kickoff)<=now?"locked":"scheduled"};
  });
  const upcoming=enriched.filter(m=>m.status==="scheduled");
  const locked=enriched.filter(m=>m.status==="locked");
  const finished=enriched.filter(m=>m.status==="finished");
  const savePick=async(matchId,pick)=>{
    if(!myId){setSaveErr("まず「参加する」から大会に参加してください");return;}
    if(savingId)return;
    setSaveErr("");
    setSavingId(matchId);
    try{
      const fresh=await loadT(t.id);const cur=fresh||t;
      const participant=cur.participants.find(p=>p.id===myId);
      if(!participant){setSaveErr("参加者情報が見つかりません。ページを再読み込みしてください");setSavingId(null);return;}
      const prev=(participant.matchPredictions||{})[matchId]||{};
      const newPreds={...(participant.matchPredictions||{}),[matchId]:{...prev,pick,homeScore:null,awayScore:null,points:null}};
      const meWithPreds={...participant,matchPredictions:newPreds};
      // バッジチェック（予想数関連）
      let newBadges=[];
      try{newBadges=checkBadges(meWithPreds,{});}catch{}
      const finalMe=newBadges.length>0?{...meWithPreds,badges:[...(participant.badges||[]),...newBadges]}:meWithPreds;
      const updated={...cur,participants:cur.participants.map(p=>p.id===myId?finalMe:p)};
      await update(updated);
      setExpandedId(null);
      setShowDoneModal({matchId,pick});
      if(newBadges.length>0) setEarnedBadgesM(newBadges);
    }catch(e){
      setSaveErr("保存に失敗しました。もう一度試してください");
      console.error("[savePick]",e);
    }finally{setSavingId(null);}
  };
  const stageLbl=(s,g)=>s==="group"?`グループ${g}`:s==="r32"?"ベスト32":s==="r16"?"ベスト16":s==="qf"?"準々決勝":s==="sf"?"準決勝":s==="third"?"3位決定戦":"決勝";
  const renderMatch=(m)=>{
    const myPred=myPreds[m.id];
    const isScheduled=m.status==="scheduled";
    const isFinished=m.status==="finished";
    const isExpanded=expandedId===m.id;
    const isSaving=savingId===m.id;
    const actual=isFinished?(m.homeScore>m.awayScore?"home":m.homeScore<m.awayScore?"away":"draw"):null;
    const pts=isFinished&&myPred?scoreMatch(myPred,m):null;
    const correct=actual&&myPred?.pick===actual;
    const koDate=new Date(m.kickoff);
    const ko=koDate.toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"});
    const diffMs=koDate-now;
    const diffH=Math.floor(diffMs/3600000);
    const diffM=Math.floor((diffMs%3600000)/60000);
    const deadlineStr=isScheduled&&diffMs>0?(diffH>0?`あと ${diffH}h ${diffM}m`:`あと ${diffM}m`):null;
    const isLocked=m.status==="locked";
    return(
      <div key={m.id} className={`bg-white rounded-card shadow-data-card mb-3 overflow-hidden${isLocked?" opacity-60":""}`}>
        {/* 試合ヘッダー */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-text-on-white-gray text-xs font-bold">{stageLbl(m.stage,m.group)}</span>
          <div className="flex items-center gap-2">
            {deadlineStr&&<span className="text-hinomaru text-xs font-bold">{deadlineStr}</span>}
            <span className="text-text-on-white-gray text-xs">{ko}</span>
          </div>
        </div>
        {/* 対戦表示 */}
        <div className="grid grid-cols-3 items-center gap-2 px-4 pb-3">
          <div className="flex flex-col items-center gap-1">
            <FlagImg country={m.home} size={28}/>
            <span className="text-text-on-white font-black text-sm text-center leading-tight">{m.home}</span>
          </div>
          <div className="text-center">
            {isFinished?(
              <div className="bg-navy-base rounded-lg px-3 py-1 inline-block">
                <span className="text-gold font-black text-xl tabular-nums">{m.homeScore}</span>
                <span className="text-text-on-navy-weak text-sm mx-1">-</span>
                <span className="text-gold font-black text-xl tabular-nums">{m.awayScore}</span>
              </div>
            ):(
              <div>
                <div className="text-text-on-white-gray font-black text-xl">VS</div>
                <div className="text-text-on-white-gray text-xs mt-0.5">{koDate.toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})}</div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            <FlagImg country={m.away} size={28}/>
            <span className="text-text-on-white font-black text-sm text-center leading-tight">{m.away}</span>
          </div>
        </div>
        {/* 予想状態表示 */}
        <div className="px-4 pb-3">
          {myPred?.pick&&(
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${myPred.pick==="home"?"bg-navy-base/10 text-navy-base":myPred.pick==="away"?"bg-hinomaru/10 text-hinomaru":"bg-gray-100 text-text-on-white-gray"}`}>
                {myPred.pick==="home"?m.home+" 勝ち":myPred.pick==="away"?m.away+" 勝ち":"引き分け"}
              </span>
              {pts!==null&&(
                pts>0
                  ?<span className="text-success text-xs font-bold px-3 py-1 rounded-full bg-success/10 border border-success/30">+{pts}pt 的中！</span>
                  :<span className="text-text-on-white-gray text-xs px-3 py-1 rounded-full bg-gray-50">0pt</span>
              )}
              {isScheduled&&<button onClick={()=>setExpandedId(isExpanded?null:m.id)} className="text-text-on-white-gray text-xs cursor-pointer bg-transparent border-0">変更</button>}
            </div>
          )}
          {!myPred&&isScheduled&&myId&&(
            <button onClick={()=>setExpandedId(isExpanded?null:m.id)}
              className="w-full bg-navy-base text-white font-bold text-sm rounded-card py-2.5 border-0 cursor-pointer">
              ⚽ 予想する
            </button>
          )}
          {!myPred&&isScheduled&&!myId&&(
            <div className="text-text-on-white-gray text-xs text-center py-2">参加後に予想できます</div>
          )}
          {!myPred&&isFinished&&(
            <div className="text-text-on-white-gray text-xs text-center py-2">予想なし</div>
          )}
        </div>
        {/* 展開パネル: 3択ボタン + 得点者 + コイン */}
        {isExpanded&&isScheduled&&(
          <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-3">
            {/* 3択ボタン */}
            <div className="grid grid-cols-3 gap-2">
              {[["home",m.home],["draw","引き分け"],["away",m.away]].map(([pick,lb])=>{
                const sel=myPred?.pick===pick;
                const oddsVal=calculateOdds(t.participants,m.id,pick);
                return(
                  <button key={pick} onClick={()=>savePick(m.id,pick)} disabled={isSaving}
                    className={`py-3 px-1 rounded-card font-bold text-xs leading-tight text-center transition-transform active:scale-[.97] border-0 cursor-pointer${isSaving?" opacity-50":""}${sel?" bg-hinomaru text-white shadow-cta-red":" bg-gray-50 text-text-on-white border border-gray-200"}`}>
                    <div>{lb}</div>
                    <div className={`text-[10px] mt-0.5 ${sel?"text-white/80":"text-text-on-white-gray"}`}>{oddsVal.toFixed(1)}倍</div>
                  </button>
                );
              })}
            </div>
            <div className="text-center text-text-on-white-gray text-xs">
              {myPred?.pick?<span>選択中: <strong className="text-navy-base">+{SCORING.outcome}pt</strong> 期待</span>:<span>当たれば <strong className="text-navy-base">+{SCORING.outcome}pt</strong></span>}
            </div>
            {/* 日本戦: 得点者予想 */}
            {(m.home==="日本"||m.away==="日本")&&myPred?.pick&&(
              <div className="border-t border-gray-100 pt-3">
                <div className="text-hinomaru text-xs font-bold mb-2">🇯🇵 日本の得点者を予想（任意・+{SCORER_BONUS}pt）</div>
                <div className="flex flex-wrap gap-1.5">
                  {JAPAN_SQUAD.map(s=>{
                    const sel=myPred.japanScorer===s.id;
                    return(
                      <button key={s.id} onClick={()=>saveScorer(m.id,s.id)} disabled={!!savingId}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer border transition-all${savingId?" opacity-60":""}${sel?" bg-hinomaru text-white border-hinomaru":" bg-hinomaru/5 text-hinomaru border-hinomaru/30"}`}>
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* コイン賭けセクション */}
            {myPred?.pick&&!(myPred.betAmount>0)&&(()=>{
              const coins=getCoins(me);
              const balance=coins.balance;
              const maxBet=Math.max(10,balance);
              const clampedBet=Math.min(betInput,maxBet);
              const odds=calculateOdds(t.participants,m.id,myPred.pick);
              const est=Math.floor(clampedBet*odds);
              return(
                <div className="bg-white/5 border border-white/10 rounded-card p-4 bg-navy-base/5 border-navy-700/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-on-white-gray font-bold">🪙 コインを賭ける（任意）</span>
                    <span className="text-xs text-text-on-white-gray">残高 {balance.toLocaleString()}🪙</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-black tabular-nums text-text-on-white">{clampedBet.toLocaleString()}</span>
                    <span className="text-sm text-text-on-white-gray">🪙 × {odds.toFixed(2)}倍</span>
                  </div>
                  <input type="range" min={10} max={maxBet} step={10} value={clampedBet}
                    onChange={e=>setBetInput(parseInt(e.target.value))}
                    className="w-full accent-hinomaru mb-2"/>
                  <div className="text-xs text-text-on-white-gray mb-3">
                    {clampedBet>0?<>的中で <span className="text-gold font-bold">+{est.toLocaleString()}🪙</span></>:"賭けないで予想する"}
                  </div>
                  {balance>=10?(
                    <button onClick={()=>submitBet(m.id,clampedBet)} disabled={submittingBet||clampedBet>balance}
                      className={`w-full bg-gold text-navy-base font-bold text-sm rounded-card py-2.5 border-0 cursor-pointer shadow-cta-gold transition-opacity${submittingBet?" opacity-70":""}`}>
                      {submittingBet?"賭け中...":"🪙 "+clampedBet.toLocaleString()+" コインで賭ける"}
                    </button>
                  ):(
                    <div className="text-text-on-white-gray text-xs text-center">コインが不足しています</div>
                  )}
                </div>
              );
            })()}
            {myPred?.betAmount>0&&(()=>{
              const odds=myPred.odds||2.0;
              const est=Math.floor(myPred.betAmount*odds);
              const settled=myPred.payout!=null;
              return(
                <div className="rounded-card p-3 border" style={{background:"rgba(245,158,11,0.08)",borderColor:"rgba(245,158,11,0.3)"}}>
                  <div className="text-xs font-bold mb-1" style={{color:"#D97706"}}>🪙 賭け済み</div>
                  <div className="text-xs text-text-on-white">{myPred.betAmount.toLocaleString()} × {odds.toFixed(2)} = {est.toLocaleString()}🪙 期待</div>
                  {settled&&<div className={`text-xs font-bold mt-1 ${myPred.payout>0?"text-success":"text-text-on-white-gray"}`}>{myPred.payout>0?`+${myPred.payout.toLocaleString()}🪙 獲得！`:"没収"}</div>}
                </div>
              );
            })()}
            {/* この予想で決定ボタン */}
            {myPred?.pick&&(
              <button onClick={()=>savePick(m.id,myPred.pick)} disabled={isSaving}
                className={`w-full bg-hinomaru text-white font-bold text-base rounded-card-lg shadow-cta-red py-3.5 border-0 cursor-pointer transition-transform active:scale-[.98]${isSaving?" opacity-60":""}`}>
                {isSaving?"保存中...":"この予想で決定する →"}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };
  const tabData={upcoming,locked,finished};
  const finishedPreds=Object.values(myPreds).filter(p=>p.points!==null);
  const correctCount=finishedPreds.filter(p=>p.points>0).length;
  const accuracyPct=finishedPreds.length>0?Math.round(correctCount/finishedPreds.length*100):0;
  return(
    <div className="bg-navy-base min-h-screen pb-12 text-text-on-navy" style={{maxWidth:480,margin:"0 auto"}}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <button onClick={()=>nav("tournament")} className="text-text-on-navy-dim text-2xl font-bold bg-transparent border-0 cursor-pointer leading-none">←</button>
        <div className="text-center">
          <div className="text-white font-black text-lg">試合を予想</div>
          <div className="text-text-on-navy-dim text-xs">{t.name}</div>
        </div>
        <div className="bg-hinomaru/20 text-hinomaru-light text-xs font-bold px-3 py-1 rounded-full">+{SCORING.outcome}pt</div>
      </div>
      {/* 採点ルール（折りたたみ） */}
      <div className="px-5 mb-3">
        <ScoringRulesCard compact={true}/>
      </div>
      {/* 自分のスタッツ */}
      {me&&(
        <div className="px-5 mb-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[[me.totalMatchPoints||0,"累計PT"],[correctCount,"的中数"],[accuracyPct+"%","的中率"]].map(([v,l])=>(
              <div key={l} className="bg-white/5 border border-white/10 rounded-card py-2">
                <div className="text-gold font-black text-xl tabular-nums">{v}</div>
                <div className="text-text-on-navy-weak text-xs mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* タブ */}
      <div className="grid grid-cols-3 gap-2 px-5 mb-3">
        {[["upcoming","受付中",upcoming.length],["locked","締切済",locked.length],["finished","確定",finished.length]].map(([v,lb,cnt])=>(
          <button key={v} onClick={()=>setTab(v)}
            className={`py-2 rounded-card font-bold text-xs border-0 cursor-pointer${tab===v?" bg-hinomaru text-white shadow-cta-red":" bg-white/5 text-text-on-navy-dim"}`}>
            {lb}<br/><span className="font-normal opacity-80">{cnt}試合</span>
          </button>
        ))}
      </div>
      {/* 試合リスト */}
      <div className="px-5">
        {!myId&&tab==="upcoming"&&(
          <div className="bg-hinomaru/10 border border-hinomaru/30 rounded-card p-4 mb-3">
            <div className="text-hinomaru-light text-sm font-bold mb-2">⚠️ まず大会に参加してから予想できます</div>
            <button onClick={()=>nav("join")} className="bg-white/10 border border-white/20 rounded-card text-white text-xs font-bold px-4 py-2 cursor-pointer">✋ 参加する →</button>
          </div>
        )}
        {saveErr&&<div className="bg-hinomaru/10 border border-hinomaru/30 rounded-card p-3 mb-3 text-hinomaru-light text-sm font-bold">{saveErr}</div>}
        {tabData[tab].length===0?(
          <div className="bg-white/5 border border-white/10 rounded-card text-center py-8 text-text-on-navy-dim text-sm">
            {tab==="upcoming"?"受付中の試合はありません":tab==="locked"?"締切済みの試合はありません":"確定した試合はありません"}
          </div>
        ):tabData[tab].map(renderMatch)}
      </div>
      {/* 完了モーダル（新デザイン） */}
      {showDoneModal&&(
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={()=>setShowDoneModal(null)}>
          <div onClick={e=>e.stopPropagation()}
            className="bg-navy-base text-text-on-navy w-full rounded-t-sheet shadow-hero p-6 pb-10 animate-wc-sheet"
            style={{maxWidth:480}}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">⚽</div>
              <div className="text-white font-extrabold text-xl">予想を決定しました！</div>
              <div className="text-text-on-navy-dim text-sm mt-1">結果が出たら自動で採点されます</div>
            </div>
            <div className="flex flex-col gap-2.5">
              <button onClick={async()=>{if(sharingMatch)return;setSharingMatch(true);await doShareImage(<ShareCardMatchPrediction matchId={showDoneModal.matchId} pick={showDoneModal.pick} tournName={t?.name||""}/>,"wcup-match.png","試合予想をシェア！ #W杯予想メーカー");setSharingMatch(false);}}
                disabled={sharingMatch}
                className={`w-full bg-hinomaru text-white font-bold rounded-card-lg shadow-cta-red py-3.5 border-0 cursor-pointer${sharingMatch?" opacity-70":""}`}>
                {sharingMatch?"🔄 画像生成中...":"📷 予想を画像で投稿"}
              </button>
              <button onClick={async()=>{
                if(postingCard||cardPosted)return;
                const m2=MATCHES.find(x=>x.id===showDoneModal.matchId);
                if(!m2)return;
                const pick=showDoneModal.pick;
                const pickText=pick==="home"?`${m2.home} 勝ち`:pick==="away"?`${m2.away} 勝ち`:"引き分け";
                const ko=new Date(m2.kickoff).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"});
                const body=`${me?.icon||"⚽"} ${me?.nickname||"?"}さんの予想:\n${m2.home} vs ${m2.away} → ${pickText}！ (+${SCORING.outcome}pt 期待)\n${ko} キックオフ`;
                setPostingCard(true);
                await sendMessage(t.id,me?.nickname||"?",me?.icon||"⚽",body,{type:"prediction_card"});
                setPostingCard(false);setCardPosted(true);
              }} disabled={postingCard||cardPosted}
                className={`w-full font-bold rounded-card-lg py-3.5 border-0 cursor-pointer${cardPosted?" bg-success/20 text-success border border-success/30":" bg-gold text-navy-base shadow-cta-gold"}${postingCard?" opacity-70":""}`}>
                {postingCard?"🔄 投稿中...":cardPosted?"✅ チャットに投稿しました":"📣 みんなにこの予想を見せる"}
              </button>
              <button onClick={()=>setShowDoneModal(null)}
                className="w-full bg-white/10 border border-white/20 text-white font-bold rounded-card-lg py-3 border-0 cursor-pointer">
                ⚽ もう1試合予想する
              </button>
              <a href={`https://line.me/R/msg/text/?${encodeURIComponent(`【W杯予想大会】${t.name}\n一緒に予想しよう！\n${window.location.origin}${window.location.pathname}#t-${t.id}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="block text-center font-bold rounded-card-lg py-3 text-white no-underline"
                style={{background:"rgba(6,199,85,0.2)",border:"1px solid rgba(6,199,85,0.4)"}}>
                📱 友達を招待する
              </a>
              <button onClick={()=>setShowDoneModal(null)}
                className="w-full text-text-on-navy-dim py-2 text-sm bg-transparent border-0 cursor-pointer">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
      {earnedBadgesM.length>0&&<BadgeModal badges={earnedBadgesM} onClose={()=>setEarnedBadgesM([])}/>}
      {showCoinDisclaimer&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000}}>
          <div style={{background:"#fff",borderRadius:20,padding:"28px 22px",maxWidth:320,width:"90%",animation:"fadeUp 0.2s ease-out"}}>
            <div style={{color:"#F59E0B",fontWeight:900,fontSize:20,textAlign:"center",marginBottom:8}}>🪙 ゲーム内コインとは？</div>
            <div style={{background:"rgba(230,0,51,0.06)",border:"1px solid rgba(230,0,51,0.2)",borderRadius:10,padding:"10px 12px",marginBottom:12}}>
              <div style={{color:"#E60033",fontWeight:700,fontSize:12,marginBottom:4}}>⚖️ 換金不可の確認</div>
              <div style={{color:"#102A43",fontSize:11,lineHeight:1.7}}>
                ・現実のお金や賞品と交換できません<br/>
                ・コインの購入はできません（無料のみ）<br/>
                ・他のプレイヤーへの譲渡はできません<br/>
                ・アプリ内のランキングにのみ影響します
              </div>
            </div>
            <div style={{color:G.muted,fontSize:11,marginBottom:14}}>このコインはゲームを盛り上げるための仮想ポイントです。賭け体験を楽しみましょう！</div>
            <button onClick={()=>{localStorage.setItem("wcup_coinDisclaimerShown","1");setShowCoinDisclaimer(false);}} style={{...btnG,fontSize:13}}>理解しました → 賭けに進む</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── コインショップ ── */
function PgCoinShop({nav,tourn,myId,update}){
  const me=tourn?.participants?.find(p=>p.id===myId);
  const coins=getCoins(me);
  const [claimMsg,setClaimMsg]=useState("");
  const [claiming,setClaiming]=useState(false);

  const claimDaily=async()=>{
    if(!myId||!tourn||claiming)return;
    const key=`wcup_lastLoginBonus_${tourn.id}_${myId}`;
    const today=new Date().toISOString().slice(0,10);
    if(localStorage.getItem(key)===today){setClaimMsg("⏳ 本日は既に受け取り済みです（明日また来てね）");return;}
    setClaiming(true);
    try{
      const fresh=await loadT(tourn.id);const cur=fresh||tourn;
      const participant=cur.participants.find(p=>p.id===myId);if(!participant){setClaiming(false);return;}
      const c=getCoins(participant);
      const bonus=100;
      const newCoins={...c,balance:c.balance+bonus,totalEarned:c.totalEarned+bonus,
        transactions:[{matchId:null,type:"daily_bonus",amount:bonus,at:new Date().toISOString()},...(c.transactions||[])].slice(0,20)};
      await update({...cur,participants:cur.participants.map(p=>p.id===myId?{...p,coins:newCoins}:p)});
      localStorage.setItem(key,today);
      setClaimMsg(`✅ +${bonus} コイン獲得！残高: ${(c.balance+bonus).toLocaleString()}`);
    }catch(e){setClaimMsg("エラーが発生しました");}
    finally{setClaiming(false);}
  };

  return(
    <div className="bg-navy-base text-text-on-navy min-h-screen pb-10">
      {/* ヘッダー */}
      <div className="bg-navy-hero px-5 pt-4 pb-4 flex items-center gap-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none" style={{background:"radial-gradient(circle,rgba(244,180,0,0.2),transparent 70%)",transform:"translate(30%,-30%)"}}/>
        <button onClick={()=>nav("tournament")} className="text-white text-2xl font-bold bg-transparent border-0 cursor-pointer leading-none z-10 active:scale-90 transition-transform">←</button>
        <div className="flex-1 text-center z-10">
          <div className="text-white font-black text-lg">🪙 コインショップ</div>
        </div>
        <div className="w-8 z-10"/>
      </div>

      {/* 残高カード */}
      <div className="bg-gradient-to-br from-gold/30 via-gold/15 to-transparent border-2 border-gold rounded-card-lg p-6 mx-5 mt-4 shadow-cta-gold text-center">
        <div className="text-xs text-gold font-bold tracking-widest">現在の残高</div>
        <div className="mt-3 flex items-baseline justify-center gap-1">
          <span className="text-display-lg font-black tabular-nums text-gold">{coins.balance.toLocaleString()}</span>
          <span className="text-2xl">🪙</span>
        </div>
        <div className="border-t border-white/10 mt-4 pt-3 grid grid-cols-2 gap-2 text-xs text-text-on-navy-dim">
          <div>累計獲得 <span className="text-text-on-navy font-bold">{coins.totalEarned.toLocaleString()}</span></div>
          <div>累計使用 <span className="text-text-on-navy font-bold">{coins.totalLost.toLocaleString()}</span></div>
        </div>
      </div>

      {/* 換金不可の明示（絶対に外さない） */}
      <div className="bg-white/5 border border-white/15 rounded-card p-4 mx-5 mt-4 text-text-on-navy-dim text-sm">
        <div className="font-bold text-text-on-navy text-xs mb-2">🪙 ゲーム内コインについて</div>
        <div className="text-xs leading-relaxed">
          <div>・現実のお金や賞品とは一切交換できません</div>
          <div className="mt-0.5">・購入はできません（無料配布のみ）</div>
          <div className="mt-0.5">・他のプレイヤーへの譲渡はできません</div>
          <div className="mt-0.5">・アプリ内のランキング・バッジにのみ影響します</div>
        </div>
      </div>

      {/* 毎日ログインボーナス */}
      <div className="mx-5 mt-5">
        <div className="text-text-on-navy-dim text-xs font-bold tracking-widest mb-3">デイリーボーナス</div>
        <div className="bg-white text-text-on-white rounded-card shadow-data-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold text-text-on-white text-sm">📅 毎日ログインボーナス</div>
              <div className="text-text-on-white-gray text-xs mt-1">1日1回 +100コインを受け取れます</div>
            </div>
            <div className="text-gold font-black text-xl">+100🪙</div>
          </div>
          {claimMsg&&<div className={`text-xs font-bold mb-3 ${claimMsg.startsWith("✅")?"text-success":"text-gold"}`}>{claimMsg}</div>}
          <button onClick={claimDaily} disabled={claiming}
            className={`w-full font-bold rounded-card-lg py-3 border-0 text-sm transition-all active:scale-[.98] ${claiming?"bg-gray-100 text-text-on-white-gray cursor-not-allowed":"bg-hinomaru text-white shadow-cta-red cursor-pointer"}`}>
            {claiming?"受け取り中...":"🪙 今日のボーナスを受け取る"}
          </button>
        </div>
      </div>

      {/* 無料ミッション */}
      <div className="mx-5 mt-5">
        <div className="text-text-on-navy-dim text-xs font-bold tracking-widest mb-3">無料ミッション</div>
        <div className="bg-white text-text-on-white rounded-card shadow-data-card p-4 mb-3 opacity-60">
          <div className="flex items-baseline justify-between">
            <div className="font-bold text-sm">📺 広告を視聴する</div>
            <div className="text-gold font-black tabular-nums">+200🪙</div>
          </div>
          <div className="text-text-on-white-gray text-xs mt-1">動画を見てコインを獲得</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden"/>
          <div className="w-full bg-card-mist text-text-on-white-gray font-bold rounded-card-lg py-2 mt-3 text-center text-xs cursor-not-allowed">準備中</div>
        </div>
        <div className="bg-white text-text-on-white rounded-card shadow-data-card p-4 mb-3 opacity-60">
          <div className="flex items-baseline justify-between">
            <div className="font-bold text-sm">👥 友達を招待する</div>
            <div className="text-gold font-black tabular-nums">+300🪙</div>
          </div>
          <div className="text-text-on-white-gray text-xs mt-1">招待リンクから新規参加で獲得</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden"/>
          <div className="w-full bg-card-mist text-text-on-white-gray font-bold rounded-card-lg py-2 mt-3 text-center text-xs cursor-not-allowed">準備中</div>
        </div>
      </div>

      {/* コイン履歴 */}
      {coins.transactions?.length>0&&(
        <div className="mx-5 mt-5">
          <div className="text-text-on-navy-dim text-xs font-bold tracking-widest mb-3">最近の取引</div>
          {coins.transactions.slice(0,10).map((tx,i)=>(
            <div key={i} className="bg-white/5 border border-white/10 rounded-card p-3 mb-2 flex justify-between items-center">
              <div>
                <div className="text-text-on-navy text-xs font-bold">
                  {tx.type==="bet"?"🪙 ベット":tx.type==="win"?"🎉 当選":tx.type==="lose"?"😢 没収":tx.type==="daily_bonus"?"🎁 ボーナス":"その他"}
                  {tx.matchId?` (${tx.matchId})`:""}
                </div>
                <div className="text-text-on-navy-weak text-[10px]">{tx.at?new Date(tx.at).toLocaleDateString("ja-JP"):""}</div>
              </div>
              <div className={`font-bold text-sm tabular-nums ${(tx.type==="win"||tx.type==="daily_bonus")?"text-success":"text-hinomaru"}`}>
                {(tx.type==="bet"||tx.type==="lose")?"-":"+"}  {tx.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── マイ・バッジ ── */
function PgBadges({nav,tourn,myId}){
  const me=tourn?.participants?.find(p=>p.id===myId);
  const myBadges=me?.badges||[];
  const earnedIds=new Set(myBadges.map(b=>b.id));
  const preds=me?.matchPredictions||{};
  const predCount=Object.keys(preds).length;
  const totalPts=me?.totalMatchPoints||0;
  const streak=me?.streak||{current:0,best:0};
  const earned=myBadges.length;

  function progress(id){
    if(id==="predict_5") return{cur:Math.min(predCount,5),max:5};
    if(id==="predict_20") return{cur:Math.min(predCount,20),max:20};
    if(id==="predict_all_group") return{cur:Math.min(predCount,72),max:72};
    if(id==="streak_3") return{cur:Math.min(streak.best,3),max:3};
    if(id==="streak_5") return{cur:Math.min(streak.best,5),max:5};
    if(id==="streak_10") return{cur:Math.min(streak.best,10),max:10};
    if(id==="pts_10") return{cur:Math.min(totalPts,10),max:10};
    if(id==="pts_50") return{cur:Math.min(totalPts,50),max:50};
    if(id==="pts_100") return{cur:Math.min(totalPts,100),max:100};
    return null;
  }

  return(
    <div className="bg-navy-base text-text-on-navy min-h-screen pb-10">
      {/* ヘッダー */}
      <div className="bg-navy-hero px-5 pt-4 pb-4 flex items-center gap-3">
        <button onClick={()=>nav("tournament")} className="text-white text-2xl font-bold bg-transparent border-0 cursor-pointer leading-none active:scale-90 transition-transform">←</button>
        <div className="flex-1 text-center">
          <div className="text-white font-black text-lg">🏅 マイ・バッジ</div>
        </div>
        <div className="w-8"/>
      </div>

      {/* サマリーカード */}
      <div className="bg-gradient-to-br from-gold/20 to-transparent border-2 border-gold rounded-card-lg p-5 mx-5 mt-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0" style={{width:64,height:64}}>
            <svg width="64" height="64" viewBox="0 0 64 64" style={{transform:"rotate(-90deg)"}}>
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6"/>
              <circle cx="32" cy="32" r="28" fill="none" stroke="#F4B400" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2*Math.PI*28*(BADGES.length>0?earned/BADGES.length:0)} ${2*Math.PI*28}`}/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-black text-white text-lg">{earned}</span>
          </div>
          <div>
            <div className="text-white font-black text-xl">{earned} / {BADGES.length} 獲得</div>
            <div className="text-text-on-navy-dim text-xs mt-1">バッジを集めて全国TOPプレイヤーへ</div>
          </div>
        </div>
      </div>

      {!me&&<EmptyState icon="🏅" title="まだバッジを獲得していません" description={"最初の予想を入れて\n「🎯 予想デビュー」を獲得しよう！"} cta="⚽ 予想する →" onCtaClick={()=>nav("matches")}/>}
      {me&&BADGES.filter(b=>earnedIds.has(b.id)).length===0&&(
        <EmptyState icon="🏅" title="まだバッジを獲得していません" description={"最初の予想を入れて\n「🎯 予想デビュー」を獲得しよう！"} cta="⚽ 予想する →" onCtaClick={()=>nav("matches")}/>
      )}

      {/* 獲得済みバッジ */}
      {me&&BADGES.filter(b=>earnedIds.has(b.id)).length>0&&(
        <div className="mx-5 mt-6">
          <div className="font-bold text-sm mb-3 text-text-on-navy">獲得済み ({BADGES.filter(b=>earnedIds.has(b.id)).length})</div>
          <div className="grid grid-cols-4 gap-2">
            {BADGES.filter(b=>earnedIds.has(b.id)).map(b=>{
              const earnedAt=myBadges.find(x=>x.id===b.id)?.earnedAt;
              return(
                <div key={b.id} className="bg-gold/10 border-2 border-gold rounded-card p-3 text-center transition active:scale-[.95]">
                  <div className="text-3xl">{b.icon}</div>
                  <div className="mt-2 text-xs font-bold text-text-on-navy leading-tight">{b.name}</div>
                  <div className="text-[10px] text-gold mt-1">✓</div>
                  {earnedAt&&<div className="text-[9px] text-text-on-navy-weak mt-0.5">{new Date(earnedAt).toLocaleDateString("ja-JP")}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 進捗中バッジ */}
      {me&&BADGES.filter(b=>!earnedIds.has(b.id)&&progress(b.id)).length>0&&(
        <div className="mx-5 mt-5">
          <div className="font-bold text-sm mb-3 text-text-on-navy-dim">あと一歩 ({BADGES.filter(b=>!earnedIds.has(b.id)&&progress(b.id)).length})</div>
          <div className="grid grid-cols-4 gap-2">
            {BADGES.filter(b=>!earnedIds.has(b.id)&&progress(b.id)).map(b=>{
              const pg=progress(b.id);
              return(
                <div key={b.id} className="bg-white/5 border border-white/15 rounded-card p-3 text-center transition">
                  <div className="text-3xl">{b.icon}</div>
                  <div className="mt-2 text-xs font-bold text-text-on-navy leading-tight">{b.name}</div>
                  {pg&&<div className="text-[10px] text-text-on-navy-dim mt-1 tabular-nums">{pg.cur}/{pg.max}</div>}
                  {pg&&(
                    <div className="w-full bg-white/10 rounded-full h-1 mt-1 overflow-hidden">
                      <div className="bg-hinomaru h-1 rounded-full" style={{width:`${Math.round(pg.cur/pg.max*100)}%`}}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 未獲得バッジ */}
      {me&&BADGES.filter(b=>!earnedIds.has(b.id)&&!progress(b.id)).length>0&&(
        <div className="mx-5 mt-5">
          <div className="font-bold text-sm mb-3 text-text-on-navy-dim">未獲得 ({BADGES.filter(b=>!earnedIds.has(b.id)&&!progress(b.id)).length})</div>
          <div className="grid grid-cols-4 gap-2">
            {BADGES.filter(b=>!earnedIds.has(b.id)&&!progress(b.id)).map(b=>(
              <div key={b.id} className="bg-white/5 border border-white/10 rounded-card p-3 text-center opacity-50">
                <div className="text-3xl">🔒</div>
                <div className="mt-2 text-xs font-bold text-text-on-navy-weak leading-tight">{b.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* バッジ説明（全リスト） */}
      {me&&(
        <div className="mx-5 mt-6">
          <div className="font-bold text-sm mb-3 text-text-on-navy-dim">バッジ一覧</div>
          {BADGES.map(b=>{
            const got=earnedIds.has(b.id);
            const pg=progress(b.id);
            const earnedAt=myBadges.find(x=>x.id===b.id)?.earnedAt;
            return(
              <div key={b.id} className={`flex items-center gap-3 p-3 rounded-card mb-2 border ${got?"bg-gold/5 border-gold/30":"bg-white/5 border-white/10"}`} style={{opacity:got?1:0.6}}>
                <div className="text-2xl flex-shrink-0 w-9 text-center">{b.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${got?"text-text-on-navy":"text-text-on-navy-dim"}`}>{b.name}</span>
                    {got&&<span className="text-success text-xs">✅</span>}
                    {!got&&pg&&<span className="text-text-on-navy-weak text-xs">⏳</span>}
                  </div>
                  <div className="text-text-on-navy-weak text-xs mt-0.5">{b.desc}</div>
                  {!got&&pg&&(
                    <div className="mt-1.5">
                      <div className="bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-hinomaru h-1.5 rounded-full transition-all" style={{width:`${Math.round(pg.cur/pg.max*100)}%`}}/>
                      </div>
                      <div className="text-text-on-navy-weak text-[10px] mt-1">{pg.cur} / {pg.max}</div>
                    </div>
                  )}
                  {got&&earnedAt&&<div className="text-text-on-navy-weak text-[10px] mt-0.5">取得: {new Date(earnedAt).toLocaleDateString("ja-JP")}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── spec-12: マイページ ── */
function PgMyPage({nav,tourn,myId,update}){
  const me=tourn?.participants?.find(p=>p.id===myId);
  const nickname=me?.nickname||"ゲスト";
  const icon=me?.icon||"👤";
  const [editNick,setEditNick]=useState(false);
  const [editNickVal,setEditNickVal]=useState(nickname);
  const [editIcon,setEditIcon]=useState(icon);
  const [saving,setSaving]=useState(false);

  // 統計
  const totalPoints=me?.totalMatchPoints||0;
  const preds=Object.entries(me?.matchPredictions||{});
  const matchResults=tourn?.results?.matchResults||{};
  const finishedPreds=preds.filter(([id,p])=>matchResults[id]?.status==="finished"||p.points!=null);
  const hits=finishedPreds.filter(([,p])=>(p.points||0)>0).length;
  const hitRate=finishedPreds.length>0?Math.round(hits/finishedPreds.length*100):null;
  const streak=me?.streak||{current:0,best:0};

  // 大会内順位
  const sortedP=[...(tourn?.participants||[])].sort((a,b)=>(b.totalMatchPoints||0)-(a.totalMatchPoints||0));
  const myRankIdx=sortedP.findIndex(p=>p.id===myId);
  const myRankStr=myRankIdx>=0?`${myRankIdx+1}位`:"-";

  // 最近の予想（直近10件、キックオフ降順）
  const recentPreds=preds
    .map(([matchId,p])=>{const m=MATCHES.find(x=>x.id===matchId);return m?{matchId,pick:p.pick,points:p.points,match:m}:null;})
    .filter(Boolean)
    .sort((a,b)=>new Date(b.match.kickoff)-new Date(a.match.kickoff))
    .slice(0,10);

  const fmtKO=(kickoff)=>{
    const d=new Date(kickoff);
    const days=["日","月","火","水","木","金","土"];
    return `${d.getMonth()+1}/${d.getDate()}(${days[d.getDay()]}) ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  const saveNick=async()=>{
    if(!editNickVal.trim()||!myId||!tourn||saving) return;
    setSaving(true);
    try{
      const fresh=await loadT(tourn.id);const cur=fresh||tourn;
      const updated={...cur,participants:cur.participants.map(p=>p.id===myId?{...p,nickname:editNickVal.trim(),icon:editIcon}:p)};
      await update(updated);
      try{localStorage.setItem("chat_nick",editNickVal.trim());localStorage.setItem("chat_icon",editIcon);}catch{}
      setEditNick(false);
    }catch(e){console.warn(e);}
    finally{setSaving(false);}
  };

  if(!me){
    return(
      <div className="bg-navy-base text-text-on-navy min-h-screen pb-10">
        <div className="bg-navy-hero px-5 pt-4 pb-4 flex items-center gap-3">
          <button onClick={()=>nav("home")} className="text-white text-2xl font-bold bg-transparent border-0 cursor-pointer leading-none active:scale-90">←</button>
          <div className="flex-1 text-center"><div className="text-white font-black text-lg">👤 マイページ</div></div>
          <div className="w-8"/>
        </div>
        <EmptyState icon="👤" title="大会に参加していません" description={"大会に参加すると\nマイページが使えるようになります"} cta="🏆 大会を探す" onCtaClick={()=>nav("home")}/>
      </div>
    );
  }

  return(
    <div className="bg-navy-base text-text-on-navy min-h-screen pb-10">
      {/* ── ヘッダー ── */}
      <div className="bg-navy-hero px-5 pt-4 pb-4 flex items-center gap-3">
        <button onClick={()=>nav("home")} className="text-white text-2xl font-bold bg-transparent border-0 cursor-pointer leading-none z-10 active:scale-90 transition-transform">←</button>
        <div className="flex-1 text-center z-10"><div className="text-white font-black text-lg">👤 マイページ</div></div>
        <div className="w-8 z-10"/>
      </div>

      {/* ── プロフィールカード ── */}
      <div className="bg-white text-text-on-white rounded-card-lg shadow-data-card p-5 mx-5 mt-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-navy-base flex items-center justify-center text-2xl flex-shrink-0">{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-black truncate">{nickname}</div>
            <div className="text-xs text-text-on-white-gray mt-1 truncate">{tourn?.name}</div>
            <button onClick={()=>{setEditNickVal(nickname);setEditIcon(icon);setEditNick(true);}}
              className="text-xs text-hinomaru font-bold mt-1.5 bg-transparent border-0 cursor-pointer p-0 active:opacity-70">
              ✏️ プロフィール編集
            </button>
          </div>
        </div>
      </div>

      {/* ── 統計グリッド ── */}
      <div className="grid grid-cols-2 gap-3 mx-5 mt-4">
        {[
          {label:"累計ポイント",value:totalPoints,unit:"pt",color:"text-hinomaru"},
          {label:"的中率",value:hitRate!==null?`${hitRate}%`:"-",sub:hitRate!==null?`${hits}/${finishedPreds.length}試合`:null,color:"text-success"},
          {label:"🔥 連続的中",value:streak.current,sub:`自己ベスト ${streak.best}`,color:"text-gold"},
          {label:"🏆 大会内順位",value:myRankStr,sub:`/ ${sortedP.length}人中`,color:"text-navy-base"},
        ].map((s,i)=>(
          <div key={i} className="rounded-xl border border-white/10 p-4 text-center" style={{background:"#12244f"}}>
            <div className="text-[10px] text-text-on-navy-dim">{s.label}</div>
            <div className={`text-2xl font-black tabular-nums mt-1 ${s.color}`}>
              {s.value}{s.unit&&<span className="text-sm ml-1 text-text-on-navy-dim">{s.unit}</span>}
            </div>
            {s.sub&&<div className="text-[10px] text-text-on-navy-dim mt-0.5">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── 参加中の大会 ── */}
      {tourn&&(
        <>
          <div className="text-sm font-extrabold mx-5 mt-6 mb-2 text-text-on-navy">参加中の大会</div>
          <div className="rounded-xl border border-white/10 p-4 mx-5 flex items-center justify-between" style={{background:"#12244f"}}>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white truncate">{tourn.name}</div>
              <div className="text-xs text-text-on-navy-dim mt-1">{myRankStr} · {sortedP.length}人中 · {totalPoints}pt</div>
            </div>
            <button onClick={()=>nav("tournament")} className="text-gold text-sm font-bold bg-transparent border-0 cursor-pointer ml-3 flex-shrink-0 active:opacity-70">開く →</button>
          </div>
        </>
      )}

      {/* ── 最近の予想 ── */}
      <div className="text-sm font-extrabold mx-5 mt-6 mb-2 text-text-on-navy">最近の予想</div>
      {recentPreds.length===0?(
        <div className="bg-white/5 border border-white/15 rounded-card p-6 mx-5 text-center text-text-on-navy-dim text-sm">まだ予想を入れていません</div>
      ):recentPreds.map((p,i)=>{
        const m=p.match;
        const pickLabel=p.pick==="home"?`${m.home} 勝ち`:p.pick==="away"?`${m.away} 勝ち`:"引き分け";
        const resultText=p.points==null?"未確定":p.points>0?`+${p.points}pt 的中`:"0pt 外れ";
        const resultColor=p.points==null?"text-text-on-navy-dim":p.points>0?"text-success":"text-text-on-navy-weak";
        return(
          <div key={i} className="bg-white/5 border border-white/15 rounded-card p-3 mx-5 mt-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-text-on-navy-dim truncate flex-1">{m.home} vs {m.away}</div>
              <div className={`text-xs font-bold ml-2 flex-shrink-0 ${resultColor}`}>{resultText}</div>
            </div>
            <div className="text-sm font-bold text-text-on-navy">→ {pickLabel}</div>
            <div className="text-[10px] text-text-on-navy-weak mt-1">{fmtKO(m.kickoff)}</div>
          </div>
        );
      })}

      {/* ── ショートカット ── */}
      <div className="text-sm font-extrabold mx-5 mt-6 mb-2 text-text-on-navy">その他</div>
      <div className="grid grid-cols-3 gap-3 mx-5">
        {[
          {icon:"🪙",label:"コインショップ",action:()=>nav("coinshop")},
          {icon:"🏅",label:"バッジ",action:()=>nav("badges")},
          {icon:"🌐",label:"全国ランキング",action:()=>nav("ranking")},
        ].map((s,i)=>(
          <button key={i} onClick={s.action}
            className="rounded-xl p-3 text-center active:scale-[.98] transition border-0 cursor-pointer"
            style={{background:"#12244f",border:"1px solid rgba(255,255,255,0.1)"}}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-[10px] font-bold text-text-on-navy-dim">{s.label}</div>
          </button>
        ))}
      </div>

      {/* ── プロフィール編集モーダル ── */}
      {editNick&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5" style={{background:"rgba(6,21,51,0.92)",backdropFilter:"blur(4px)"}}>
          <div className="w-full max-w-sm bg-white rounded-card-lg p-6 shadow-hero">
            <div className="text-text-on-white font-black text-lg mb-4">✏️ プロフィール編集</div>
            <div className="mb-3">
              <label className="text-text-on-white-gray text-xs font-bold block mb-1">ニックネーム</label>
              <input value={editNickVal} onChange={e=>setEditNickVal(e.target.value)} maxLength={20}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-text-on-white outline-none focus:border-hinomaru"/>
            </div>
            <div className="mb-5">
              <label className="text-text-on-white-gray text-xs font-bold block mb-2">アイコン</label>
              <div className="grid grid-cols-5 gap-2">
                {ICONS.map(ic=>(
                  <button key={ic} onClick={()=>setEditIcon(ic)}
                    className={`text-2xl py-1.5 rounded-xl border-2 cursor-pointer bg-transparent transition${editIcon===ic?" border-hinomaru bg-red-50":" border-transparent"}`}>{ic}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setEditNick(false)} className="flex-1 py-3 border border-gray-200 rounded-card-lg text-text-on-white-gray font-bold text-sm bg-transparent cursor-pointer">キャンセル</button>
              <button onClick={saveNick} disabled={saving||!editNickVal.trim()}
                className="flex-1 py-3 bg-hinomaru text-white rounded-card-lg font-bold text-sm border-0 cursor-pointer disabled:opacity-50 shadow-cta-red">
                {saving?"保存中...":"保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App


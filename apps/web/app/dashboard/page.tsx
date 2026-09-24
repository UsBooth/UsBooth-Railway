"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import "./dashboard.css";

type User = { id: string; email: string; displayName: string };
type Booth = { id: string; type: "SOLO"|"COUPLE"|"RANDOM"; name: string; roomCode: string; description?: string|null; createdAt: string; updatedAt: string };
type BoothResponse = { booths?: Booth[]; limit?: number|null; remaining?: number|null };
type Memory = { id:string; title:string|null; template?:string|null; createdAt:string; asset:{photoDataUrl:string}|null; metadata?:Record<string,unknown>|null };

function greeting() { const h=new Date().getHours(); if(h<5)return "Late night,"; if(h<12)return "Good morning,"; if(h<18)return "Good afternoon,"; return "Good evening,"; }
function icon(type: Booth["type"]) { return type==="SOLO"?"◉":type==="COUPLE"?"♥":"✦"; }
function date(v:string){try{return new Intl.DateTimeFormat("en",{month:"short",day:"numeric",year:"numeric"}).format(new Date(v));}catch{return "Recently";}}

export default function DashboardPage(){
 const [user,setUser]=useState<User|null>(null),[booths,setBooths]=useState<Booth[]>([]),[memories,setMemories]=useState<Memory[]>([]),[avatar,setAvatar]=useState(""),[limit,setLimit]=useState<number|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{try{const [u,b,m]=await Promise.all([fetch("/api/auth/me",{credentials:"include",cache:"no-store"}),fetch("/api/booths",{credentials:"include",cache:"no-store"}),fetch("/api/memories",{credentials:"include",cache:"no-store"})]);if(u.status===401){window.location.href="/login?next=/dashboard";return;}const ud=await u.json().catch(()=>({}));const bd:BoothResponse=await b.json().catch(()=>({}));const md=await m.json().catch(()=>({}));if(!u.ok||!ud?.user){window.location.href="/login?next=/dashboard";return;}setUser(ud.user);setBooths(Array.isArray(bd.booths)?bd.booths:[]);setLimit(typeof bd.limit==="number"?bd.limit:null);setMemories(Array.isArray(md.memories)?md.memories:[]);try{setAvatar(localStorage.getItem("usbooth:avatar")||"");}catch{}}catch{setBooths([]);setMemories([]);}finally{setLoading(false);}})();},[]);
 const recentMemory=memories[0]||null;
 const favorites=memories.filter(m=>Boolean(m.metadata?.favorite||m.metadata?.isFavorite));
 const templateCounts=useMemo(()=>{const counts=new Map<string,number>();for(const m of memories){const t=String(m.metadata?.templateName||m.template||"Untitled");counts.set(t,(counts.get(t)||0)+1);}return [...counts.entries()].sort((a,b)=>b[1]-a[1]);},[memories]);
 const mostUsedTemplate=templateCounts[0]?.[0]||"Not yet";
 function setProfilePhoto(event:ChangeEvent<HTMLInputElement>){const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const value=String(reader.result||"");setAvatar(value);try{localStorage.setItem("usbooth:avatar",value);}catch{}};reader.readAsDataURL(file);}
 const recent=useMemo(()=>[...booths].sort((a,b)=>new Date(b.updatedAt||b.createdAt).getTime()-new Date(a.updatedAt||a.createdAt).getTime()).slice(0,4),[booths]);
 if(loading)return <main className="dashboard-page"><div className="dashboard-loading"><span>USBOOTH ✦</span><div/><p>Opening your little world...</p></div></main>;
 return <main className="dashboard-page"><div className="dashboard-shell">
  <header className="dashboard-hero"><div><p className="dashboard-kicker">YOUR USBOOTH</p><h1>{greeting()} <em>{user?.displayName?.split(" ")[0]||"there"}.</em></h1><p className="dashboard-lede">Your memories, favourites, profile and little UsBooth habits — all in one place.</p></div><div className="dashboard-hero-actions"><Link href="/account?create=true" className="dashboard-primary">CREATE A BOOTH <span>＋</span></Link><Link href="/memories" className="dashboard-secondary">VIEW MEMORIES</Link></div></header>

  <section className="dashboard-overview">
   <div className="dashboard-profile-card"><div className="dashboard-avatar-wrap">{avatar?<img src={avatar} alt="Profile"/>:<span>{user?.displayName?.charAt(0).toUpperCase()||"U"}</span>}<label htmlFor="dashboard-avatar">✎</label><input id="dashboard-avatar" type="file" accept="image/*" onChange={setProfilePhoto}/></div><div><p className="dashboard-kicker">YOUR PROFILE</p><h2>{user?.displayName||"UsBooth User"}</h2><p>{user?.email}</p><small>@{user?.displayName?.toLowerCase().replace(/\s+/g,"")||"username"}</small></div><Link href="/account" className="dashboard-edit-profile">MY BOOTHS →</Link></div>
   <div className="dashboard-mini-stats"><div><span>MEMORIES</span><strong>{memories.length}</strong></div><div><span>FAVOURITES</span><strong>{favorites.length}</strong></div><div><span>BOOTHS</span><strong>{booths.length}</strong></div><div><span>TOP TEMPLATE</span><strong className="template-stat">{mostUsedTemplate}</strong></div></div>
  </section>

  <section className="dashboard-section"><div className="dashboard-section-head"><div><p className="dashboard-kicker">LAST PHOTO CLICKED</p><h2>Your latest moment.</h2></div><Link href="/memories" className="dashboard-text-link">OPEN MEMORY VAULT →</Link></div>
   {recentMemory?.asset?.photoDataUrl?<div className="dashboard-latest"><img src={recentMemory.asset.photoDataUrl} alt={recentMemory.title||"Last UsBooth memory"}/><div><p className="dashboard-kicker">JUST NOW, IN YOUR STORY</p><h3>{recentMemory.title||"A little moment"}</h3><span>{new Date(recentMemory.createdAt).toLocaleString()}</span><div><Link href="/memories">VIEW MEMORY →</Link><Link href="/templates">MAKE ANOTHER →</Link></div></div></div>:<div className="dashboard-empty"><span>♡</span><strong>No photo yet.</strong><p>Your latest captured memory will appear here.</p><Link href="/account?create=true">TAKE YOUR FIRST PHOTO</Link></div>}
  </section>

  <section className="dashboard-section"><div className="dashboard-section-head compact"><div><p className="dashboard-kicker">KEPT CLOSE</p><h2>Favourite memories.</h2></div><Link href="/memories" className="dashboard-text-link">SEE ALL →</Link></div>
   {favorites.length?<div className="dashboard-favourites">{favorites.slice(0,4).map(m=><Link href="/memories" className="dashboard-favourite" key={m.id}>{m.asset?.photoDataUrl?<img src={m.asset.photoDataUrl} alt={m.title||"Favourite memory"}/>:<span>♡</span>}<strong>{m.title||"A little moment"}</strong></Link>)}</div>:<div className="dashboard-empty compact-empty"><span>♡</span><strong>Your favourites will live here.</strong><p>Favourite memories can become your little collection.</p><Link href="/memories">EXPLORE MEMORIES</Link></div>}
  </section>

  <section className="dashboard-section dashboard-account-section"><div className="dashboard-section-head compact"><div><p className="dashboard-kicker">ACCOUNT DETAILS</p><h2>Your little profile.</h2></div><Link href="/account" className="dashboard-text-link">MY BOOTHS →</Link></div>
   <div className="dashboard-account-grid">
    <div><span>DISPLAY NAME</span><strong>{user?.displayName||"—"}</strong></div>
    <div><span>USERNAME</span><strong>@{user?.displayName?.toLowerCase().replace(/\s+/g,"")||"—"}</strong></div>
    <div><span>EMAIL</span><strong>{user?.email||"—"}</strong></div>
    <div><span>PASSWORD</span><strong>••••••••</strong><Link href="/account">CHANGE PASSWORD →</Link></div>
   </div>
  </section>

  <section className="dashboard-section"><div className="dashboard-section-head compact"><div><p className="dashboard-kicker">MOST USED</p><h2>Your template habit.</h2></div><Link href="/templates" className="dashboard-text-link">BROWSE TEMPLATES →</Link></div>
   <div className="dashboard-template-card"><div className="dashboard-template-symbol">✧</div><div><p>YOUR MOST USED TEMPLATE</p><h3>{mostUsedTemplate}</h3><span>{templateCounts[0]?.[1]||0} {templateCounts[0]?.[1]===1?"memory":"memories"} made with it</span></div><Link href="/templates">FIND ANOTHER →</Link></div>
  </section>

  <section className="dashboard-section dashboard-actions-section"><div className="dashboard-section-head compact"><div><p className="dashboard-kicker">QUICKLY, THIS WAY</p><h2>What are we doing today?</h2></div></div><div className="dashboard-action-grid"><Link href="/account?create=true" className="dashboard-action-card action-plum"><span>✦</span><div><strong>Create a Booth</strong><small>Start a new photo session.</small></div><b>→</b></Link><Link href="/join" className="dashboard-action-card action-lavender"><span>◉</span><div><strong>Join a Room</strong><small>Enter someone's room code.</small></div><b>→</b></Link><Link href="/templates" className="dashboard-action-card action-rose"><span>✧</span><div><strong>Find a Template</strong><small>Pick the mood for your next one.</small></div><b>→</b></Link><Link href="/memories" className="dashboard-action-card action-sage"><span>♡</span><div><strong>Look Back</strong><small>Revisit what you've kept.</small></div><b>→</b></Link></div></section>

  <section className="dashboard-bottom-grid"><Link href="/templates" className="dashboard-feature-card"><span className="dashboard-feature-symbol">✦</span><p className="dashboard-kicker">MAKE IT YOURS</p><h2>Find the one that feels like you.</h2><span className="dashboard-feature-link">BROWSE TEMPLATES →</span></Link><div className="dashboard-quote-card"><span>“</span><p>Some moments are small enough to keep, and important enough to remember.</p><small>— USBOOTH</small></div></section>
 </div></main>;
}
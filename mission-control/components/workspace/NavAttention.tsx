"use client";
import {useEffect,useState} from "react";
import {usePersonal} from "@/lib/workspace/personal";
import {useBoard} from "@/lib/workspace/useBoard";
import {boardTasks} from "@/lib/workspace/board";
import {useAuthStore} from "@/lib/store";
export function useNavAttention(){
  const goals=usePersonal(s=>s.goals), {board}=useBoard(), user=useAuthStore(s=>s.user?.name||null);
  const [mail,setMail]=useState<number|null>(null);
  useEffect(()=>{let timer:ReturnType<typeof setTimeout>;const clear=()=>setMail(null);const signal=(e:Event)=>{const n=(e as CustomEvent).detail?.unread;setMail(Number.isSafeInteger(n)&&n>=0?n:null);clearTimeout(timer);timer=setTimeout(clear,120000);};window.addEventListener("neo-mail-activity",signal);window.addEventListener("focus",clear);return()=>{clearTimeout(timer);window.removeEventListener("neo-mail-activity",signal);window.removeEventListener("focus",clear);};},[]);
  const [today,setToday]=useState("");useEffect(()=>{const tick=()=>{const now=new Date();setToday(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`);};tick();const timer=setInterval(tick,60000);return()=>clearInterval(timer)},[]);
  const overdue=goals.filter(g=>!g.done&&/^\d{4}-\d{2}-\d{2}/.test(g.due)&&g.due.slice(0,10)<today).length;
  const urgent=boardTasks(board,user).filter(t=>!t.done&&t.priority==="urgent").length;
  return {inbox:{count:mail??0,label:`${mail??0} ungelesene Nachrichten · zuletzt geöffnetes persönliches Postfach`},planner:{count:overdue,label:`${overdue} überfällige Ziele`},tasks:{count:urgent,label:`${urgent} offene Aufgaben mit Priorität dringend`}};
}

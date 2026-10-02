export type CompanionMood = "calm" | "celebrate" | "rest" | "focus";
export function companionMood({completed,activeMinutes,unreadMail,adaptive=true}:{completed:number;activeMinutes:number;unreadMail:number|null;adaptive?:boolean}):{mood:CompanionMood;label:string;reason:string} {
  if(!adaptive)return {mood:"calm",label:"In deiner Ruhe",reason:"Aktivitätsreaktionen sind ausgeschaltet."};
  if(activeMinutes>=45)return {mood:"rest",label:"Ein Atemzug Pause?",reason:"Du warst in diesem Tab mindestens 45 Minuten aktiv. Deine Pause zählt genauso."};
  if(completed>0)return {mood:"celebrate",label:"Ein Schritt geschafft",reason:`${completed} Aufgabe${completed===1?"":"n"} in dieser Sitzung abgeschlossen.`};
  if(unreadMail!==null && unreadMail>0)return {mood:"focus",label:"Eins nach dem anderen",reason:`Dein zuletzt geöffnetes Postfach meldete ${unreadMail} ungelesene Nachricht${unreadMail===1?"":"en"}.`};
  return {mood:"calm",label:"Raum für deinen nächsten Schritt",reason:"Ich begleite dich in deinem Tempo. Es gibt keinen Punktestand und keinen Zeitdruck."};
}

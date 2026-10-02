export type WidgetAction = 'open' | 'dictate' | 'append' | 'send';
export function widgetShortcut(e: Pick<KeyboardEvent,'key'|'code'|'altKey'|'ctrlKey'|'metaKey'|'shiftKey'|'isComposing'>): WidgetAction | null {
  if(!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.isComposing)return null;
  // Character keys support QWERTZ; physical fallbacks also handle macOS Option symbols.
  const key=e.key.toLowerCase();
  if(key==='y' || e.code==='KeyY' || e.code==='KeyZ')return 'open';
  if(key==='x' || e.code==='KeyX')return 'dictate';
  if(key==='h' || e.code==='KeyH')return 'append';
  if(key==='c' || e.code==='KeyC')return 'send';
  return null;
}
export function insertDictation(current:string, spoken:string, append:boolean, start=current.length, end=start) {
  const incoming=spoken.trim();if(!incoming)return current;
  if(append)return current+(current && !/\s$/.test(current)?'\n':'')+incoming;
  const from=Math.max(0,Math.min(start,current.length)),to=Math.max(from,Math.min(end,current.length));
  const before=current.slice(0,from),after=current.slice(to);
  return before+(before && !/\s$/.test(before)?' ':'')+incoming+(after && !/^\s/.test(after)?' ':'')+after;
}
